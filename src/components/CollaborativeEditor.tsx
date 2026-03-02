import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontSize from "tiptap-fontsize-extension";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom, useSelf } from "@liveblocks/react";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { MobileToolbar } from "@/components/editor/MobileToolbar";
import { ActiveUsers } from "@/components/editor/ActiveUsers";
import { ImagePreviewModal } from "@/components/editor/ImagePreviewModal";
import { useState as useStateReact } from "react";

interface CollaborativeEditorProps {
  initialContent?: string;
  projectId?: string;
}

export function CollaborativeEditor({ initialContent, projectId }: CollaborativeEditorProps) {
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

  return <TiptapEditor doc={doc} provider={provider} initialContent={initialContent} projectId={projectId} />;
}

interface TiptapEditorProps {
  doc: Y.Doc;
  provider: LiveblocksYjsProvider;
  initialContent?: string;
  projectId?: string;
}

function TiptapEditor({ doc, provider, initialContent, projectId }: TiptapEditorProps) {
  const currentUser = useSelf();
  const [initialized, setInitialized] = useState(false);
  const [previewImage, setPreviewImage] = useStateReact<string | null>(null);

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
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      ImageExt.configure({
        HTMLAttributes: {
          class: "cursor-pointer max-w-full h-auto rounded-md",
        },
      }),
      Underline,
      TextStyle,
      Color,
      FontSize.configure({
        defaultSize: "16px",
        step: 2,
      }),
      Placeholder.configure({
        placeholder: "Start writing or paste content from your uploaded files...",
      }),
      Collaboration.configure({
        document: doc,
        field: "default",
      }),
      CollaborationCaret.configure({
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
        handleClick: (view, pos, event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === "IMG") {
            setPreviewImage((target as HTMLImageElement).src);
            return true;
          }
          return false;
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
      const isEmpty = editor.isEmpty;
      if (isEmpty) {
        editor.commands.setContent(initialContent);
      }
      setInitialized(true);
    }
  }, [editor, initialContent, initialized]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Desktop toolbar */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-2">
          <div className="flex-1">
            <EditorToolbar editor={editor} projectId={projectId} />
          </div>
          <ActiveUsers />
        </div>
      </div>

      {/* Mobile: only show active users bar */}
      <div className="sm:hidden border-b border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Editing</span>
        <ActiveUsers />
      </div>

      {/* Editor content - add bottom padding on mobile for floating toolbar */}
      <div className="sm:pb-0 pb-24">
        <EditorContent editor={editor} />
      </div>

      {/* Mobile floating toolbar */}
      <MobileToolbar editor={editor} />

      <ImagePreviewModal
        src={previewImage}
        alt="Editor image"
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
