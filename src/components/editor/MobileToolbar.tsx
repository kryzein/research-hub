import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Highlighter,
  Quote,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Columns3,
  RowsIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MobileToolbarProps {
  editor: Editor;
}

type ToolbarSection = "format" | "heading" | "align" | "list" | "insert" | "table";

const sections: { key: ToolbarSection; label: string }[] = [
  { key: "format", label: "Format" },
  { key: "heading", label: "Heading" },
  { key: "align", label: "Align" },
  { key: "list", label: "List" },
  { key: "insert", label: "Insert" },
  { key: "table", label: "Table" },
];

export function MobileToolbar({ editor }: MobileToolbarProps) {
  const [activeSection, setActiveSection] = useState<ToolbarSection>("format");

  const isInTable = editor.isActive("table");

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      {/* Section tabs */}
      <div className="flex items-center gap-0 overflow-x-auto border-b border-border no-scrollbar">
        {sections.map((section) => {
          if (section.key === "table" && !isInTable) return null;
          return (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`shrink-0 px-3 py-2 text-xs font-medium transition-colors ${
                activeSection === section.key
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Tool buttons */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto no-scrollbar">
        {activeSection === "format" && (
          <>
            <MobileBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              icon={<Bold className="h-4 w-4" />}
              label="Bold"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              icon={<Italic className="h-4 w-4" />}
              label="Italic"
            />
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).toggleUnderline().run()}
              active={editor.isActive("underline")}
              icon={<UnderlineIcon className="h-4 w-4" />}
              label="Underline"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              icon={<Strikethrough className="h-4 w-4" />}
              label="Strike"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive("highlight")}
              icon={<Highlighter className="h-4 w-4" />}
              label="Highlight"
            />
            <div className="w-px h-6 bg-border shrink-0 mx-0.5" />
            <MobileBtn
              onClick={() => editor.chain().focus().undo().run()}
              active={false}
              icon={<Undo className="h-4 w-4" />}
              label="Undo"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().redo().run()}
              active={false}
              icon={<Redo className="h-4 w-4" />}
              label="Redo"
            />
          </>
        )}

        {activeSection === "heading" && (
          <>
            <MobileBtn
              onClick={() => editor.chain().focus().setParagraph().run()}
              active={!editor.isActive("heading")}
              icon={<span className="text-xs font-semibold">P</span>}
              label="Paragraph"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive("heading", { level: 1 })}
              icon={<Heading1 className="h-4 w-4" />}
              label="H1"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive("heading", { level: 2 })}
              icon={<Heading2 className="h-4 w-4" />}
              label="H2"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive("heading", { level: 3 })}
              icon={<Heading3 className="h-4 w-4" />}
              label="H3"
            />
          </>
        )}

        {activeSection === "align" && (
          <>
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).setTextAlign("left").run()}
              active={editor.isActive({ textAlign: "left" })}
              icon={<AlignLeft className="h-4 w-4" />}
              label="Left"
            />
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).setTextAlign("center").run()}
              active={editor.isActive({ textAlign: "center" })}
              icon={<AlignCenter className="h-4 w-4" />}
              label="Center"
            />
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).setTextAlign("right").run()}
              active={editor.isActive({ textAlign: "right" })}
              icon={<AlignRight className="h-4 w-4" />}
              label="Right"
            />
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).setTextAlign("justify").run()}
              active={editor.isActive({ textAlign: "justify" })}
              icon={<AlignJustify className="h-4 w-4" />}
              label="Justify"
            />
          </>
        )}

        {activeSection === "list" && (
          <>
            <MobileBtn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              icon={<List className="h-4 w-4" />}
              label="Bullet"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              icon={<ListOrdered className="h-4 w-4" />}
              label="Numbered"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              active={editor.isActive("taskList")}
              icon={<CheckSquare className="h-4 w-4" />}
              label="Tasks"
            />
          </>
        )}

        {activeSection === "insert" && (
          <>
            <MobileBtn
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              icon={<Quote className="h-4 w-4" />}
              label="Quote"
            />
            <MobileBtn
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              active={false}
              icon={<Minus className="h-4 w-4" />}
              label="Divider"
            />
            <MobileBtn
              onClick={() =>
                (editor.chain().focus() as any)
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              active={false}
              icon={<TableIcon className="h-4 w-4" />}
              label="Table"
            />
          </>
        )}

        {activeSection === "table" && isInTable && (
          <>
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).addColumnAfter().run()}
              active={false}
              icon={<Columns3 className="h-4 w-4" />}
              label="Add Col"
            />
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).addRowAfter().run()}
              active={false}
              icon={<RowsIcon className="h-4 w-4" />}
              label="Add Row"
            />
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).deleteColumn().run()}
              active={false}
              icon={<Columns3 className="h-4 w-4 text-destructive" />}
              label="Del Col"
            />
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).deleteRow().run()}
              active={false}
              icon={<RowsIcon className="h-4 w-4 text-destructive" />}
              label="Del Row"
            />
            <MobileBtn
              onClick={() => (editor.chain().focus() as any).deleteTable().run()}
              active={false}
              icon={<Trash2 className="h-4 w-4 text-destructive" />}
              label="Delete"
            />
          </>
        )}
      </div>
    </div>
  );
}

function MobileBtn({
  onClick,
  active,
  icon,
  label,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`shrink-0 h-10 gap-1.5 px-2.5 rounded-lg ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground"
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Button>
  );
}
