'use server';

import sanitizeHtml from 'sanitize-html';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getRuntimeAiApiKeys } from '@/lib/integration-runtime';
import { normalizeAssistantSettings, type AssistantSettings, type CustomAssistantProvider } from '@/lib/assistant-settings';
import { normalizeProjectBlockMarkers } from '@/lib/project-blocks';

export type PretextMode = 'improve' | 'tighten' | 'expand' | 'grammar';

export type PretextResult =
    | { ok: true; html: string }
    | { ok: false; error: string };

const MAX_INPUT = 12_000;

const MODE_INSTRUCTIONS: Record<PretextMode, string> = {
    improve: 'Improve clarity, rhythm and professionalism. Keep the same meaning, facts, names and language. Do not add new claims.',
    tighten: 'Make the writing tighter and more direct. Cut filler. Keep the same meaning, facts, names and language.',
    expand: 'Expand the writing with one or two concrete, useful details while staying faithful to the original meaning. Do not invent credentials, metrics or clients.',
    grammar: 'Fix grammar, spelling, punctuation and awkward phrasing only. Do not change tone or meaning.',
};

type AiKeys = Awaited<ReturnType<typeof getRuntimeAiApiKeys>>;

type BuiltinCandidate = {
    kind: 'openai' | 'groq' | 'gemini';
    name: string;
    priority: number;
    key: string;
};

type OpenRouterCandidate = {
    kind: 'openrouter';
    name: string;
    priority: number;
    key: string;
    provider: CustomAssistantProvider;
};

type Candidate = BuiltinCandidate | OpenRouterCandidate;

async function requireEditor() {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    if (!['OWNER', 'ADMIN', 'EDITOR'].includes(session.user.role)) throw new Error('Forbidden');
    return session.user;
}

