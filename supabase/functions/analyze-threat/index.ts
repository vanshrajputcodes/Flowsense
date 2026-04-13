import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an advanced CCTV security AI for public safety at large gatherings. Analyze every frame for threats AND visible crowd demographics.

IMPORTANT:
- Return only visible evidence from the frame.
- For gender, only use: Male, Female, Unknown.
- For ageGroup, only use: child, adult, elderly, unknown.
- Add a people array with one item per clearly visible person when possible.
- Do not guess wildly. Use Unknown when not reasonably inferable.
- Avoid false positives on common harmless objects like phones, umbrellas, water bottles, health masks, prayer items, and toys.

Threat categories to detect:
- weapon
- sharp_object
- blunt_weapon
- explosive
- chemical
- suspicious_behavior
- unattended_item
- fighting
- intrusion

Respond ONLY with valid JSON in this exact shape:
{
  "threats_detected": true,
  "threats": [
    {
      "object": "knife",
      "severity": "critical",
      "confidence": 85,
      "description": "Person holding a knife in right hand",
      "category": "weapon"
    }
  ],
  "demographics": {
    "estimated_males": 1,
    "estimated_females": 1,
    "estimated_children": 0,
    "estimated_elderly": 0,
    "crowd_density": "low"
  },
  "people": [
    {
      "gender": "Male",
      "ageGroup": "adult"
    },
    {
      "gender": "Female",
      "ageGroup": "adult"
    }
  ]
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this CCTV frame carefully for weapons, suspicious behaviors, and visible demographics. Return per-person gender and ageGroup only when reasonably inferable from the image."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 900,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { threats_detected: false, threats: [], demographics: null, people: [] };
    } catch {
      console.warn("Failed to parse AI response:", content);
      parsed = { threats_detected: false, threats: [], demographics: null, people: [] };
    }

    if (!Array.isArray(parsed.people)) parsed.people = [];
    if (!parsed.demographics) parsed.demographics = null;
    if (!Array.isArray(parsed.threats)) parsed.threats = [];
    if (typeof parsed.threats_detected !== "boolean") {
      parsed.threats_detected = parsed.threats.length > 0;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Threat analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
