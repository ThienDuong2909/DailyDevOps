'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Extension, mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { AlignCenter, AlignLeft, AlignRight, Image as ImageIcon } from 'lucide-react';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '32px'] as const;
const FONT_FAMILIES = [
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Manrope', value: 'Manrope, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
] as const;

type ImageAlignment = 'left' | 'center' | 'right';

function extractSizeFromStyle(styleText?: string | null, key?: string) {
    if (!styleText || !key) {
        return null;
    }

    const pattern = new RegExp(`${key}\\s*:\\s*([^;]+)`, 'i');
    const match = styleText.match(pattern);
    return match?.[1]?.trim() || null;
}

function normalizeAlignment(value?: string | null): ImageAlignment {
    if (value === 'left' || value === 'right') {
        return value;
    }

    return 'center';
}

function buildImageStyle({
    width,
    height,
    align,
}: {
    width?: number | null;
    height?: number | null;
    align?: string | null;
}) {
    const styles = ['max-width: 100%', 'height: auto', 'display: block'];
    const normalizedAlign = normalizeAlignment(align);

    if (width) {
        styles.push(`width: ${width}px`);
    }

    if (height) {
        styles.push(`height: ${height}px`);
    }

    if (normalizedAlign === 'left') {
        styles.push('margin-left: 0', 'margin-right: auto');
    } else if (normalizedAlign === 'right') {
        styles.push('margin-left: auto', 'margin-right: 0');
    } else {
        styles.push('margin-left: auto', 'margin-right: auto');
    }

    return styles.join('; ');
}

function ImageNodeView(props: any) {
    const { node, updateAttributes, selected } = props;
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [draftAlt, setDraftAlt] = useState(node.attrs.alt || '');
    const aspectRatioRef = useRef<number>(1);

    useEffect(() => {
        setDraftAlt(node.attrs.alt || '');
    }, [node.attrs.alt]);

    const imageStyle = useMemo(
        () =>
            ({
                width: node.attrs.width || '100%',
                maxWidth: '100%',
                height: node.attrs.height ? `${node.attrs.height}px` : 'auto',
            }) as React.CSSProperties,
        [node.attrs.height, node.attrs.width]
    );

    const wrapperClass =
        normalizeAlignment(node.attrs.align) === 'left'
            ? 'justify-start'
            : normalizeAlignment(node.attrs.align) === 'right'
              ? 'justify-end'
              : 'justify-center';

    const handleResizeStart = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const image = imageRef.current;
        if (!image) {
            return;
        }

        const rect = image.getBoundingClientRect();
        const startWidth = rect.width;
        const naturalWidth = image.naturalWidth || rect.width;
        const naturalHeight = image.naturalHeight || rect.height || 1;
        aspectRatioRef.current = naturalWidth / naturalHeight;
        const startX = event.clientX;

        const onMove = (moveEvent: MouseEvent) => {
            const nextWidth = Math.max(160, Math.min(startWidth + (moveEvent.clientX - startX), 980));
            const nextHeight = Math.round(nextWidth / aspectRatioRef.current);

            updateAttributes({
                width: Math.round(nextWidth),
                height: Math.round(nextHeight),
            });
        };

        const onEnd = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
    };

    return (
        <NodeViewWrapper className="resizable-image-node not-prose" data-align={normalizeAlignment(node.attrs.align)}>
            <div className={`flex w-full ${wrapperClass}`}>
                <div className={`rich-image-shell ${selected ? 'is-selected' : ''}`}>
                    <img
                        ref={imageRef}
                        src={node.attrs.src}
                        alt={node.attrs.alt || ''}
                        title={node.attrs.title || ''}
                        style={imageStyle}
                        className="rich-image-element"
                        draggable={false}
                        onDragStart={(event) => event.preventDefault()}
                    />
                    {selected ? (
                        <>
                            <div className="rich-image-toolbar">
                                <button
                                    type="button"
                                    className={normalizeAlignment(node.attrs.align) === 'left' ? 'is-active' : ''}
                                    onClick={() => updateAttributes({ align: 'left' })}
                                >
                                    <AlignLeft size={14} />
                                </button>
                                <button
                                    type="button"
                                    className={normalizeAlignment(node.attrs.align) === 'center' ? 'is-active' : ''}
                                    onClick={() => updateAttributes({ align: 'center' })}
                                >
                                    <AlignCenter size={14} />
                                </button>
                                <button
                                    type="button"
                                    className={normalizeAlignment(node.attrs.align) === 'right' ? 'is-active' : ''}
                                    onClick={() => updateAttributes({ align: 'right' })}
                                >
                                    <AlignRight size={14} />
                                </button>
                                <label className="rich-image-alt">
                                    <ImageIcon size={14} />
                                    <input
                                        type="text"
                                        value={draftAlt}
                                        placeholder="Alt text"
                                        onChange={(event) => setDraftAlt(event.target.value)}
                                        onBlur={() => updateAttributes({ alt: draftAlt.trim() || null })}
                                    />
                                </label>
                            </div>
                            <button
                                type="button"
                                className="rich-image-resize-handle"
                                onMouseDown={handleResizeStart}
                                aria-label="Resize image"
                            />
                        </>
                    ) : null}
                </div>
            </div>
        </NodeViewWrapper>
    );
}

