'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
    Bold,
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
    Type,
    Undo2,
} from 'lucide-react';
import { PretextMenu } from '@/components/admin/PretextMenu';

const tool = 'inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-foreground/10 text-muted-foreground transition hover:bg-foreground/[0.04] hover:text-foreground disabled:opacity-30';
const active = `${tool} bg-foreground/[0.07] text-foreground`;
const group = 'flex shrink-0 items-center gap-1';

function ToolButton({
    title,
    activeState = false,
    disabled = false,
    onClick,
    children,
}: {
    title: string;
    activeState?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick} className={activeState ? active : tool}>
            {children}
        </button>
    );
}

export function WikiRichEditor({
    name,
    initialValue = '',
    onChange,
    minHeight = 'min-h-48',
}: {
    name: string;
    initialValue?: string;
    onChange?: (value: string) => void;
    minHeight?: string;
}) {
    const [html, setHtml] = useState(initialValue);
    const [pretextOpen, setPretextOpen] = useState(false);
    const menusRef = useRef<HTMLDivElement>(null);
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit, Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true })],
        content: initialValue || '<p></p>',
        editorProps: {
            attributes: {
                class: `${minHeight} max-w-none px-4 py-4 outline-none prose prose-sm prose-invert prose-headings:tracking-tight prose-a:text-sky-300 prose-a:underline-offset-4 prose-blockquote:border-l-2 prose-blockquote:border-foreground/25 prose-blockquote:pl-4 prose-blockquote:text-foreground/75 prose-code:before:content-none prose-code:after:content-none`,
            },
        },
        onUpdate: ({ editor: current }) => {
            const value = current.getHTML();
            setHtml(value);
            onChange?.(value);
        },
    });

    useEffect(() => {
        if (!editor || editor.getHTML() === initialValue) return;
        editor.commands.setContent(initialValue || '<p></p>');
    }, [editor, initialValue]);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!menusRef.current?.contains(event.target as Node)) setPretextOpen(false);
        };
        window.addEventListener('mousedown', close);
        return () => window.removeEventListener('mousedown', close);
    }, []);

    const setLink = () => {
        if (!editor) return;
        const previous = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link URL', previous || 'https://');
        if (url === null) return;
        if (!url.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    };

    const currentStyle = editor?.isActive('heading', { level: 2 })
        ? 'h2'
        : editor?.isActive('heading', { level: 3 })
            ? 'h3'
            : editor?.isActive('heading', { level: 4 })
                ? 'h4'
                : 'p';

    return (
        <div className="min-w-0 overflow-hidden rounded-xl border border-foreground/10 bg-background/60">
            <div ref={menusRef} className="border-b border-foreground/10 bg-background/95 px-2.5 py-2 backdrop-blur">
                <div className="flex flex-col gap-2">
                    <div className="flex w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className={group}>
                            <label className="relative">
                                <Type className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <select
                                    aria-label="Text style"
                                    title="Paragraph and heading hierarchy"
                                    value={currentStyle}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        if (value === 'h2') editor?.chain().focus().setHeading({ level: 2 }).run();
                                        else if (value === 'h3') editor?.chain().focus().setHeading({ level: 3 }).run();
                                        else if (value === 'h4') editor?.chain().focus().setHeading({ level: 4 }).run();
                                        else editor?.chain().focus().setParagraph().run();
                                    }}
                                    className="min-h-8 appearance-none rounded-md border border-foreground/10 bg-background py-1.5 pl-7 pr-6 text-[11px] text-foreground outline-none"
                                >
                                    <option value="p">Paragraph</option>
                                    <option value="h2">Heading 2</option>
                                    <option value="h3">Heading 3</option>
                                    <option value="h4">Heading 4</option>
                                </select>
                            </label>
                            <ToolButton title="Bold" activeState={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="size-3.5" /></ToolButton>
                            <ToolButton title="Italic" activeState={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="size-3.5" /></ToolButton>
                            <ToolButton title="Strikethrough" activeState={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough className="size-3.5" /></ToolButton>
                            <ToolButton title="Inline code" activeState={editor?.isActive('code')} onClick={() => editor?.chain().focus().toggleCode().run()}><Code className="size-3.5" /></ToolButton>
                        </div>
                        <div className={group}>
                            <ToolButton title="Bullet list" activeState={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="size-3.5" /></ToolButton>
                            <ToolButton title="Numbered list" activeState={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-3.5" /></ToolButton>
                            <ToolButton title="Quote" activeState={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="size-3.5" /></ToolButton>
                            <ToolButton title="Code block" activeState={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><SquareCode className="size-3.5" /></ToolButton>
                            <ToolButton title="Divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus className="size-3.5" /></ToolButton>
                            <ToolButton title="Add or edit link" activeState={editor?.isActive('link')} onClick={setLink}><Link2 className="size-3.5" /></ToolButton>
                            {editor?.isActive('link') ? <ToolButton title="Remove link" onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}><Link2Off className="size-3.5" /></ToolButton> : null}
                        </div>
                        <div className={`${group} ml-auto`}>
                            <ToolButton title="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><Undo2 className="size-3.5" /></ToolButton>
                            <ToolButton title="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><Redo2 className="size-3.5" /></ToolButton>
                            <ToolButton title="Clear formatting" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="size-3.5" /></ToolButton>
                        </div>
                    </div>
                    <PretextMenu editor={editor} open={pretextOpen} onOpenChange={setPretextOpen} />
                </div>
            </div>
            <EditorContent editor={editor} />
            <input type="hidden" name={name} value={html} readOnly />
        </div>
    );
}
