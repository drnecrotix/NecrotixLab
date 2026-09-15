'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Extension, Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor, type Editor, type NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Box,
    ChevronDown,
    Code,
    Eraser,
    Italic,
    Link2,
    Link2Off,
    List,
    ListOrdered,
    Minus,
    Quote,
    Redo2,
    SquareCode,
    Strikethrough,
    Terminal,
    Type,
    Undo2,
    Zap,
} from 'lucide-react';
import { PretextMenu } from '@/components/admin/PretextMenu';

const tool = 'inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-white/60 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30';
const activeTool = `${tool} border-white/25 bg-white/[0.1] text-white`;
const group = 'flex shrink-0 items-center gap-1';
const row = 'flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
const divider = 'hidden h-6 w-px shrink-0 bg-white/10 sm:block';

type EditorShortcode = {
    label: string;
    value: string;
    description?: string;
};

type DraftRestoreDetail = {
    fields?: Record<string, string[]>;
};

type Props = {
    name: string;
    initialValue?: string;
    poetry?: boolean;
    shortcodes?: EditorShortcode[];
    variant?: 'default' | 'journal';
    onChange?: (value: string) => void;
    minHeightClass?: string;
};

type Alignment = 'left' | 'center' | 'right' | 'justify';
type TextStyle = 'p' | 'h2' | 'h3' | 'h4';
type ProjectBlockKind = 'mission' | 'features' | 'chronicles' | 'installation';

const BLOCK_TOKEN = /^\[\[(mission|features|chronicles|installation)\]\]$/i;

const BLOCK_META: Record<ProjectBlockKind, { label: string; hint: string; className: string; icon: typeof Box }> = {
    mission: {
        label: 'Mission Brief',
        hint: 'Project overview heading',
        className: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-100',
        icon: Box,
    },
    features: {
        label: 'Features',
        hint: 'Renders the following list as feature cards',
        className: 'border-sky-400/25 bg-sky-400/[0.08] text-sky-100',
        icon: Zap,
    },
    chronicles: {
        label: 'Engineering Chronicles',
        hint: 'Renders following headings as problem / solution',
        className: 'border-amber-400/25 bg-amber-400/[0.08] text-amber-100',
        icon: Terminal,
    },
    installation: {
        label: 'Installation',
        hint: 'Renders following steps or code blocks',
        className: 'border-violet-400/25 bg-violet-400/[0.08] text-violet-100',
        icon: SquareCode,
    },
};

function kindFromShortcode(value: string): ProjectBlockKind | null {
    const match = value.trim().match(BLOCK_TOKEN);
    return match ? match[1].toLowerCase() as ProjectBlockKind : null;
}

