'use client';

import { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Code2,
    Highlighter,
    Italic,
    Link2,
    List,
    ListOrdered,
    Quote,
    Redo2,
    RemoveFormatting,
    Underline as UnderlineIcon,
    Undo2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    jsonValue?: Record<string, unknown> | null;
    onChange: (payload: { html: string; json: Record<string, unknown> }) => void;
}

const COLOR_PRESETS = ['#111827', '#2563eb', '#0f766e', '#9333ea', '#dc2626', '#ca8a04'];

function ToolbarButton({
    active,
    disabled,
    label,
    onClick,
    children,
}: {
    active?: boolean;
    disabled?: boolean;
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={label}
            className={cn(
                'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border-dark bg-[#111418] px-3 text-[#9dabb9] transition-colors hover:border-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40',
                active && 'border-primary bg-primary/10 text-primary'
            )}
        >
            {children}
        </button>
    );
}

export function RichTextEditor({ value, jsonValue, onChange }: RichTextEditorProps) {
    const [customColor, setCustomColor] = useState('#111827');

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Underline,
            Placeholder.configure({
                placeholder: 'Bat dau viet noi dung bai blog tai day...',
            }),
        ],
        editorProps: {
            attributes: {
                class: 'rich-editor prose prose-slate max-w-none min-h-[440px] focus:outline-none dark:prose-invert',
            },
        },
        content: jsonValue || value,
        onUpdate({ editor: currentEditor }) {
            onChange({
                html: currentEditor.getHTML(),
                json: currentEditor.getJSON() as Record<string, unknown>,
            });
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        const nextContent = jsonValue || value || '<p></p>';
        const currentHtml = editor.getHTML();

        if (!jsonValue && value === currentHtml) {
            return;
        }

        editor.commands.setContent(nextContent, { emitUpdate: false });
    }, [editor, jsonValue, value]);

    const headingOptions = useMemo(
        () => [
            { label: 'H2', level: 2 },
            { label: 'H3', level: 3 },
        ] as const,
        []
    );

    if (!editor) {
        return (
            <div className="min-h-[440px] rounded-xl border border-border-dark bg-[#111418] p-4 text-sm text-[#9dabb9]">
                Dang khoi tao editor...
            </div>
        );
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href || '';
        const url = window.prompt('Nhap URL lien ket', previousUrl);

        if (url === null) {
            return;
        }

        if (!url.trim()) {
            editor.chain().focus().unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    };

    return (
        <div className="overflow-hidden rounded-xl border border-border-dark bg-surface-dark shadow-sm">
            <div className="border-b border-border-dark bg-[#111418] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                    {headingOptions.map((heading) => (
                        <ToolbarButton
                            key={heading.level}
                            label={heading.label}
                            active={editor.isActive('heading', { level: heading.level })}
                            onClick={() => editor.chain().focus().toggleHeading({ level: heading.level }).run()}
                        >
                            <span className="text-xs font-bold">{heading.label}</span>
                        </ToolbarButton>
                    ))}

                    <div className="mx-1 h-6 w-px bg-border-dark" />

                    <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                        <Bold className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                        <Italic className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                        <UnderlineIcon className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}>
                        <Highlighter className="size-4" />
                    </ToolbarButton>

                    <div className="mx-1 h-6 w-px bg-border-dark" />

                    <ToolbarButton label="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                        <List className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Ordered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                        <ListOrdered className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                        <Quote className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Code Block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                        <Code2 className="size-4" />
                    </ToolbarButton>

                    <div className="mx-1 h-6 w-px bg-border-dark" />

                    <ToolbarButton label="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                        <AlignLeft className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                        <AlignCenter className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                        <AlignRight className="size-4" />
                    </ToolbarButton>

                    <div className="mx-1 h-6 w-px bg-border-dark" />

                    <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}>
                        <Link2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
                        <RemoveFormatting className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
                        <Undo2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
                        <Redo2 className="size-4" />
                    </ToolbarButton>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#9dabb9]">Text color</span>
                    {COLOR_PRESETS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => editor.chain().focus().setColor(color).run()}
                            className="size-7 rounded-full border border-white/10 transition-transform hover:scale-105"
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                    <label className="ml-2 inline-flex items-center gap-2 rounded-lg border border-border-dark bg-[#111418] px-3 py-2 text-xs text-[#9dabb9]">
                        <span>Custom</span>
                        <input
                            type="color"
                            value={customColor}
                            onChange={(event) => {
                                const color = event.target.value;
                                setCustomColor(color);
                                editor.chain().focus().setColor(color).run();
                            }}
                            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                    </label>
                </div>
            </div>

            <div className="max-h-[720px] overflow-y-auto bg-surface-dark p-6">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
