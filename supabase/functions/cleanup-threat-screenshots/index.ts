import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cutoff = new Date(Date.now() - 45 * 60 * 1000).toISOString();

    // Get old threat logs with screenshots
    const { data: oldLogs, error: fetchError } = await supabase
      .from("threat_logs")
      .select("id, screenshot_url")
      .lt("created_at", cutoff)
      .not("screenshot_url", "is", null);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let deletedFiles = 0;
    let updatedLogs = 0;

    if (oldLogs && oldLogs.length > 0) {
      // Extract file names from URLs and delete from storage
      const fileNames = oldLogs
        .map((log: any) => {
          if (!log.screenshot_url) return null;
          const parts = log.screenshot_url.split("/");
          return parts[parts.length - 1];
        })
        .filter(Boolean) as string[];

      if (fileNames.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("threat-screenshots")
          .remove(fileNames);

        if (storageError) {
          console.warn("Storage delete error:", storageError);
        } else {
          deletedFiles = fileNames.length;
        }
      }

      // Clear screenshot_url from old logs (keep the log record)
      const ids = oldLogs.map((l: any) => l.id);
      const { error: updateError } = await supabase
        .from("threat_logs")
        .update({ screenshot_url: null })
        .in("id", ids);

      if (updateError) {
        console.warn("Update error:", updateError);
      } else {
        updatedLogs = ids.length;
      }
    }

    const result = {
      message: `Cleanup complete`,
      deleted_files: deletedFiles,
      updated_logs: updatedLogs,
      cutoff_time: cutoff,
    };

    console.log(JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
