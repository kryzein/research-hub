import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RoomProvider } from "@liveblocks/react";
import { CollaborativeEditor } from "@/components/CollaborativeEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ClientSideSuspense } from "@liveblocks/react";

export default function ProjectEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get("fileId");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

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

  // If a fileId is provided, extract its text content
  const { data: fileText } = useQuery({
    queryKey: ["file-text", fileId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get file path from project_files
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

      if (!response.ok) throw new Error("Failed to extract text");
      const { text } = await response.json();
      return text as string;
    },
    enabled: !!fileId,
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

  const roomId = `project-${projectId}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.description || "Collaborative editor"}</p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
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
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <RoomProvider
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
          <CollaborativeEditor initialContent={fileText || undefined} />
        </ClientSideSuspense>
      </RoomProvider>
    </div>
  );
}
