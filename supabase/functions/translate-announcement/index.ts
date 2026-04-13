import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, languages } = await req.json();
    if (!text) throw new Error("No text provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const targetLangs = languages || ["hi", "ta", "bn", "te"];
    const langNames: Record<string, string> = {
      hi: "Hindi",
      ta: "Tamil",
      bn: "Bengali",
      te: "Telugu",
      mr: "Marathi",
      gu: "Gujarati",
      kn: "Kannada",
      ml: "Malayalam",
      pa: "Punjabi",
      ur: "Urdu",
    };

    const langList = targetLangs.map((l: string) => `${langNames[l] || l} (${l})`).join(", ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional translator for emergency public announcements at large Indian events. Translate accurately and naturally. Keep urgency and tone.`
          },
          {
            role: "user",
            content: `Translate this public announcement into ${langList}. Return ONLY a JSON object with language codes as keys and translations as values. No markdown, no explanation.\n\nAnnouncement: "${text}"`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_translations",
              description: "Return translations in multiple languages",
              parameters: {
                type: "object",
                properties: {
                  translations: {
                    type: "object",
                    description: "Language code to translation mapping",
                    additionalProperties: { type: "string" }
                  }
                },
                required: ["translations"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_translations" } }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Translation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let translations: Record<string, string> = {};

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      translations = parsed.translations || parsed;
    }

    // Always include English original
    translations["en"] = text;

    return new Response(JSON.stringify({ translations, original: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
