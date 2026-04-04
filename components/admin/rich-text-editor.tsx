'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Cropper, { type Area } from 'react-easy-crop';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    ChevronsLeft,
    ChevronsRight,
    CopyPlus,
    Code2,
    Columns3,
    Eraser,
    ImagePlus,
    Highlighter,
    Italic,
    Link2,
    List,
    ListOrdered,
    Minus,
    Pilcrow,
    Quote,
    Redo2,
    RemoveFormatting,
    Rows3,
    Scissors,
    SplitSquareHorizontal,
    Strikethrough,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Table2,
    Underline as UnderlineIcon,
    Undo2,
} from 'lucide-react';

import { cn, getImageUrl } from '@/lib/utils';
import {
    AdvancedTableCell,
    AdvancedTableHeader,
    CodeBlockTab,
    CodeBlockLanguage,
    FONT_FAMILIES,
    FONT_SIZES,
    FontFamily,
    FontSize,
    ResizableImage,
    WordLikeShortcuts,
} from './rich-editor-extensions';

interface RichTextEditorProps {
    value: string;
    jsonValue?: Record<string, unknown> | null;
    onChange: (payload: { html: string; json: Record<string, unknown> }) => void;
    onImageUpload?: (file: File) => Promise<string>;
    mediaItems?: Array<{ key: string; url: string; size?: number }>;
    onRefreshMediaLibrary?: () => Promise<void>;
}

const COLOR_PRESETS = ['#111827', '#2563eb', '#0f766e', '#9333ea', '#dc2626', '#ca8a04'];
const HIGHLIGHT_PRESETS = ['#fef08a', '#fecaca', '#bfdbfe', '#bbf7d0', '#f5d0fe', '#fed7aa'];
const TABLE_CELL_BACKGROUNDS = ['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#ede9fe'];
const CODE_LANGUAGES = ['plaintext', 'bash', 'javascript', 'typescript', 'json', 'yaml', 'docker', 'sql'];

type CropSession =
    | {
          mode: 'insert';
          sourceUrl: string;
          fileName: string;
          mimeType: string;
      }
    | {
          mode: 'replace';
          sourceUrl: string;
          fileName: string;
          mimeType: string;
      };

type TableMenuState = {
    visible: boolean;
    top: number;
    left: number;
};

type TableInsertControlsState = {
    visible: boolean;
    rowTop: number;
    rowLeft: number;
    columnTop: number;
    columnLeft: number;
    cellPos: number;
    showRow: boolean;
    showColumn: boolean;
};

async function loadImage(url: string) {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.src = url;

    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Khong the tai anh de chinh sua'));
    });

    return image;
}

async function getCroppedImageBlob(
    imageSrc: string,
    croppedAreaPixels: Area,
    mimeType: string
) {
    const image = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(croppedAreaPixels.width));
    canvas.height = Math.max(1, Math.round(croppedAreaPixels.height));
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Khong the khoi tao canvas de crop anh');
    }

    context.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        canvas.width,
        canvas.height
    );

    const normalizedMimeType = mimeType === 'image/jfif' ? 'image/jpeg' : mimeType;

    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Khong the crop anh'));
                    return;
                }

                resolve(blob);
            },
            normalizedMimeType || 'image/png',
            0.95
        );
    });
}

async function getImageDimensions(fileOrUrl: File | string) {
    const image =
        typeof fileOrUrl === 'string'
            ? await loadImage(fileOrUrl)
            : await loadImage(URL.createObjectURL(fileOrUrl));

    return {
        width: image.naturalWidth,
        height: image.naturalHeight,
    };
}

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
                'theme-panel-muted theme-border inline-flex h-9 min-w-9 items-center justify-center rounded-2xl border px-3 theme-muted transition-colors hover:border-primary hover:text-[color:var(--text-main-theme)] disabled:cursor-not-allowed disabled:opacity-40',
                active && 'border-primary bg-primary/10 text-primary'
            )}
        >
            {children}
        </button>
    );
}

