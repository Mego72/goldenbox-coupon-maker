import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_BRANCHES = ["مدينتي", "ذايد", "أجورة", "القرية", "الشروق"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, customer_name, mobile_number, branch_name } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Coupon code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customer_name || typeof customer_name !== "string") {
      return new Response(
        JSON.stringify({ error: "Customer name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!mobile_number || typeof mobile_number !== "string") {
      return new Response(
        JSON.stringify({ error: "Mobile number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!branch_name || typeof branch_name !== "string" || !VALID_BRANCHES.includes(branch_name.trim())) {
      return new Response(
        JSON.stringify({ error: "Invalid branch name. Valid branches: " + VALID_BRANCHES.join(", ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check coupon exists and status
    const { data: coupon, error: fetchError } = await supabase
      .from("coupons")
      .select("id, is_active, is_consumed, expiry_date")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!coupon) {
      return new Response(
        JSON.stringify({ success: false, error: "Coupon not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (coupon.is_consumed) {
      return new Response(
        JSON.stringify({ success: false, error: "Coupon already consumed" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!coupon.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: "Coupon is inactive" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
    if (isExpired) {
      return new Response(
        JSON.stringify({ success: false, error: "Coupon has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Consume the coupon
    const { error: updateError } = await supabase
      .from("coupons")
      .update({
        is_consumed: true,
        consumed_at: new Date().toISOString(),
        consumed_by_customer: customer_name.trim(),
        consumed_by_mobile: mobile_number.trim(),
        branch_name: branch_name.trim(),
        is_active: false,
      })
      .eq("id", coupon.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to consume coupon" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Coupon consumed successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
