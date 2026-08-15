import { useCallback, useEffect, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Code, Heading2, Heading3, ImagePlus,
  Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Strikethrough,
  Underline as UnderlineIcon, Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";
import { __, _n, sprintf } from "@/production/core/i18n/wordpress";

interface Props {
  ariaLabel: string;
  className?: string;
  minHeight?: number;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<ProductImage>;
  placeholder?: string;
  value: string;
}

interface ToolButtonProps {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}

function ToolButton({ active, children, disabled, label, onClick }: ToolButtonProps) {
  return <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={onClick}
    disabled={disabled} title={label} aria-label={label} aria-pressed={active}
    className={cn(
      "grid h-7 w-7 place-items-center rounded-[5px] text-muted-foreground transition-colors",
      "hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent",
      active && "bg-foreground text-background hover:bg-foreground hover:text-background",
    )}>{children}</button>;
}

const Divider = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />;

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(__("Link URL", "yaxii-product-workspace"), previous || "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  return <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border-b border-border bg-muted/30 px-1.5 py-1">
    <ToolButton label={__("Bold", "yaxii-product-workspace")} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Italic", "yaxii-product-workspace")} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Underline", "yaxii-product-workspace")} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Strikethrough", "yaxii-product-workspace")} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-3.5 w-3.5" /></ToolButton>
    <Divider />
    <ToolButton label={__("Heading 2", "yaxii-product-workspace")} active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Heading 3", "yaxii-product-workspace")} active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Bullet list", "yaxii-product-workspace")} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Numbered list", "yaxii-product-workspace")} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Quote", "yaxii-product-workspace")} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Code block", "yaxii-product-workspace")} active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="h-3.5 w-3.5" /></ToolButton>
    <Divider />
    <ToolButton label={__("Align left", "yaxii-product-workspace")} active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Align center", "yaxii-product-workspace")} active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Align right", "yaxii-product-workspace")} active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-3.5 w-3.5" /></ToolButton>
    <Divider />
    <ToolButton label={__("Link", "yaxii-product-workspace")} active={editor.isActive("link")} onClick={setLink}><Link2 className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Insert image", "yaxii-product-workspace")} onClick={onPickImage}><ImagePlus className="h-3.5 w-3.5" /></ToolButton>
    <ToolButton label={__("Divider", "yaxii-product-workspace")} onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-3.5 w-3.5" /></ToolButton>
    <div className="ms-auto flex items-center gap-0.5">
      <ToolButton label={__("Undo", "yaxii-product-workspace")} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-3.5 w-3.5" /></ToolButton>
      <ToolButton label={__("Redo", "yaxii-product-workspace")} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-3.5 w-3.5" /></ToolButton>
    </div>
  </div>;
}

export function RichTextEditor({ ariaLabel, className, minHeight = 140, onChange, onUploadImage, placeholder = __("Write here…", "yaxii-product-workspace"), value }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    content: value || "",
    editorProps: { attributes: { "aria-label": ariaLabel, class: "rte-content text-start focus:outline-none", style: `min-height:${minHeight}px` } },
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { autolink: true, openOnClick: false },
      }), Image.configure({ allowBase64: false, inline: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }), Placeholder.configure({ placeholder }),
    ],
    onUpdate: ({ editor: activeEditor }) => {
      const html = activeEditor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current && !(next === "" && current === "<p></p>")) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  const insertFiles = useCallback(async (files: FileList | File[]) => {
    if (!editor) return;
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    setUploading(true);
    setUploadError("");
    try {
      for (const file of images) {
        const uploaded = await onUploadImage(file);
        editor.chain().focus().setImage({ alt: file.name, src: uploaded.preview }).run();
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : __("The image could not be uploaded.", "yaxii-product-workspace"));
    } finally {
      setUploading(false);
    }
  }, [editor, onUploadImage]);

  const openPicker = useCallback(() => {
    if (!editor || !window.wp?.media) {
      fileRef.current?.click();
      return;
    }
    const frame = window.wp.media({ button: { text: __("Insert image", "yaxii-product-workspace") }, library: { type: "image" }, multiple: false, title: __("Insert image", "yaxii-product-workspace") });
    frame.on("select", () => frame.state().get("selection").toJSON().forEach((attachment) => {
      editor.chain().focus().setImage({ alt: attachment.alt ?? "", src: attachment.url }).run();
    }));
    frame.open();
  }, [editor]);

  if (!editor) return null;
  return <div className={cn(
    "overflow-hidden rounded-md border border-input bg-background transition-colors",
    className,
  )} onDrop={(event) => {
    if (event.dataTransfer.files?.length) {
      event.preventDefault();
      void insertFiles(event.dataTransfer.files);
    }
  }}>
    <Toolbar editor={editor} onPickImage={openPicker} />
    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
      aria-label={/* translators: %s: editor label. */ sprintf(__("%s image upload", "yaxii-product-workspace"), ariaLabel)} onChange={(event) => {
      if (event.target.files) void insertFiles(event.target.files);
      event.target.value = "";
    }} />
    <EditorContent editor={editor} className="px-3 py-2.5" />
    <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-3 py-1 text-[10px] text-muted-foreground">
      <span>{uploading ? __("Uploading image to WordPress…", "yaxii-product-workspace") : uploadError || __("Rich text · drag images in", "yaxii-product-workspace")}</span>
      <span className="tabular-nums">{(() => {
        const count = editor.getText().trim().split(/\s+/).filter(Boolean).length;
        /* translators: %s: word count. */
        return sprintf(_n("%s word", "%s words", count, "yaxii-product-workspace"), count);
      })()}</span>
    </div>
  </div>;
}