export function RichTextEditor({
    value,
    jsonValue,
    onChange,
    onImageUpload,
    mediaItems = [],
    onRefreshMediaLibrary,
}: RichTextEditorProps) {
    const [customColor, setCustomColor] = useState('#111827');
    const [customHighlightColor, setCustomHighlightColor] = useState('#fef08a');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [cropSession, setCropSession] = useState<CropSession | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isCroppingImage, setIsCroppingImage] = useState(false);
    const [selectedImageAttrs, setSelectedImageAttrs] = useState<Record<string, unknown> | null>(null);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [mediaSearchQuery, setMediaSearchQuery] = useState('');
    const [selectionMenu, setSelectionMenu] = useState<{ top: number; left: number; visible: boolean }>({
        top: 0,
        left: 0,
        visible: false,
    });
    const [tableMenu, setTableMenu] = useState<TableMenuState>({
        visible: false,
        top: 0,
        left: 0,
    });
    const [tableInsertControls, setTableInsertControls] = useState<TableInsertControlsState>({
        visible: false,
        rowTop: 0,
        rowLeft: 0,
        columnTop: 0,
        columnLeft: 0,
        cellPos: -1,
        showRow: false,
        showColumn: false,
    });
    const isApplyingExternalContentRef = useRef(false);
    const editorShellRef = useRef<HTMLDivElement | null>(null);
    const editorViewportRef = useRef<HTMLDivElement | null>(null);

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
            ResizableImage.configure({
                inline: false,
                allowBase64: false,
            }),
            Table.configure({
                resizable: true,
                lastColumnResizable: true,
                HTMLAttributes: {
                    class: 'editor-table',
                },
            }),
            TableRow,
            AdvancedTableHeader,
            AdvancedTableCell,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
            }),
            TextStyle,
            FontSize,
            FontFamily,
            CodeBlockLanguage,
            Color,
            Highlight.configure({ multicolor: true }),
            Underline,
            Subscript,
            Superscript,
            CodeBlockTab,
            WordLikeShortcuts,
            Placeholder.configure({
                placeholder: 'Bat dau viet noi dung bai blog tai day...',
            }),
        ],
        editorProps: {
            attributes: {
                class: 'rich-editor prose prose-slate max-w-none min-h-[440px] focus:outline-none dark:prose-invert',
            },
            transformPastedHTML(html) {
                return html
                    .replace(/<!--StartFragment-->|<!--EndFragment-->/g, '')
                    .replace(/\sclass=("|\')(Mso|Apple-converted-space)[^"\']*\1/gi, '')
                    .replace(/\sstyle=("|\')[^"\']*mso-[^"\']*\1/gi, '')
                    .replace(/<o:p>\s*<\/o:p>/gi, '')
                    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '&nbsp;')
                    .replace(/\slang=("|\')[^"\']*\1/gi, '')
                    .replace(/\sdata-[a-z-]+=("|')[^"']*("|')/gi, '')
                    .replace(/<\/?span[^>]*>/gi, (match) => {
                        if (/style=/i.test(match) || /data-font-size=/i.test(match)) {
                            return match;
                        }

                        return '';
                    });
            },
            handlePaste(_view, event) {
                const imageFile = Array.from(event.clipboardData?.files || []).find((file) =>
                    file.type.startsWith('image/')
                );

                if (!imageFile || !onImageUpload) {
                    return false;
                }

                event.preventDefault();
                openCropSessionForFile(imageFile);
                return true;
            },
        },
        content: jsonValue || value,
        onUpdate({ editor: currentEditor }) {
            if (isApplyingExternalContentRef.current) {
                return;
            }

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
        const incomingJson = jsonValue ? JSON.stringify(jsonValue) : null;
        const currentJson = jsonValue ? JSON.stringify(editor.getJSON()) : null;
        const currentHtml = editor.getHTML();

        if (incomingJson && incomingJson === currentJson) {
            return;
        }

        if (!incomingJson && value === currentHtml) {
            return;
        }

        isApplyingExternalContentRef.current = true;
        editor.commands.setContent(nextContent, { emitUpdate: false });
        window.requestAnimationFrame(() => {
            isApplyingExternalContentRef.current = false;
        });
    }, [editor, jsonValue, value]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const syncSelectedImage = () => {
            const node = editor.state.selection instanceof Object && 'node' in editor.state.selection
                ? (editor.state.selection as { node?: { type?: { name?: string }; attrs?: Record<string, unknown> } }).node
                : undefined;

            if (node?.type?.name === 'image') {
                setSelectedImageAttrs(node.attrs || null);
                return;
            }

            setSelectedImageAttrs(null);
        };

        syncSelectedImage();
        editor.on('selectionUpdate', syncSelectedImage);
        editor.on('transaction', syncSelectedImage);

        return () => {
            editor.off('selectionUpdate', syncSelectedImage);
            editor.off('transaction', syncSelectedImage);
        };
    }, [editor]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const syncTableMenu = () => {
            const shell = editorShellRef.current;
            if (!shell || !editor.isActive('table')) {
                setTableMenu((previous) => (previous.visible ? { ...previous, visible: false } : previous));
                return;
            }

            const selection = window.getSelection();
            const anchorNode = selection?.anchorNode;
            const anchorElement =
                anchorNode instanceof HTMLElement
                    ? anchorNode
                    : anchorNode instanceof Text
                      ? anchorNode.parentElement
                      : null;
            const tableElement =
                anchorElement?.closest('table') || null;

            if (!tableElement) {
                setTableMenu((previous) => (previous.visible ? { ...previous, visible: false } : previous));
                return;
            }

            const tableRect = tableElement.getBoundingClientRect();
            const shellRect = shell.getBoundingClientRect();

            setTableMenu({
                visible: true,
                top: tableRect.top - shellRect.top - 14,
                left: tableRect.left - shellRect.left + Math.min(tableRect.width / 2, 140),
            });
        };

        syncTableMenu();
        editor.on('selectionUpdate', syncTableMenu);
        editor.on('transaction', syncTableMenu);
        window.addEventListener('resize', syncTableMenu);

        return () => {
            editor.off('selectionUpdate', syncTableMenu);
            editor.off('transaction', syncTableMenu);
            window.removeEventListener('resize', syncTableMenu);
        };
    }, [editor]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const syncSelectionMenu = () => {
            const shell = editorShellRef.current;
            const selection = window.getSelection();

            if (!shell || !selection || selection.rangeCount === 0 || selection.isCollapsed || editor.isActive('image') || editor.isActive('table')) {
                setSelectionMenu((previous) => (previous.visible ? { ...previous, visible: false } : previous));
                return;
            }

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const shellRect = shell.getBoundingClientRect();

            if (!rect.width && !rect.height) {
                setSelectionMenu((previous) => (previous.visible ? { ...previous, visible: false } : previous));
                return;
            }

            setSelectionMenu({
                visible: true,
                left: rect.left - shellRect.left + rect.width / 2,
                top: rect.top - shellRect.top - 12,
            });
        };

        syncSelectionMenu();
        editor.on('selectionUpdate', syncSelectionMenu);
        editor.on('transaction', syncSelectionMenu);
        window.addEventListener('resize', syncSelectionMenu);

        return () => {
            editor.off('selectionUpdate', syncSelectionMenu);
            editor.off('transaction', syncSelectionMenu);
            window.removeEventListener('resize', syncSelectionMenu);
        };
    }, [editor]);

    const headingOptions = useMemo(
        () => [
            { label: 'P', level: 0 },
            { label: 'H2', level: 2 },
            { label: 'H3', level: 3 },
        ] as const,
        []
    );

    const filteredMediaItems = useMemo(() => {
        const normalizedQuery = mediaSearchQuery.trim().toLowerCase();

        return mediaItems.filter((item) => {
            if (!normalizedQuery) {
                return true;
            }

            return item.key.toLowerCase().includes(normalizedQuery);
        });
    }, [mediaItems, mediaSearchQuery]);

    if (!editor) {
        return (
            <div className="theme-panel-muted theme-border min-h-[440px] rounded-2xl border p-4 text-sm theme-muted">
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

    const openCropSessionForFile = (file: File) => {
        const sourceUrl = URL.createObjectURL(file);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setCropSession({
            mode: 'insert',
            sourceUrl,
            fileName: file.name,
            mimeType: file.type || 'image/png',
        });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file || !onImageUpload) {
            return;
        }

        openCropSessionForFile(file);
    };

    const insertExistingImage = async (url: string, alt = '') => {
        const dimensions = await getImageDimensions(url);

        editor
            .chain()
            .focus()
            .setImage(
                {
                    src: url,
                    alt,
                    width: dimensions.width,
                    height: dimensions.height,
                    align: 'center',
                } as any
            )
            .run();
    };

    const applyFontSize = (fontSize: string) => {
        if (fontSize === 'default') {
            editor.chain().focus().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
            return;
        }

        editor.chain().focus().setMark('textStyle', { fontSize }).run();
    };

    const applyFontFamily = (fontFamily: string) => {
        if (fontFamily === 'default') {
            editor.chain().focus().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
            return;
        }

        editor.chain().focus().setMark('textStyle', { fontFamily }).run();
    };

    const applyTableCellBackground = (backgroundColor: string | null) => {
        const targetNodeType = editor.isActive('tableHeader') ? 'tableHeader' : 'tableCell';
        editor.chain().focus().updateAttributes(targetNodeType, { backgroundColor }).run();
    };

    const indentSelection = () => {
        if (editor.isActive('listItem')) {
            editor.chain().focus().sinkListItem('listItem').run();
            return;
        }

        editor.chain().focus().setTextAlign('right').run();
    };

    const outdentSelection = () => {
        if (editor.isActive('listItem')) {
            editor.chain().focus().liftListItem('listItem').run();
            return;
        }

        editor.chain().focus().setTextAlign('left').run();
    };

    const currentFontSize = ((editor.getAttributes('textStyle').fontSize as string | null) || 'default');
    const currentFontFamily = ((editor.getAttributes('textStyle').fontFamily as string | null) || 'default');
    const currentHighlightColor = (editor.getAttributes('highlight').color as string | undefined) || customHighlightColor;
    const currentCodeLanguage = (editor.getAttributes('codeBlock').language as string | undefined) || 'plaintext';

    const transformSelectionText = (transformer: (value: string) => string) => {
        editor
            .chain()
            .focus()
            .command(({ tr, state, dispatch }) => {
                const { from, to, empty } = state.selection;
                if (empty) {
                    return false;
                }

                const selectedText = state.doc.textBetween(from, to, '\n');
                dispatch?.(tr.insertText(transformer(selectedText), from, to));
                return true;
            })
            .run();
    };

    const handleReplaceSelectedImage = async () => {
        if (!selectedImageAttrs?.src || !onImageUpload) {
            return;
        }

        try {
            const response = await fetch(String(selectedImageAttrs.src));
            const blob = await response.blob();
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setCropSession({
                mode: 'replace',
                sourceUrl: URL.createObjectURL(blob),
                fileName: String(selectedImageAttrs.alt || 'cropped-image'),
                mimeType: blob.type || 'image/png',
            });
        } catch {
            window.alert('Khong the mo anh hien tai de crop');
        }
    };

    const handleSelectExistingMedia = async (item: { key: string; url: string }) => {
        try {
            await insertExistingImage(item.url, item.key.split('/').pop() || 'media-image');
            setIsMediaPickerOpen(false);
            setMediaSearchQuery('');
        } catch {
            window.alert('Khong the chen anh tu media library luc nay');
        }
    };

    const clearTableInsertControls = () => {
        setTableInsertControls((previous) =>
            previous.visible
                ? {
                      ...previous,
                      visible: false,
                  }
                : previous
        );
    };

    const positionCursorInsideCell = (cellPos: number) => {
        const selection = TextSelection.near(editor.state.doc.resolve(cellPos + 1));
        const transaction = editor.state.tr.setSelection(selection);
        editor.view.dispatch(transaction);
        editor.commands.focus();
    };

    const handleEditorMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const shell = editorShellRef.current;
        const viewport = editorViewportRef.current;

        if (!shell || !viewport) {
            return;
        }

        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            clearTableInsertControls();
            return;
        }

        const cell = target.closest('td, th');
        if (!cell || !viewport.contains(cell)) {
            clearTableInsertControls();
            return;
        }

        const table = cell.closest('table');
        if (!table) {
            clearTableInsertControls();
            return;
        }

        const cellPos = editor.view.posAtDOM(cell, 0);
        const cellRect = cell.getBoundingClientRect();
        const shellRect = shell.getBoundingClientRect();
        const hoverInset = 18;
        const isNearBottomEdge = cellRect.bottom - event.clientY <= hoverInset;
        const isNearRightEdge = cellRect.right - event.clientX <= hoverInset;

        if (!isNearBottomEdge && !isNearRightEdge) {
            clearTableInsertControls();
            return;
        }

        setTableInsertControls({
            visible: true,
            cellPos,
            rowTop: cellRect.bottom - shellRect.top,
            rowLeft: cellRect.right - shellRect.left,
            columnTop: cellRect.bottom - shellRect.top,
            columnLeft: cellRect.right - shellRect.left,
            showRow: isNearBottomEdge,
            showColumn: isNearRightEdge,
        });
    };

    const handleInsertRowAtHover = () => {
        if (tableInsertControls.cellPos < 0) {
            return;
        }

        positionCursorInsideCell(tableInsertControls.cellPos);
        editor.chain().focus().addRowAfter().run();
    };

    const handleInsertColumnAtHover = () => {
        if (tableInsertControls.cellPos < 0) {
            return;
        }

        positionCursorInsideCell(tableInsertControls.cellPos);
        editor.chain().focus().addColumnAfter().run();
    };

    const handleCropConfirm = async () => {
        if (!cropSession || !croppedAreaPixels || !onImageUpload) {
            return;
        }

        try {
            setIsCroppingImage(true);
            setIsUploadingImage(true);

            const croppedBlob = await getCroppedImageBlob(
                cropSession.sourceUrl,
                croppedAreaPixels,
                cropSession.mimeType
            );
            const extension = cropSession.fileName.includes('.')
                ? cropSession.fileName.split('.').pop()
                : cropSession.mimeType.split('/').pop() || 'png';
            const fileName = `${cropSession.fileName.replace(/\.[^.]+$/, '') || 'editor-image'}-crop.${extension}`;
            const croppedFile = new File([croppedBlob], fileName, {
                type: croppedBlob.type || cropSession.mimeType,
            });
            const uploadedUrl = await onImageUpload(croppedFile);
            const dimensions = await getImageDimensions(uploadedUrl);

            if (cropSession.mode === 'insert') {
                editor
                    .chain()
                    .focus()
                    .setImage(
                        {
                            src: uploadedUrl,
                            alt: croppedFile.name,
                            width: dimensions.width,
                            height: dimensions.height,
                            align: 'center',
                        } as any
                    )
                    .run();
            } else {
                editor
                    .chain()
                    .focus()
                    .updateAttributes('image', {
                        src: uploadedUrl,
                        width: dimensions.width,
                        height: dimensions.height,
                    })
                    .run();
            }

            URL.revokeObjectURL(cropSession.sourceUrl);
            setCropSession(null);
        } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Khong the crop anh luc nay');
        } finally {
            setIsCroppingImage(false);
            setIsUploadingImage(false);
        }
    };

    const closeCropSession = () => {
        if (cropSession?.sourceUrl.startsWith('blob:')) {
            URL.revokeObjectURL(cropSession.sourceUrl);
        }
        setCropSession(null);
        setCroppedAreaPixels(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    };

    return (
        <div ref={editorShellRef} className="theme-panel relative overflow-visible rounded-2xl shadow-sm">
            <div className="theme-border bg-[color:var(--surface-base)] border-b px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                    {headingOptions.map((heading) => (
                        <ToolbarButton
                            key={heading.label}
                            label={heading.label}
                            active={
                                heading.level === 0
                                    ? editor.isActive('paragraph')
                                    : editor.isActive('heading', { level: heading.level })
                            }
                            onClick={() =>
                                heading.level === 0
                                    ? editor.chain().focus().setParagraph().run()
                                    : editor.chain().focus().toggleHeading({ level: heading.level }).run()
                            }
                        >
                            {heading.level === 0 ? (
                                <Pilcrow className="size-4" />
                            ) : (
                                <span className="text-xs font-bold">{heading.label}</span>
                            )}
                        </ToolbarButton>
                    ))}

                    <label className="theme-panel-muted theme-border inline-flex h-9 items-center rounded-2xl border px-3 text-xs font-semibold text-[color:var(--text-main-theme)]">
                        <span className="mr-2 theme-muted">Size</span>
                        <select
                            value={currentFontSize}
                            onChange={(event) => applyFontSize(event.target.value)}
                            className="bg-transparent text-[color:var(--text-main-theme)] outline-none"
                        >
                            <option value="default">Default</option>
                            {FONT_SIZES.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="theme-panel-muted theme-border inline-flex h-9 items-center rounded-2xl border px-3 text-xs font-semibold text-[color:var(--text-main-theme)]">
                        <span className="mr-2 theme-muted">Font</span>
                        <select
                            value={currentFontFamily}
                            onChange={(event) => applyFontFamily(event.target.value)}
                            className="max-w-[128px] bg-transparent text-[color:var(--text-main-theme)] outline-none"
                        >
                            <option value="default">Default</option>
                            {FONT_FAMILIES.map((family) => (
                                <option key={family.value} value={family.value}>
                                    {family.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="theme-border mx-1 h-6 w-px bg-transparent" />

                    <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                        <Bold className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                        <Italic className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Strike" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
                        <Strikethrough className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                        <UnderlineIcon className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: customHighlightColor }).run()}>
                        <Highlighter className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Clear highlight" active={false} onClick={() => editor.chain().focus().unsetHighlight().run()}>
                        <span className="text-[10px] font-black tracking-wide">HL</span>
                    </ToolbarButton>
                    <ToolbarButton label="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
                        <SubscriptIcon className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
                        <SuperscriptIcon className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="UPPERCASE" active={false} onClick={() => transformSelectionText((value) => value.toUpperCase())}>
                        <span className="text-[10px] font-black tracking-wide">UP</span>
                    </ToolbarButton>
                    <ToolbarButton label="lowercase" active={false} onClick={() => transformSelectionText((value) => value.toLowerCase())}>
                        <span className="text-[10px] font-black tracking-wide">lo</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label="Capitalize"
                        active={false}
                        onClick={() =>
                            transformSelectionText((value) =>
                                value.replace(/\b([A-Za-zÀ-ỹà-ỹ])([A-Za-zÀ-ỹà-ỹ]*)/g, (_match, first, rest) => `${String(first).toUpperCase()}${String(rest).toLowerCase()}`)
                            )
                        }
                    >
                        <span className="text-[10px] font-black tracking-wide">Aa</span>
                    </ToolbarButton>

                    <div className="theme-border mx-1 h-6 w-px bg-transparent" />

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
                    <ToolbarButton label="Divider" active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                        <Minus className="size-4" />
                    </ToolbarButton>

                    <div className="theme-border mx-1 h-6 w-px bg-transparent" />

                    <ToolbarButton label="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                        <AlignLeft className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                        <AlignCenter className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                        <AlignRight className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Indent" active={false} onClick={indentSelection}>
                        <ChevronsRight className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Outdent" active={false} onClick={outdentSelection}>
                        <ChevronsLeft className="size-4" />
                    </ToolbarButton>

                    <div className="mx-1 h-6 w-px bg-border-dark" />

                    <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}>
                        <Link2 className="size-4" />
                    </ToolbarButton>
                    <div className="theme-panel-muted theme-border inline-flex items-center gap-1 rounded-2xl border px-2 py-1">
                        <button
                            type="button"
                            onClick={() => setIsMediaPickerOpen(true)}
                            className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[color:var(--text-main-theme)] transition hover:text-primary"
                            title="Chen anh tu media library"
                        >
                            <CopyPlus className="size-4" />
                            Media
                        </button>
                        <label
                            className={cn(
                                'inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[color:var(--text-main-theme)] transition hover:text-primary',
                                isUploadingImage && 'cursor-wait opacity-60',
                                !onImageUpload && 'cursor-not-allowed opacity-40'
                            )}
                            title="Tai anh tu may tinh"
                        >
                            <ImagePlus className="size-4" />
                            Upload
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={(event) => void handleImageUpload(event)}
                                disabled={!onImageUpload || isUploadingImage}
                            />
                        </label>
                        <div className="inline-flex h-9 items-center rounded-xl px-3 text-[11px] font-semibold text-[color:var(--text-muted-theme)]">
                            Ctrl/Cmd + V
                        </div>
                    </div>
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
                    <span className="theme-muted text-xs font-medium uppercase tracking-wide">Text color</span>
                    {COLOR_PRESETS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => editor.chain().focus().setColor(color).run()}
                            className="size-7 rounded-full border theme-border-ghost transition-transform hover:scale-105"
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                    <label className="theme-panel-muted theme-border ml-2 inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs theme-muted">
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

                    <span className="ml-4 theme-muted text-xs font-medium uppercase tracking-wide">Highlight</span>
                    {HIGHLIGHT_PRESETS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => {
                                setCustomHighlightColor(color);
                                editor.chain().focus().toggleHighlight({ color }).run();
                            }}
                            className={cn(
                                'size-7 rounded-full border theme-border-ghost transition-transform hover:scale-105',
                                currentHighlightColor === color && 'ring-2 ring-primary ring-offset-2 ring-offset-transparent'
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                    <label className="theme-panel-muted theme-border inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs theme-muted">
                        <span>Custom</span>
                        <input
                            type="color"
                            value={customHighlightColor}
                            onChange={(event) => {
                                const color = event.target.value;
                                setCustomHighlightColor(color);
                                editor.chain().focus().toggleHighlight({ color }).run();
                            }}
                            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                    </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ToolbarButton
                        label="Insert table"
                        active={editor.isActive('table')}
                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    >
                        <Table2 className="size-4" />
                    </ToolbarButton>

                    {editor.isActive('table') ? (
                        <>
                            <ToolbarButton label="Add row above" onClick={() => editor.chain().focus().addRowBefore().run()}>
                                <Rows3 className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
                                <Rows3 className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Add column before" onClick={() => editor.chain().focus().addColumnBefore().run()}>
                                <Columns3 className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                                <Columns3 className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Toggle header row" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
                                <SplitSquareHorizontal className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Merge or split cells" onClick={() => editor.chain().focus().mergeOrSplit().run()}>
                                <SplitSquareHorizontal className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
                                <Eraser className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
                                <Eraser className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
                                <Eraser className="size-4" />
                            </ToolbarButton>
                            <button
                                type="button"
                                onClick={() => applyTableCellBackground(null)}
                                className="theme-panel-muted theme-border inline-flex h-9 items-center rounded-2xl border px-3 text-xs font-semibold text-[color:var(--text-main-theme)]"
                            >
                                Clear cell color
                            </button>
                            {TABLE_CELL_BACKGROUNDS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => applyTableCellBackground(color)}
                                    className="size-7 rounded-full border theme-border-ghost transition-transform hover:scale-105"
                                    style={{ backgroundColor: color }}
                                    title={`Cell ${color}`}
                                />
                            ))}
                        </>
                    ) : null}

                    {selectedImageAttrs && onImageUpload ? (
                        <ToolbarButton label="Crop image" onClick={() => void handleReplaceSelectedImage()}>
                            <Scissors className="size-4" />
                        </ToolbarButton>
                    ) : null}
                </div>
            </div>

            <div
                ref={editorViewportRef}
                className="max-h-[720px] overflow-y-auto bg-[color:var(--surface-elevated)] p-6 text-[color:var(--text-main-theme)]"
                onMouseMove={handleEditorMouseMove}
                onMouseLeave={clearTableInsertControls}
            >
                {selectionMenu.visible ? (
                    <div
                        className="pointer-events-none absolute z-30"
                        style={{
                            left: selectionMenu.left,
                            top: selectionMenu.top,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <div className="theme-panel theme-border pointer-events-auto flex items-center gap-1 rounded-2xl border px-2 py-1.5 shadow-xl">
                            <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                                <Bold className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                                <Italic className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                                <UnderlineIcon className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: customHighlightColor }).run()}>
                                <Highlighter className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}>
                                <Link2 className="size-4" />
                            </ToolbarButton>
                        </div>
                    </div>
                ) : null}
                {tableMenu.visible ? (
                    <div
                        className="pointer-events-none absolute z-30"
                        style={{
                            left: tableMenu.left,
                            top: tableMenu.top,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <div className="theme-panel theme-border pointer-events-auto flex items-center gap-1 rounded-2xl border px-2 py-1.5 shadow-xl">
                            <ToolbarButton label="Add row above" onClick={() => editor.chain().focus().addRowBefore().run()}>
                                <span className="text-base font-black leading-none">+</span>
                            </ToolbarButton>
                            <ToolbarButton label="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
                                <Rows3 className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Add column before" onClick={() => editor.chain().focus().addColumnBefore().run()}>
                                <span className="text-base font-black leading-none">+</span>
                            </ToolbarButton>
                            <ToolbarButton label="Add column after" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                                <Columns3 className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Merge or split cells" onClick={() => editor.chain().focus().mergeOrSplit().run()}>
                                <SplitSquareHorizontal className="size-4" />
                            </ToolbarButton>
                            <ToolbarButton label="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
                                <Eraser className="size-4" />
                            </ToolbarButton>
                        </div>
                    </div>
                ) : null}
                {tableInsertControls.visible ? (
                    <>
                        {tableInsertControls.showRow ? (
                            <button
                                type="button"
                                onClick={handleInsertRowAtHover}
                                className="theme-panel theme-border absolute z-30 inline-flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-xl transition hover:border-primary hover:text-primary"
                                style={{
                                    top: tableInsertControls.rowTop,
                                    left: tableInsertControls.rowLeft - (tableInsertControls.showColumn ? 18 : 0),
                                }}
                                title="Add row here"
                            >
                                <span className="text-lg font-black leading-none">+</span>
                            </button>
                        ) : null}
                        {tableInsertControls.showColumn ? (
                            <button
                                type="button"
                                onClick={handleInsertColumnAtHover}
                                className="theme-panel theme-border absolute z-30 inline-flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-xl transition hover:border-primary hover:text-primary"
                                style={{
                                    top: tableInsertControls.columnTop - (tableInsertControls.showRow ? 18 : 0),
                                    left: tableInsertControls.columnLeft,
                                }}
                                title="Add column here"
                            >
                                <span className="text-lg font-black leading-none">+</span>
                            </button>
                        ) : null}
                    </>
                ) : null}
                <EditorContent editor={editor} />
            </div>

            <div className="theme-border bg-[color:var(--surface-base)] border-t px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="theme-muted text-[11px] leading-5">
                        Shortcuts: Ctrl/Cmd+B bold, Ctrl/Cmd+I italic, Ctrl/Cmd+U underline, Ctrl/Cmd+Shift+H highlight, Ctrl/Cmd+Shift+7 ordered list, Ctrl/Cmd+Shift+8 bullet list, Ctrl/Cmd+Alt+2 H2, Ctrl/Cmd+Alt+3 H3, Tab/Shift+Tab indent list, Ctrl/Cmd+V paste image.
                    </p>
                    <label className="theme-panel-muted theme-border inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs text-[color:var(--text-main-theme)]">
                        <span className="theme-muted font-semibold uppercase tracking-wide">Code language</span>
                        <select
                            value={currentCodeLanguage}
                            onChange={(event) => editor.chain().focus().updateAttributes('codeBlock', { language: event.target.value }).run()}
                            className="bg-transparent outline-none"
                            disabled={!editor.isActive('codeBlock')}
                        >
                            {CODE_LANGUAGES.map((language) => (
                                <option key={language} value={language}>
                                    {language}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            {cropSession ? (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
                    <div className="theme-panel theme-border w-full max-w-5xl rounded-3xl border p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-[color:var(--text-main-theme)]">Crop Image</h3>
                                <p className="theme-muted text-sm">Keo va zoom de cat lai anh truoc khi luu vao bai viet.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={closeCropSession}
                                    className="theme-panel-muted theme-border rounded-2xl border px-4 py-2 text-sm font-semibold text-[color:var(--text-main-theme)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleCropConfirm()}
                                    disabled={isCroppingImage}
                                    className="theme-glow-button rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
                                >
                                    {isCroppingImage ? 'Dang crop...' : 'Apply crop'}
                                </button>
                            </div>
                        </div>
                        <div className="relative h-[460px] overflow-hidden rounded-3xl bg-slate-950">
                            <Cropper
                                image={cropSession.sourceUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={16 / 9}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_croppedArea, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                            />
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <span className="theme-muted text-xs font-semibold uppercase tracking-wide">Zoom</span>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.05}
                                value={zoom}
                                onChange={(event) => setZoom(Number(event.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>
                    </div>
                </div>
            ) : null}

            {isMediaPickerOpen ? (
                <div className="fixed inset-0 z-[78] flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm">
                    <div className="theme-panel theme-border w-full max-w-5xl rounded-3xl border p-6 shadow-2xl">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-[color:var(--text-main-theme)]">Insert From Media Library</h3>
                                <p className="theme-muted text-sm">Chon anh da co san hoac refresh library roi chen thang vao noi dung.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRefreshMediaLibrary?.()}
                                    className="theme-panel-muted theme-border rounded-2xl border px-4 py-2 text-sm font-semibold text-[color:var(--text-main-theme)]"
                                >
                                    Refresh
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsMediaPickerOpen(false)}
                                    className="theme-panel-muted theme-border rounded-2xl border px-4 py-2 text-sm font-semibold text-[color:var(--text-main-theme)]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="theme-input mb-4 flex h-12 items-center rounded-2xl px-4">
                            <span className="theme-soft text-sm">Search</span>
                            <input
                                type="text"
                                value={mediaSearchQuery}
                                onChange={(event) => setMediaSearchQuery(event.target.value)}
                                placeholder="Tim theo ten file hoac key..."
                                className="w-full bg-transparent px-3 text-sm text-[color:var(--text-main-theme)] outline-none"
                            />
                        </div>

                        {filteredMediaItems.length === 0 ? (
                            <div className="theme-panel-muted rounded-3xl p-8 text-center text-sm theme-muted">
                                Khong tim thay asset nao trong media library.
                            </div>
                        ) : (
                            <div className="grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto md:grid-cols-4 xl:grid-cols-5">
                                {filteredMediaItems.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => void handleSelectExistingMedia(item)}
                                        className="group overflow-hidden rounded-2xl border border-[color:var(--border-soft-theme)] bg-[color:var(--surface-muted)] text-left transition hover:border-primary"
                                    >
                                        <div className="aspect-square overflow-hidden bg-[color:var(--surface-strong)]">
                                            <img
                                                src={getImageUrl(item.url)}
                                                alt={item.key}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <p className="truncate text-xs font-semibold text-[color:var(--text-main-theme)]">
                                                {item.key.split('/').pop()}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
