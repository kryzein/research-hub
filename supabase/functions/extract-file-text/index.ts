import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { filePath } = await req.json();
    if (!filePath) {
      return new Response(JSON.stringify({ error: "filePath is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("project-papers")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Extract text based on file type
    const fileName = filePath.split("/").pop() || "";
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    let text = "";

    if (ext === "txt" || ext === "md" || ext === "rtf") {
      text = await fileData.text();
    } else if (ext === "docx") {
      try {
        const arrayBuffer = await fileData.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Extract document.xml which contains the main document content
        const documentXml = await zip.file("word/document.xml")?.async("string");
        
        if (documentXml) {
          // Extract text from <w:t> tags
          const textParts: string[] = [];
          const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
          let match;
          while ((match = regex.exec(documentXml)) !== null) {
            if (match[1]) {
              textParts.push(match[1]);
            }
          }
          
          // Also detect paragraph breaks by looking for </w:p> tags
          // Rebuild with paragraph awareness
          if (textParts.length > 0) {
            // Better approach: split by paragraphs
            const paragraphs: string[] = [];
            const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
            let pMatch;
            while ((pMatch = pRegex.exec(documentXml)) !== null) {
              const pContent = pMatch[0];
              const tParts: string[] = [];
              const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
              let tMatch;
              while ((tMatch = tRegex.exec(pContent)) !== null) {
                if (tMatch[1]) tParts.push(tMatch[1]);
              }
              if (tParts.length > 0) {
                paragraphs.push(tParts.join(""));
              }
            }
            text = paragraphs.length > 0 ? paragraphs.join("\n\n") : textParts.join("");
          } else {
            text = `[This file (${fileName}) is a Word document. The text extraction was limited. You can edit the content directly in the editor.]`;
          }
        } else {
          text = `[Could not find document content in ${fileName}.]`;
        }
      } catch (e) {
        console.error("DOCX extraction error:", e);
        text = `[Could not extract text from ${fileName}. You can edit the content directly in the editor.]`;
      }
    } else {
      try {
        text = await fileData.text();
        if (text.includes("\x00") || text.length > 100000) {
          text = `[This file (${fileName}) is a binary document. You can edit the content directly in the editor.]`;
        }
      } catch {
        text = `[Could not extract text from ${fileName}. Please paste your content directly into the editor.]`;
      }
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Extract text error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
