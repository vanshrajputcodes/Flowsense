import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { location, message, zone_id, phone, name, latitude, longitude } = await req.json();

    // Validate required fields for anonymous SOS
    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!location || !location.trim()) {
      return new Response(
        JSON.stringify({ error: 'Location is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for optional auth - user may or may not be logged in
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    // Generate a unique token number (SOS-XXXXXX format)
    const tokenNumber = `SOS-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Create SOS request (works for both authenticated and anonymous users)
    const { data: sosRequest, error: sosError } = await supabase
      .from('sos_requests')
      .insert({
        user_id: userId,
        token_number: tokenNumber,
        phone: phone?.trim() || null,
        location: location.trim(),
        message: message?.trim() || `Emergency from ${name.trim()}`,
        zone_id: zone_id || null,
        status: 'active',
        latitude: latitude || null,
        longitude: longitude || null,
        sender_name: name.trim(),
        sender_email: userEmail,
      })
      .select()
      .single();

    if (sosError) {
      console.error('SOS creation error:', sosError);
      return new Response(
        JSON.stringify({ error: 'Failed to create SOS request', details: sosError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('SOS Request created:', tokenNumber, 'by:', name, 'at:', location);

    return new Response(
      JSON.stringify({
        success: true,
        token_number: tokenNumber,
        message: 'SOS request sent successfully. Help is on the way!',
        sos_request: {
          ...sosRequest,
          user_name: name.trim(),
          user_phone: phone?.trim() || null
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SOS function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
