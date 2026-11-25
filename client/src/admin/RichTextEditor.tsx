import Image from '@tiptap/extension-image';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Undo2, Unlink,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/format';
import { MediaPicker } from './media';
import { Button, Field, Input, Modal } from './ui';

function ToolButton({ active, onClick, label, children, disabled }: { active?: boolean; onClick: () => void; label: string; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn('rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40', active && 'bg-teal-50 text-teal-700')}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder = 'Write here…', minimal = false }: { value: string; onChange: (html: string) => void; placeholder?: string; minimal?: boolean }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } } }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
    ],
    content: value || '',
    editorProps: { attributes: { class: 'tiptap prose-uit', 'data-placeholder': placeholder } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
    immediatelyRender: true,
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive('bold'), italic: e?.isActive('italic'), h2: e?.isActive('heading', { level: 2 }), h3: e?.isActive('heading', { level: 3 }),
      ul: e?.isActive('bulletList'), ol: e?.isActive('orderedList'), quote: e?.isActive('blockquote'), link: e?.isActive('link'),
      canUndo: e?.can().undo(), canRedo: e?.can().redo(),
    }),
  });

  // Keep the editor in sync when the value is replaced from outside (revision restore, discard).
  useEffect(() => {
    if (editor && value !== (editor.isEmpty ? '' : editor.getHTML())) editor.commands.setContent(value || '', { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;
  const chain = () => editor.chain().focus();

  const openLink = () => {
    setHref(editor.getAttributes('link').href ?? '');
    setLinkOpen(true);
  };
  const applyLink = () => {
    const url = href.trim();
    if (!url) chain().extendMarkRange('link').unsetLink().run();
    else if (/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(url)) chain().extendMarkRange('link').setLink({ href: url }).run();
    setLinkOpen(false);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-1.5 py-1" role="toolbar" aria-label="Formatting">
        <ToolButton label="Bold" active={state?.bold} onClick={() => chain().toggleBold().run()}><Bold className="size-4" /></ToolButton>
        <ToolButton label="Italic" active={state?.italic} onClick={() => chain().toggleItalic().run()}><Italic className="size-4" /></ToolButton>
        {!minimal && (
          <>
            <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
            <ToolButton label="Heading" active={state?.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></ToolButton>
            <ToolButton label="Subheading" active={state?.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></ToolButton>
          </>
        )}
        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
        <ToolButton label="Bulleted list" active={state?.ul} onClick={() => chain().toggleBulletList().run()}><List className="size-4" /></ToolButton>
        <ToolButton label="Numbered list" active={state?.ol} onClick={() => chain().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolButton>
        <ToolButton label="Quote" active={state?.quote} onClick={() => chain().toggleBlockquote().run()}><Quote className="size-4" /></ToolButton>
        {!minimal && <ToolButton label="Divider" onClick={() => chain().setHorizontalRule().run()}><Minus className="size-4" /></ToolButton>}
        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
        <ToolButton label="Link" active={state?.link} onClick={openLink}><Link2 className="size-4" /></ToolButton>
        {state?.link && <ToolButton label="Remove link" onClick={() => chain().unsetLink().run()}><Unlink className="size-4" /></ToolButton>}
        {!minimal && <ToolButton label="Insert image" onClick={() => setPickerOpen(true)}><ImagePlus className="size-4" /></ToolButton>}
        <span className="ml-auto" />
        <ToolButton label="Undo" disabled={!state?.canUndo} onClick={() => chain().undo().run()}><Undo2 className="size-4" /></ToolButton>
        <ToolButton label="Redo" disabled={!state?.canRedo} onClick={() => chain().redo().run()}><Redo2 className="size-4" /></ToolButton>
      </div>
      <EditorContent editor={editor} className={minimal ? '[&_.tiptap]:min-h-28' : undefined} />

      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Link"
        size="sm"
        footer={<><Button onClick={() => setLinkOpen(false)}>Cancel</Button><Button variant="primary" onClick={applyLink}>Apply</Button></>}
      >
        <Field label="URL" hint="Use /about for pages on this site, or a full https:// link. Leave empty to remove the link.">
          <Input value={href} onChange={(e) => setHref(e.target.value)} placeholder="/about or https://…" onKeyDown={(e) => e.key === 'Enter' && applyLink()} />
        </Field>
      </Modal>
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={([m]) => chain().setImage({ src: m.url, alt: m.alt }).run()} />
    </div>
  );
}
