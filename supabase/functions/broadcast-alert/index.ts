import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AlertRequest {
  title: string;
  title_hi?: string;
  message: string;
  message_hi?: string;
  severity: "info" | "warning" | "critical" | "emergency";
  zone_ids?: string[];
  expires_in_minutes?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: AlertRequest = await req.json();

    // Validate required fields
    if (!body.title || !body.message || !body.severity) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, message, severity" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate expiration
    const expiresAt = body.expires_in_minutes
      ? new Date(Date.now() + body.expires_in_minutes * 60 * 1000).toISOString()
      : null;

    // Create the alert
    const { data: alert, error: insertError } = await supabase
      .from("alerts")
      .insert({
        title: body.title,
        title_hi: body.title_hi || null,
        message: body.message,
        message_hi: body.message_hi || null,
        severity: body.severity,
        zone_ids: body.zone_ids || null,
        expires_at: expiresAt,
        created_by: user.id,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create alert:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create alert" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For emergency alerts, also create an incident
    if (body.severity === "emergency" || body.severity === "critical") {
      await supabase.from("incidents").insert({
        title: `Emergency Alert: ${body.title}`,
        description: body.message,
        severity: body.severity,
        reported_by: user.id,
        zone_id: body.zone_ids?.[0] || null,
        status: "open",
      });
    }

    // Log the alert broadcast
    console.log(`Alert broadcast by ${user.email}: ${body.severity} - ${body.title}`);

    return new Response(
      JSON.stringify({
        success: true,
        alert,
        message: `Alert "${body.title}" broadcast successfully`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Broadcast error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
