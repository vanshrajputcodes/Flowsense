import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PredictionRequest {
  zone_id?: string;
  hours_ahead?: number;
}

interface ZoneData {
  id: string;
  name: string;
  capacity: number;
  current_count: number;
}

interface SensorReading {
  recorded_at: string;
  count: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { zone_id, hours_ahead = 12 }: PredictionRequest = await req.json();

    // Fetch zones to predict for
    let zonesQuery = supabase.from("zones").select("id, name, capacity, current_count");
    if (zone_id) {
      zonesQuery = zonesQuery.eq("id", zone_id);
    }
    const { data: zones, error: zonesError } = await zonesQuery;

    if (zonesError) throw zonesError;
    if (!zones || zones.length === 0) {
      return new Response(JSON.stringify({ error: "No zones found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recent sensor readings for context
    const { data: recentReadings } = await supabase
      .from("sensor_readings")
      .select("zone_id, recorded_at, count")
      .order("recorded_at", { ascending: false })
      .limit(100);

    // Get current time context
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Build context for AI
    const zoneContext = zones.map((z: ZoneData) => ({
      name: z.name,
      capacity: z.capacity,
      current_occupancy: Math.round((z.current_count / z.capacity) * 100),
      current_count: z.current_count,
    }));

    const historicalContext = recentReadings
      ? recentReadings.slice(0, 20).map((r: SensorReading) => ({
          time: new Date(r.recorded_at).toLocaleTimeString(),
          count: r.count,
        }))
      : [];

    // Call Lovable AI for predictions
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI crowd prediction system for FlowSense AI, a smart crowd management platform for India's high-traffic public spaces like pilgrimage sites, temples, and tourist attractions.

Your task is to generate realistic hourly footfall predictions based on:
- Current zone occupancy data
- Time of day patterns (morning rush, afternoon peak, evening decline)
- Day of week patterns (weekends typically 30-50% higher than weekdays)
- Indian context (religious sites peak on auspicious days, festivals)

Always return predictions in valid JSON format. Be realistic - footfall typically follows patterns:
- 6-8 AM: Low (10-20% of peak)
- 8-10 AM: Rising (40-60% of peak)  
- 10 AM - 2 PM: Peak hours (80-100%)
- 2-5 PM: Moderate (50-70%)
- 5-8 PM: Evening peak (70-90%)
- 8 PM onwards: Declining

Add some natural variation (±10%) to make predictions realistic.`,
          },
          {
            role: "user",
            content: `Generate footfall predictions for the next ${hours_ahead} hours.

Current Context:
- Day: ${dayOfWeek}
- Current Hour: ${hour}:00
- Weekend: ${isWeekend ? "Yes" : "No"}

Current Zone Status:
${JSON.stringify(zoneContext, null, 2)}

Recent Sensor Data:
${JSON.stringify(historicalContext, null, 2)}

Return a JSON object with this exact structure:
{
  "predictions": [
    {
      "zone_name": "Zone Name",
      "zone_id": "zone-uuid-here",
      "hourly_predictions": [
        { "hour": "14:00", "predicted_count": 1234, "confidence": 0.85 }
      ],
      "surge_warning": true/false,
      "peak_hour": "14:00",
      "recommendation": "Brief recommendation text"
    }
  ],
  "overall_trend": "increasing/stable/decreasing",
  "risk_level": "low/medium/high",
  "summary": "Brief overall summary"
}

Use actual zone names and realistic predicted counts based on capacities. Zone IDs: ${zones.map((z: ZoneData) => `${z.name}: ${z.id}`).join(", ")}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content in AI response");
    }

    // Parse AI response - extract JSON from potential markdown code blocks
    let predictions;
    try {
      // Try to extract JSON from code blocks if present
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : aiContent.trim();
      predictions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Failed to parse AI predictions");
    }

    // Store predictions in database
    const predictionInserts = [];
    for (const zonePred of predictions.predictions || []) {
      for (const hourlyPred of zonePred.hourly_predictions || []) {
        const predictionTime = new Date();
        const [predHour] = hourlyPred.hour.split(":");
        predictionTime.setHours(parseInt(predHour), 0, 0, 0);
        if (parseInt(predHour) < hour) {
          predictionTime.setDate(predictionTime.getDate() + 1);
        }

        predictionInserts.push({
          zone_id: zonePred.zone_id,
          predicted_count: hourlyPred.predicted_count,
          prediction_for: predictionTime.toISOString(),
          confidence: hourlyPred.confidence || 0.8,
          factors: {
            day_of_week: dayOfWeek,
            is_weekend: isWeekend,
            surge_warning: zonePred.surge_warning,
            recommendation: zonePred.recommendation,
          },
        });
      }
    }

    if (predictionInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("predictions")
        .upsert(predictionInserts, { onConflict: "zone_id,prediction_for" });

      if (insertError) {
        console.error("Failed to store predictions:", insertError);
      }
    }

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
