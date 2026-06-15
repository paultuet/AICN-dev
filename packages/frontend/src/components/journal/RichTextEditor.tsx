import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const toolbarBtn = (active: boolean) =>
  `px-2 py-1 text-sm rounded border transition-colors ${
    active
      ? "bg-gray-200 border-gray-400 text-gray-900"
      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
  }`;

/**
 * Headless TipTap rich-text editor that emits sanitizable HTML. Lazily loaded
 * (only inside the admin post form) so regular users never download it.
 */
export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit (v3) bundles Link + Underline; configure the link here rather
      // than registering a second Link extension (which would error on duplicate).
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "journal-content min-h-[160px] focus:outline-none px-3 py-2",
      },
    },
  });

  // Sync external value changes (e.g. switching between create and edit) without
  // re-emitting an update (avoids an onChange feedback loop).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-md min-h-[200px] bg-gray-50" />
    );
  }

  const promptLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL du lien", previous || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2 bg-gray-50">
        <button type="button" title="Gras" className={toolbarBtn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">G</span>
        </button>
        <button type="button" title="Italique" className={toolbarBtn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </button>
        <button type="button" title="Souligné" className={toolbarBtn(editor.isActive("underline"))}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </button>
        <button type="button" title="Barré" className={toolbarBtn(editor.isActive("strike"))}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" title="Titre 2" className={toolbarBtn(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" title="Titre 3" className={toolbarBtn(editor.isActive("heading", { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" title="Liste à puces" className={toolbarBtn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • Liste
        </button>
        <button type="button" title="Liste numérotée" className={toolbarBtn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. Liste
        </button>
        <button type="button" title="Citation" className={toolbarBtn(editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          ❝
        </button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" title="Lien" className={toolbarBtn(editor.isActive("link"))}
          onClick={promptLink}>
          🔗 Lien
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
