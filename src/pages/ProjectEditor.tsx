import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoomProvider } from "@liveblocks/react";
import { CollaborativeEditor } from "@/components/CollaborativeEditor";
import { DocxViewer } from "@/components/DocxViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Share2, Copy, Check, FileText, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ClientSideSuspense } from "@liveblocks/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProjectEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileId = searchParams.get("fileId");
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");

  const { data: projectFiles } = useQuery({
    queryKey: ["project-files", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_files")
        .select("id, file_name, file_type, file_path")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const selectedFile = projectFiles?.find((f) => f.id === fileId);
  const isDocx = selectedFile?.file_name?.toLowerCase().endsWith(".docx");

  const { data: fileText } = useQuery({
    queryKey: ["file-text", fileId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: file, error: fileError } = await supabase
        .from("project_files")
        .select("file_path, file_name")
        .eq("id", fileId!)
        .single();
      if (fileError || !file) throw new Error("File not found");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-file-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ filePath: file.file_path }),
        }
      );

      if (!response.ok) {
        return `[Could not extract text from ${file.file_name}.]`;
      }
      const { text } = await response.json();
      return text as string;
    },
    enabled: !!fileId && !isDocx,
    retry: false,
  });

  const shareUrl = `${window.location.origin}/dashboard/editor/${projectId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="link" onClick={() => navigate("/dashboard/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const roomId = fileId ? `project-${projectId}-file-${fileId}` : `project-${projectId}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => navigate("/dashboard/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.description || "Collaborative editor"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {projectFiles && projectFiles.length > 0 && (
            <Select
              value={fileId || "none"}
              onValueChange={(value) => {
                setViewMode("edit");
                if (value === "none") {
                  setSearchParams({});
                } else {
                  setSearchParams({ fileId: value });
                }
              }}
            >
              <SelectTrigger className="w-[200px] min-h-[44px]">
                <FileText className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder="Select a file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Blank document</SelectItem>
                {projectFiles.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.file_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {isDocx && (
            <Button
              variant="outline"
              size="sm"
              className="min-w-[44px] min-h-[44px] gap-2"
              onClick={() => setViewMode(viewMode === "edit" ? "view" : "edit")}
            >
              {viewMode === "edit" ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {viewMode === "edit" ? "View" : "Edit"}
            </Button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[44px] min-h-[44px]">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share this document</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Anyone with access to this project can collaborate in real-time using this link.
              </p>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly />
                <Button onClick={handleCopyLink} variant="outline" className="min-w-[44px] min-h-[44px]">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Document Viewer Mode for DOCX */}
      {isDocx && viewMode === "view" && selectedFile ? (
        <DocxViewer filePath={selectedFile.file_path} fileName={selectedFile.file_name} />
      ) : (
        <RoomProvider
          key={fileId || "blank"}
          id={roomId}
          initialPresence={{}}
        >
          <ClientSideSuspense
            fallback={
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Connecting to collaboration session...
              </div>
            }
          >
            <CollaborativeEditor initialContent={fileText || undefined} projectId={projectId} />
          </ClientSideSuspense>
        </RoomProvider>
      )}
    </div>
  );
}