export const FontSize = Extension.create({
    name: 'fontSize',

    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'],
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element) =>
                            element.style.fontSize || element.getAttribute('data-font-size') || null,
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) {
                                return {};
                            }

                            return {
                                'data-font-size': attributes.fontSize,
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },
});

export const FontFamily = Extension.create({
    name: 'fontFamily',

    addGlobalAttributes() {
        return [
            {
                types: ['textStyle'],
                attributes: {
                    fontFamily: {
                        default: null,
                        parseHTML: (element) =>
                            element.style.fontFamily || element.getAttribute('data-font-family') || null,
                        renderHTML: (attributes) => {
                            if (!attributes.fontFamily) {
                                return {};
                            }

                            return {
                                'data-font-family': attributes.fontFamily,
                                style: `font-family: ${attributes.fontFamily}`,
                            };
                        },
                    },
                },
            },
        ];
    },
});

export const CodeBlockLanguage = Extension.create({
    name: 'codeBlockLanguage',

    addGlobalAttributes() {
        return [
            {
                types: ['codeBlock'],
                attributes: {
                    language: {
                        default: 'plaintext',
                        parseHTML: (element) =>
                            element.getAttribute('data-language') ||
                            element.getAttribute('data-lang') ||
                            'plaintext',
                        renderHTML: (attributes) => {
                            const language = attributes.language || 'plaintext';
                            return {
                                'data-language': language,
                                'data-lang': language,
                            };
                        },
                    },
                },
            },
        ];
    },
});

export const CodeBlockTab = Extension.create({
    name: 'codeBlockTab',

    addKeyboardShortcuts() {
        return {
            Tab: () => {
                if (!this.editor.isActive('codeBlock')) {
                    return false;
                }

                return this.editor.commands.insertContent('  ');
            },
        };
    },
});

export const WordLikeShortcuts = Extension.create({
    name: 'wordLikeShortcuts',

    addKeyboardShortcuts() {
        return {
            'Mod-u': () => this.editor.chain().focus().toggleUnderline().run(),
            'Mod-Shift-h': () => this.editor.chain().focus().toggleHighlight().run(),
            'Mod-Shift-7': () => this.editor.chain().focus().toggleOrderedList().run(),
            'Mod-Shift-8': () => this.editor.chain().focus().toggleBulletList().run(),
            'Mod-Alt-0': () => this.editor.chain().focus().setParagraph().run(),
            'Mod-Alt-2': () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
            'Mod-Alt-3': () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
            'Mod-Shift-l': () => this.editor.chain().focus().setTextAlign('left').run(),
            'Mod-Shift-e': () => this.editor.chain().focus().setTextAlign('center').run(),
            'Mod-Shift-r': () => this.editor.chain().focus().setTextAlign('right').run(),
            Tab: () => {
                if (this.editor.isActive('codeBlock')) {
                    return false;
                }

                if (this.editor.isActive('listItem')) {
                    return this.editor.chain().focus().sinkListItem('listItem').run();
                }

                return false;
            },
            'Shift-Tab': () => {
                if (this.editor.isActive('listItem')) {
                    return this.editor.chain().focus().liftListItem('listItem').run();
                }

                return false;
            },
        };
    },
});

export const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: (element) => {
                    const value = element.getAttribute('width') || extractSizeFromStyle(element.getAttribute('style'), 'width');
                    return value ? Number.parseInt(value, 10) : null;
                },
                renderHTML: (attributes) => (attributes.width ? { width: attributes.width } : {}),
            },
            height: {
                default: null,
                parseHTML: (element) => {
                    const value = element.getAttribute('height') || extractSizeFromStyle(element.getAttribute('style'), 'height');
                    return value ? Number.parseInt(value, 10) : null;
                },
                renderHTML: (attributes) => (attributes.height ? { height: attributes.height } : {}),
            },
            align: {
                default: 'center',
                parseHTML: (element) => element.getAttribute('data-align') || 'center',
                renderHTML: (attributes) => ({
                    'data-align': normalizeAlignment(attributes.align),
                }),
            },
        };
    },

    renderHTML({ HTMLAttributes }) {
        const { width, height, align, style, ...rest } = HTMLAttributes;

        return [
            'img',
            mergeAttributes(rest, {
                width,
                height,
                'data-align': normalizeAlignment(align),
                style: [style, buildImageStyle({ width, height, align })].filter(Boolean).join('; '),
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },
});

const TableCellBackground = {
    backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) =>
            element.getAttribute('data-cell-bg') || element.style.backgroundColor || null,
        renderHTML: (attributes: Record<string, string | null>) => {
            if (!attributes.backgroundColor) {
                return {};
            }

            return {
                'data-cell-bg': attributes.backgroundColor,
                style: `background-color: ${attributes.backgroundColor}`,
            };
        },
    },
};

export const AdvancedTableCell = TableCell.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            ...TableCellBackground,
        };
    },
});

export const AdvancedTableHeader = TableHeader.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            ...TableCellBackground,
        };
    },
});

export { FONT_FAMILIES, FONT_SIZES };
