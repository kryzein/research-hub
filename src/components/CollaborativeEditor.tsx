import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom, useSelf, useOthers } from "@liveblocks/react";
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Highlighter, Quote, Minus, Undo, Redo, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CollaborativeEditorProps {
  initialContent?: string;
}

export function CollaborativeEditor({ initialContent }: CollaborativeEditorProps) {
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    setDoc(yDoc);
    setProvider(yProvider);

    return () => {
      yDoc.destroy();
      yProvider.destroy();
    };
  }, [room]);

  if (!doc || !provider) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return <TiptapEditor doc={doc} provider={provider} initialContent={initialContent} />;
}

interface TiptapEditorProps {
  doc: Y.Doc;
  provider: LiveblocksYjsProvider;
  initialContent?: string;
}

function TiptapEditor({ doc, provider, initialContent }: TiptapEditorProps) {
  const currentUser = useSelf();
  const others = useOthers();
  const [initialized, setInitialized] = useState(false);

  const userName = (currentUser?.info?.name as string) || "Anonymous";
  const userColor = (currentUser?.info?.color as string) || "#999";

  const editorExtensions = useMemo(
    () => [
      StarterKit.configure({
        undoRedo: false,
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Start writing or paste content from your uploaded files...",
      }),
      Collaboration.configure({
        document: doc,
        field: "default",
      }),
      CollaborationCursor.configure({
        provider,
        user: { name: "Anonymous", color: "#999" },
      }),
    ],
    [doc, provider],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      extensions: editorExtensions,
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[400px] px-6 py-4 text-foreground",
        },
      },
    },
    [doc, provider],
  );

  useEffect(() => {
    if (!editor) return;

    editor.commands.updateUser({
      name: userName,
      color: userColor,
    });
  }, [editor, userName, userColor]);

  // Insert initial content once when the Yjs doc is empty
  useEffect(() => {
    if (editor && initialContent && !initialized) {
      const yText = doc.getText("default");
      if (yText.length === 0) {
        editor.commands.setContent(initialContent);
      }
      setInitialized(true);
    }
  }, [editor, initialContent, initialized, doc]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 px-2 py-1.5 flex items-center gap-0.5 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          icon={<Bold className="h-4 w-4" />}
          tooltip="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          icon={<Italic className="h-4 w-4" />}
          tooltip="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          icon={<Strikethrough className="h-4 w-4" />}
          tooltip="Strikethrough"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          icon={<Code className="h-4 w-4" />}
          tooltip="Code"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          icon={<Highlighter className="h-4 w-4" />}
          tooltip="Highlight"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          icon={<Heading1 className="h-4 w-4" />}
          tooltip="Heading 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          icon={<Heading2 className="h-4 w-4" />}
          tooltip="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          icon={<Heading3 className="h-4 w-4" />}
          tooltip="Heading 3"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          icon={<List className="h-4 w-4" />}
          tooltip="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          icon={<ListOrdered className="h-4 w-4" />}
          tooltip="Ordered List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive("taskList")}
          icon={<CheckSquare className="h-4 w-4" />}
          tooltip="Task List"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          icon={<Quote className="h-4 w-4" />}
          tooltip="Quote"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false}
          icon={<Minus className="h-4 w-4" />}
          tooltip="Divider"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          icon={<Undo className="h-4 w-4" />}
          tooltip="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          icon={<Redo className="h-4 w-4" />}
          tooltip="Redo"
        />

        {/* Active users */}
        <div className="ml-auto flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground mr-1" />
          {currentUser?.info && (
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-6 w-6 border-2" style={{ borderColor: currentUser.info.color as string }}>
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {(currentUser.info.name as string)?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{currentUser.info.name as string} (you)</TooltipContent>
            </Tooltip>
          )}
          {others.map((other) => (
            <Tooltip key={other.connectionId}>
              <TooltipTrigger>
                <Avatar className="h-6 w-6 border-2" style={{ borderColor: other.info?.color as string }}>
                  <AvatarFallback className="text-[10px]" style={{ backgroundColor: other.info?.color as string, color: "white" }}>
                    {(other.info?.name as string)?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{other.info?.name as string}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  icon,
  tooltip,
}: {
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
          className={`h-8 w-8 ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