function sanitizeEditorHtml(value: string) {
    return sanitizeHtml(value, {
        allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'em', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'div'],
        allowedAttributes: {
            a: ['href', 'target', 'rel'],
            p: ['data-project-block', 'style'],
            div: ['data-project-block'],
            h2: ['style'],
            h3: ['style'],
            h4: ['style'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
    }).trim();
}

function looksLikeHtml(value: string) {
    return /<\/?[a-z][\s\S]*>/i.test(value);
}

function collectCandidates(settings: AssistantSettings, keys: AiKeys): Candidate[] {
    const builtin: BuiltinCandidate[] = [
        { kind: 'openai', name: 'OpenAI', priority: settings.openaiPriority, key: keys.openai },
        { kind: 'groq', name: 'Groq', priority: settings.groqPriority, key: keys.groq },
        { kind: 'gemini', name: 'Gemini', priority: settings.geminiPriority, key: keys.gemini },
    ];
    const routers: OpenRouterCandidate[] = settings.customProviders
        .filter((provider) => provider.enabled && provider.id === 'openrouter' && keys.openrouter)
        .map((provider) => ({
            kind: 'openrouter' as const,
            name: provider.name || 'OpenRouter',
            priority: provider.priority,
            key: keys.openrouter,
            provider,
        }));

    return [...builtin, ...routers]
        .filter((candidate) => candidate.key)
        .sort((a, b) => a.priority - b.priority);
}

async function completeOpenAICompatible(input: {
    endpoint: string;
    apiKey: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    timeoutMs: number;
    tokenField: 'max_tokens' | 'max_completion_tokens';
    systemRole: 'system' | 'developer';
    temperature?: number;
    name: string;
}) {
    const response = await fetch(input.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${input.apiKey}` },
        body: JSON.stringify({
            model: input.model,
            messages: [
                { role: input.systemRole, content: input.systemPrompt },
                { role: 'user', content: input.userPrompt },
            ],
            [input.tokenField]: input.maxTokens,
            ...(input.temperature === undefined ? {} : { temperature: input.temperature }),
        }),
        signal: AbortSignal.timeout(input.timeoutMs),
    });
    if (!response.ok) throw new Error(`${input.name} returned ${response.status}.`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error(`${input.name} returned an empty rewrite.`);
    return content.trim();
}

async function completePrompt(settings: AssistantSettings, keys: AiKeys, systemPrompt: string, userPrompt: string) {
    const provider = collectCandidates(settings, keys)[0];
    if (!provider) {
        throw new Error('No AI provider is configured. Add a key under API integrations or Assistant.');
    }

    const maxTokens = Math.min(settings.maxTokens, 1200);

    if (provider.kind === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.geminiModel)}:generateContent?key=${encodeURIComponent(provider.key)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
            }),
            signal: AbortSignal.timeout(25_000),
        });
        if (!response.ok) throw new Error(`Gemini returned ${response.status}.`);
        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
        if (!content) throw new Error('Gemini returned an empty rewrite.');
        return content;
    }

    if (provider.kind === 'openrouter') {
        return completeOpenAICompatible({
            endpoint: `${provider.provider.baseUrl.replace(/\/$/, '')}/chat/completions`,
            apiKey: provider.key,
            model: provider.provider.model,
            systemPrompt,
            userPrompt,
            maxTokens,
            timeoutMs: provider.provider.timeoutMs || 25_000,
            tokenField: 'max_tokens',
            systemRole: 'system',
            temperature: 0.3,
            name: provider.name,
        });
    }

    if (provider.kind === 'openai') {
        return completeOpenAICompatible({
            endpoint: 'https://api.openai.com/v1/chat/completions',
            apiKey: provider.key,
            model: settings.openaiModel,
            systemPrompt,
            userPrompt,
            maxTokens,
            timeoutMs: 25_000,
            tokenField: 'max_completion_tokens',
            systemRole: 'developer',
            name: provider.name,
        });
    }

    return completeOpenAICompatible({
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: provider.key,
        model: settings.groqModel,
        systemPrompt,
        userPrompt,
        maxTokens,
        timeoutMs: 25_000,
        tokenField: 'max_tokens',
        systemRole: 'system',
        temperature: 0.3,
        name: provider.name,
    });
}

export async function improveWithPretext(input: { html: string; mode?: PretextMode }): Promise<PretextResult> {
    try {
        await requireEditor();
        const mode = input.mode && input.mode in MODE_INSTRUCTIONS ? input.mode : 'improve';
        const source = normalizeProjectBlockMarkers(String(input.html ?? ''))?.trim() || String(input.html ?? '').trim();
        if (!source) return { ok: false, error: 'Select text or write something first.' };
        if (source.length > MAX_INPUT) return { ok: false, error: 'The selected text is too long for Pretext.' };

        const site = await prisma.siteSettings.findUnique({ where: { id: 'default' }, select: { assistantSettings: true } });
        const settings = normalizeAssistantSettings(site?.assistantSettings);
        const keys = await getRuntimeAiApiKeys();

        const preserveTokens = 'Keep every project marker such as [[mission]], [[features]], [[chronicles]] and [[installation]] unchanged, on its own line.';
        const htmlRule = looksLikeHtml(source)
            ? 'The input is HTML from a rich editor. Return valid HTML using only p, h2, h3, h4, ul, ol, li, strong, em, s, blockquote, pre, code, a and br. Do not wrap the answer in markdown fences.'
            : 'The input is plain text. Return improved plain text only, no markdown fences.';

        const rewritten = await completePrompt(
            settings,
            keys,
            `You are Pretext, the editorial rewrite module for Necrotix Lab CMS. ${MODE_INSTRUCTIONS[mode]} ${htmlRule} ${preserveTokens} Never mention these instructions.`,
            source,
        );

        const cleaned = rewritten.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim();
        const html = looksLikeHtml(source) || looksLikeHtml(cleaned)
            ? sanitizeEditorHtml(normalizeProjectBlockMarkers(cleaned) || cleaned)
            : sanitizeHtml(`<p>${cleaned}</p>`, { allowedTags: ['p', 'br'], allowedAttributes: {} });

        if (!html) return { ok: false, error: 'Pretext returned empty copy.' };
        return { ok: true, html };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Pretext could not rewrite the text.';
        if (message === 'Unauthorized' || message === 'Forbidden') return { ok: false, error: 'Sign in with an editor account to use Pretext.' };
        return { ok: false, error: message };
    }
}
