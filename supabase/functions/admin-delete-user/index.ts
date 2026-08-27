// Follow Deno and Supabase Edge Function conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client with caller's token to check admin role
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: callerUser },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !callerUser) {
      return new Response(JSON.stringify({ error: "Invalid token or user not found" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller has 'admin' role in profiles
    const { data: callerProfile, error: profileCheckError } = await callerClient
      .from("profiles")
      .select("id, role, username")
      .eq("id", callerUser.id)
      .single();

    if (profileCheckError || callerProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized. Admin role required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse target userId
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Target userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userId === callerUser.id) {
      return new Response(JSON.stringify({ error: "Admin cannot delete their own account." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client with service_role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get target profile info & counts before deletion
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("username, role")
      .eq("id", userId)
      .single();

    const { count: charCount } = await adminClient
      .from("characters")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", userId);

    const { count: campMemberCount } = await adminClient
      .from("campaign_members")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", userId);

    // 1. Delete from auth.users (cascades to profiles and all related tables)
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      return new Response(JSON.stringify({ error: deleteAuthError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Also ensure profile is deleted if not automatically cascaded by auth.users
    await adminClient.from("profiles").delete().eq("id", userId);

    // 3. Log admin action
    await adminClient.from("admin_logs").insert({
      admin_id: callerUser.id,
      action: "user.delete",
      target_type: "profile",
      target_id: userId,
      details: {
        deleted_username: targetProfile?.username || "Unknown",
        deleted_role: targetProfile?.role || "player",
        characters_deleted: charCount || 0,
        campaign_memberships_removed: campMemberCount || 0,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetProfile?.username || userId} and all associated data deleted successfully.`,
        details: {
          charactersDeleted: charCount || 0,
          campaignsRemoved: campMemberCount || 0,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
