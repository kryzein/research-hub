import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LIVEBLOCKS_SECRET_KEY = Deno.env.get("LIVEBLOCKS_SECRET_KEY");
    if (!LIVEBLOCKS_SECRET_KEY) {
      throw new Error("LIVEBLOCKS_SECRET_KEY is not configured");
    }

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

    const { room } = await req.json();

    // Get user profile for display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .single();

    const response = await fetch("https://api.liveblocks.io/v2/rooms/" + encodeURIComponent(room) + "/authorize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LIVEBLOCKS_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        userInfo: {
          name: profile?.display_name || user.email || "Anonymous",
          avatar: profile?.avatar_url || "",
          color: getRandomColor(user.id),
        },
      }),
    });

    if (!response.ok) {
      // If room doesn't exist, create it first
      if (response.status === 404) {
        await fetch("https://api.liveblocks.io/v2/rooms", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LIVEBLOCKS_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: room,
            defaultAccesses: ["room:write"],
          }),
        });

        // Retry authorization
        const retryResponse = await fetch("https://api.liveblocks.io/v2/rooms/" + encodeURIComponent(room) + "/authorize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LIVEBLOCKS_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            userInfo: {
              name: profile?.display_name || user.email || "Anonymous",
              avatar: profile?.avatar_url || "",
              color: getRandomColor(user.id),
            },
          }),
        });

        const retryData = await retryResponse.text();
        return new Response(retryData, {
          status: retryResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errorText = await response.text();
      throw new Error(`Liveblocks auth failed [${response.status}]: ${errorText}`);
    }

    const data = await response.text();
    return new Response(data, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getRandomColor(seed: string): string {
  const colors = [
    "#E57373", "#F06292", "#BA68C8", "#9575CD",
    "#7986CB", "#64B5F6", "#4FC3F7", "#4DD0E1",
    "#4DB6AC", "#81C784", "#AED581", "#FFD54F",
    "#FFB74D", "#FF8A65",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
