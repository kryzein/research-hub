import { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Highlighter, Quote, Minus, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon, ImagePlus, Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditorToolbarProps {
  editor: Editor;
  projectId?: string;
}

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "64"];

export function EditorToolbar({ editor, projectId }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${session.user.id}/${projectId || "general"}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-papers")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("project-papers")
        .getPublicUrl(filePath);

      (editor.chain().focus() as any).setImage({ src: publicUrl, alt: file.name }).run();
      toast.success("Image inserted");
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Failed to upload image");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currentFontSize = (editor.getAttributes("fontSize") as any)?.size?.replace("px", "") || "16";

  return (
    <div className="border-b border-border bg-muted/30 px-2 py-1.5 flex items-center gap-0.5 flex-wrap">
      {/* Font Size */}
      <Select
        value={currentFontSize}
        onValueChange={(val) => {
          (editor.chain().focus() as any).setFontSize(`${val}px`).run();
        }}
      >
        <SelectTrigger className="w-[70px] h-8 text-xs">
          <Type className="h-3 w-3 mr-1 shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((s) => (
            <SelectItem key={s} value={s}>{s}px</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} icon={<Bold className="h-4 w-4" />} tooltip="Bold" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} icon={<Italic className="h-4 w-4" />} tooltip="Italic" />
      <ToolbarBtn onClick={() => (editor.chain().focus() as any).toggleUnderline().run()} active={editor.isActive("underline")} icon={<UnderlineIcon className="h-4 w-4" />} tooltip="Underline" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} icon={<Strikethrough className="h-4 w-4" />} tooltip="Strikethrough" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} icon={<Code className="h-4 w-4" />} tooltip="Code" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} icon={<Highlighter className="h-4 w-4" />} tooltip="Highlight" />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} icon={<Heading1 className="h-4 w-4" />} tooltip="Heading 1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} icon={<Heading2 className="h-4 w-4" />} tooltip="Heading 2" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} icon={<Heading3 className="h-4 w-4" />} tooltip="Heading 3" />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn onClick={() => (editor.chain().focus() as any).setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} icon={<AlignLeft className="h-4 w-4" />} tooltip="Align Left" />
      <ToolbarBtn onClick={() => (editor.chain().focus() as any).setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} icon={<AlignCenter className="h-4 w-4" />} tooltip="Align Center" />
      <ToolbarBtn onClick={() => (editor.chain().focus() as any).setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} icon={<AlignRight className="h-4 w-4" />} tooltip="Align Right" />
      <ToolbarBtn onClick={() => (editor.chain().focus() as any).setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} icon={<AlignJustify className="h-4 w-4" />} tooltip="Justify" />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} icon={<List className="h-4 w-4" />} tooltip="Bullet List" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} icon={<ListOrdered className="h-4 w-4" />} tooltip="Ordered List" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} icon={<CheckSquare className="h-4 w-4" />} tooltip="Task List" />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} icon={<Quote className="h-4 w-4" />} tooltip="Quote" />
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} icon={<Minus className="h-4 w-4" />} tooltip="Divider" />
      <ToolbarBtn
        onClick={() => (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        active={editor.isActive("table")}
        icon={<TableIcon className="h-4 w-4" />}
        tooltip="Insert Table"
      />
      <ToolbarBtn
        onClick={() => fileInputRef.current?.click()}
        active={false}
        icon={<ImagePlus className="h-4 w-4" />}
        tooltip="Insert Image"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} icon={<Undo className="h-4 w-4" />} tooltip="Undo" />
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} icon={<Redo className="h-4 w-4" />} tooltip="Redo" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}

function ToolbarBtn({ onClick, active, icon, tooltip }: {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