function ProjectBlockView({ node, deleteNode }: NodeViewProps) {
    const kind = (String(node.attrs.kind || 'mission')) as ProjectBlockKind;
    const meta = BLOCK_META[kind] ?? BLOCK_META.mission;
    const Icon = meta.icon;

    return (
        <NodeViewWrapper className="my-3" data-project-block={kind}>
            <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${meta.className}`} contentEditable={false}>
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/20">
                        <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold leading-none">{meta.label}</p>
                        <p className="mt-1 text-[11px] text-white/45">{meta.hint}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={deleteNode}
                    className="rounded-md px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-white/40 transition hover:bg-black/20 hover:text-white"
                >
                    Remove
                </button>
            </div>
        </NodeViewWrapper>
    );
}

const ProjectBlock = Node.create({
    name: 'projectBlock',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
        return {
            kind: {
                default: 'mission',
                parseHTML: (element) => element.getAttribute('data-project-block') || 'mission',
                renderHTML: () => ({}),
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'div[data-project-block]',
                getAttrs: (element) => {
                    if (!(element instanceof HTMLElement)) return false;
                    const kind = element.getAttribute('data-project-block');
                    return kind && kind in BLOCK_META ? { kind } : false;
                },
            },
            {
                tag: 'p',
                getAttrs: (element) => {
                    if (!(element instanceof HTMLElement)) return false;
                    const kind = kindFromShortcode(element.textContent || '');
                    return kind ? { kind } : false;
                },
            },
        ];
    },
    renderHTML({ node }) {
        const kind = (node.attrs.kind || 'mission') as ProjectBlockKind;
        return ['p', mergeAttributes({ 'data-project-block': kind }), `[[${kind}]]`];
    },
    renderText({ node }) {
        return `[[${node.attrs.kind || 'mission'}]]`;
    },
    addNodeView() {
        return ReactNodeViewRenderer(ProjectBlockView);
    },
    addInputRules() {
        return [
            nodeInputRule({
                find: /\[\[(mission|features|chronicles|installation)\]\]$/,
                type: this.type,
                getAttributes: (match) => ({ kind: match[1].toLowerCase() }),
            }),
        ];
    },
});

const TextAlignment = Extension.create({
    name: 'textAlignment',
    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading'],
                attributes: {
                    textAlign: {
                        default: null,
                        parseHTML: (element) => element.style.textAlign || null,
                        renderHTML: (attributes) => attributes.textAlign ? { style: `text-align: ${attributes.textAlign}` } : {},
                    },
                },
            },
        ];
    },
});

function ToolButton({
    title,
    active = false,
    disabled = false,
    onClick,
    children,
}: {
    title: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick} className={active ? activeTool : tool}>
            {children}
        </button>
    );
}

export function PostEditor({
    name,
    initialValue = '',
    poetry = false,
    shortcodes = [],
    variant = 'default',
    onChange,
    minHeightClass,
}: Props) {
    if (poetry) {
        return (
            <textarea
                name={name}
                defaultValue={initialValue}
                rows={22}
                className={`min-h-[34rem] w-full whitespace-pre-wrap rounded-2xl border border-white/10 px-6 py-6 font-serif text-lg leading-8 text-white outline-none focus:border-white/25 ${variant === 'journal' ? 'bg-[#0d0d0d] shadow-[0_20px_80px_rgba(0,0,0,0.22)]' : 'bg-white/[0.025]'}`}
                placeholder="Write the poem exactly as it should appear. Line breaks and stanzas are preserved."
            />
        );
    }

    return (
        <RichEditor
            name={name}
            initialValue={initialValue}
            shortcodes={shortcodes}
            variant={variant}
            onChange={onChange}
            minHeightClass={minHeightClass}
        />
    );
}

function RichEditor({
    name,
    initialValue,
    shortcodes,
    variant,
    onChange,
    minHeightClass,
}: {
    name: string;
    initialValue: string;
    shortcodes: EditorShortcode[];
    variant: 'default' | 'journal';
    onChange?: (value: string) => void;
    minHeightClass?: string;
}) {
    const [html, setHtml] = useState(initialValue);
    const [blockMenuOpen, setBlockMenuOpen] = useState(false);
    const heightClass = minHeightClass || (variant === 'journal' ? 'min-h-[38rem]' : 'min-h-[34rem]');
    const editorClass = variant === 'journal'
        ? `${heightClass} mx-auto max-w-3xl px-6 py-10 sm:px-10 outline-none prose prose-lg prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h2:mt-14 prose-h2:mb-5 prose-h3:mt-10 prose-h3:mb-4 prose-h4:mt-8 prose-h4:mb-3 prose-h4:text-base prose-h4:uppercase prose-h4:tracking-[0.12em] prose-p:my-6 prose-p:text-[1.05rem] prose-p:leading-8 prose-p:text-white/78 prose-a:text-sky-300 prose-a:underline-offset-4 prose-hr:my-12 prose-hr:border-white/10 prose-blockquote:my-10 prose-blockquote:rounded-r-2xl prose-blockquote:border-l-4 prose-blockquote:border-fuchsia-300/80 prose-blockquote:bg-white/[0.035] prose-blockquote:px-7 prose-blockquote:py-5 prose-blockquote:text-xl prose-blockquote:font-medium prose-blockquote:italic prose-blockquote:leading-9 prose-blockquote:text-white/90 prose-blockquote:[quotes:none] prose-blockquote:before:content-none prose-blockquote:after:content-none prose-code:rounded prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-pink-200 prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/40 prose-li:text-white/75`
        : `${heightClass} max-w-none px-6 py-6 outline-none prose prose-invert prose-headings:tracking-tight prose-a:text-sky-300 prose-blockquote:my-7 prose-blockquote:rounded-r-xl prose-blockquote:border-l-4 prose-blockquote:border-emerald-400 prose-blockquote:bg-emerald-400/[0.07] prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:text-lg prose-blockquote:italic prose-blockquote:leading-8 prose-blockquote:text-white/85 prose-blockquote:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] prose-blockquote:[quotes:none] prose-blockquote:before:content-none prose-blockquote:after:content-none prose-code:before:content-none prose-code:after:content-none`;

    const extensions = useMemo(
        () => [
            StarterKit,
            TextAlignment,
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            ...(shortcodes.length > 0 ? [ProjectBlock] : []),
        ],
        [shortcodes.length],
    );

    const editor = useEditor({
        immediatelyRender: false,
        extensions,
        content: initialValue || '<p></p>',
        editorProps: { attributes: { class: editorClass } },
        onUpdate: ({ editor: current }) => {
            const value = current.getHTML();
            setHtml(value);
            onChange?.(value);
        },
    });

    useEffect(() => {
        if (editor && initialValue && editor.getHTML() !== initialValue) editor.commands.setContent(initialValue);
    }, [editor, initialValue]);

    useEffect(() => {
        if (!editor) return;
        const restoreDraft = (event: Event) => {
            const detail = (event as CustomEvent<DraftRestoreDetail>).detail;
            const restored = detail?.fields?.[name]?.[0];
            if (typeof restored !== 'string') return;
            editor.commands.setContent(restored || '<p></p>');
            setHtml(restored);
            onChange?.(restored);
        };
        window.addEventListener('necrotix:draft-restore', restoreDraft);
        return () => window.removeEventListener('necrotix:draft-restore', restoreDraft);
    }, [editor, name, onChange]);

    const setLink = () => {
        if (!editor) return;
        const previous = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link URL', previous || 'https://');
        if (url === null) return;
        if (!url.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    };

    const insertShortcode = (value: string) => {
        if (!editor || !value) return;
        const kind = kindFromShortcode(value);
        if (kind) {
            editor.chain().focus().insertContent({ type: 'projectBlock', attrs: { kind } }).run();
        } else {
            editor.chain().focus().insertContent(`<p>${value}</p>`).run();
        }
        setBlockMenuOpen(false);
    };

    const applyTextStyle = (style: TextStyle) => {
        if (!editor) return;
        if (style === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
        else if (style === 'h3') editor.chain().focus().setHeading({ level: 3 }).run();
        else if (style === 'h4') editor.chain().focus().setHeading({ level: 4 }).run();
        else editor.chain().focus().setParagraph().run();
    };

    const setAlignment = (alignment: Alignment) => {
        if (!editor) return;
        editor.chain().focus().command(({ tr, state }) => {
            const { from, to } = state.selection;
            let changed = false;
            state.doc.nodesBetween(from, to, (node, pos) => {
                if (node.type.name !== 'paragraph' && node.type.name !== 'heading') return;
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, textAlign: alignment });
                changed = true;
            });
            return changed;
        }).run();
    };

    const currentAlignment = (alignment: Alignment) => editor?.isActive({ textAlign: alignment }) ?? false;
    const currentTextStyle: TextStyle = editor?.isActive('heading', { level: 2 })
        ? 'h2'
        : editor?.isActive('heading', { level: 3 })
            ? 'h3'
            : editor?.isActive('heading', { level: 4 })
                ? 'h4'
                : 'p';

    return (
        <div className={`min-w-0 overflow-hidden rounded-2xl border border-white/10 ${variant === 'journal' ? 'bg-[#0b0b0b] shadow-[0_24px_80px_rgba(0,0,0,0.26)]' : 'bg-white/[0.025]'}`}>
            <div className="sticky top-0 z-10 border-b border-white/10 bg-[#101010]/95 px-3 py-2.5 backdrop-blur-xl">
                {variant === 'journal' && (
                    <div className="mb-2 flex items-center justify-between gap-3 px-1">
                        <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">Typography</span>
                        <span className="hidden text-[10px] text-white/25 sm:block">Select text, then apply a style</span>
                    </div>
                )}
                <EditorToolbar
                    editor={editor}
                    currentTextStyle={currentTextStyle}
                    applyTextStyle={applyTextStyle}
                    setAlignment={setAlignment}
                    currentAlignment={currentAlignment}
                    setLink={setLink}
                    shortcodes={shortcodes}
                    blockMenuOpen={blockMenuOpen}
                    setBlockMenuOpen={setBlockMenuOpen}
                    insertShortcode={insertShortcode}
                />
            </div>
            {variant === 'journal' && <div className="border-b border-white/5 px-6 py-3 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-white/25">Journal canvas · write first, format second</div>}
            <EditorContent editor={editor} />
            <input type="hidden" name={name} value={html} readOnly />
        </div>
    );
}

function EditorToolbar({
    editor,
    currentTextStyle,
    applyTextStyle,
    setAlignment,
    currentAlignment,
    setLink,
    shortcodes,
    blockMenuOpen,
    setBlockMenuOpen,
    insertShortcode,
}: {
    editor: Editor | null;
    currentTextStyle: TextStyle;
    applyTextStyle: (style: TextStyle) => void;
    setAlignment: (alignment: Alignment) => void;
    currentAlignment: (alignment: Alignment) => boolean;
    setLink: () => void;
    shortcodes: EditorShortcode[];
    blockMenuOpen: boolean;
    setBlockMenuOpen: (open: boolean) => void;
    insertShortcode: (value: string) => void;
}) {
    const [pretextOpen, setPretextOpen] = useState(false);
    const menusRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!menusRef.current?.contains(event.target as Node)) {
                setBlockMenuOpen(false);
                setPretextOpen(false);
            }
        };
        window.addEventListener('mousedown', close);
        return () => window.removeEventListener('mousedown', close);
    }, [setBlockMenuOpen]);

    return (
        <div ref={menusRef} className="flex flex-col gap-2">
            <div className={row}>
                <div className={group}>
                    <label className="relative">
                        <Type className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
                        <select
                            aria-label="Text style"
                            title="Paragraph and heading hierarchy"
                            value={currentTextStyle}
                            onChange={(event) => applyTextStyle(event.target.value as TextStyle)}
                            className="min-h-8 appearance-none rounded-md border border-white/10 bg-black/30 py-1.5 pl-8 pr-7 text-xs text-white/70 outline-none [color-scheme:dark] [&>option]:bg-[#151515] [&>option]:text-white"
                        >
                            <option value="p">Paragraph</option>
                            <option value="h2">Heading 2</option>
                            <option value="h3">Heading 3</option>
                            <option value="h4">Heading 4 / Label</option>
                        </select>
                    </label>
                    <ToolButton title="Bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="size-3.5" /></ToolButton>
                    <ToolButton title="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="size-3.5" /></ToolButton>
                    <ToolButton title="Strikethrough" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough className="size-3.5" /></ToolButton>
                    <ToolButton title="Inline code" active={editor?.isActive('code')} onClick={() => editor?.chain().focus().toggleCode().run()}><Code className="size-3.5" /></ToolButton>
                </div>

                <span className={divider} />

                <div className={group}>
                    <ToolButton title="Bullet list" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="size-3.5" /></ToolButton>
                    <ToolButton title="Numbered list" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-3.5" /></ToolButton>
                    <ToolButton title="Quote" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="size-3.5" /></ToolButton>
                    <ToolButton title="Divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus className="size-3.5" /></ToolButton>
                    <ToolButton title="Code block" active={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><SquareCode className="size-3.5" /></ToolButton>
                    <ToolButton title="Add or edit link" active={editor?.isActive('link')} onClick={setLink}><Link2 className="size-3.5" /></ToolButton>
                    {editor?.isActive('link') && <ToolButton title="Remove link" onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}><Link2Off className="size-3.5" /></ToolButton>}
                </div>

                <span className={divider} />

                <div className={group}>
                    <ToolButton title="Align left" active={currentAlignment('left')} onClick={() => setAlignment('left')}><AlignLeft className="size-3.5" /></ToolButton>
                    <ToolButton title="Align center" active={currentAlignment('center')} onClick={() => setAlignment('center')}><AlignCenter className="size-3.5" /></ToolButton>
                    <ToolButton title="Align right" active={currentAlignment('right')} onClick={() => setAlignment('right')}><AlignRight className="size-3.5" /></ToolButton>
                    <ToolButton title="Justify" active={currentAlignment('justify')} onClick={() => setAlignment('justify')}><AlignJustify className="size-3.5" /></ToolButton>
                </div>

                <div className={`${group} ml-auto`}>
                    <ToolButton title="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><Undo2 className="size-3.5" /></ToolButton>
                    <ToolButton title="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><Redo2 className="size-3.5" /></ToolButton>
                    <ToolButton title="Clear formatting" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="size-3.5" /></ToolButton>
                </div>
            </div>

            <div className={row}>
                {shortcodes.length > 0 && (
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            title="Insert project block"
                            aria-expanded={blockMenuOpen}
                            onClick={() => { setPretextOpen(false); setBlockMenuOpen(!blockMenuOpen); }}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/[0.08] px-2.5 text-xs text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/[0.14]"
                        >
                            <Box className="size-3.5" />
                            Project block
                            <ChevronDown className="size-3 opacity-60" />
                        </button>
                        {blockMenuOpen && (
                            <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#151515] shadow-2xl">
                                {shortcodes.map((shortcode) => {
                                    const kind = kindFromShortcode(shortcode.value);
                                    const meta = kind ? BLOCK_META[kind] : null;
                                    const Icon = meta?.icon ?? Box;
                                    return (
                                        <button
                                            key={shortcode.value}
                                            type="button"
                                            onClick={() => insertShortcode(shortcode.value)}
                                            className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
                                        >
                                            <span className="mt-0.5 inline-flex size-7 items-center justify-center rounded-lg bg-white/[0.04] text-emerald-300">
                                                <Icon className="size-3.5" />
                                            </span>
                                            <span>
                                                <span className="block text-sm text-white/85">{shortcode.label}</span>
                                                <span className="mt-0.5 block text-[11px] text-white/35">{meta?.hint || shortcode.value}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <PretextMenu
                    editor={editor}
                    open={pretextOpen}
                    onOpenChange={(next) => {
                        if (next) setBlockMenuOpen(false);
                        setPretextOpen(next);
                    }}
                />
            </div>
        </div>
    );
}
