import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Coupon code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("coupons")
      .select("id, code, discount_type, discount_value, max_discount_value, company_name, expiry_date, is_active, is_consumed, consumed_at, consumed_by_customer, consumed_by_mobile")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isExpired = data.expiry_date && new Date(data.expiry_date) < new Date();

    return new Response(
      JSON.stringify({
        valid: data.is_active && !data.is_consumed && !isExpired,
        coupon: {
          id: data.id,
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          max_discount_value: data.max_discount_value,
          company_name: data.company_name,
          expiry_date: data.expiry_date,
          is_active: data.is_active,
          is_consumed: data.is_consumed,
          consumed_at: data.consumed_at,
          consumed_by_customer: data.consumed_by_customer,
          consumed_by_mobile: data.consumed_by_mobile,
          is_expired: !!isExpired,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
