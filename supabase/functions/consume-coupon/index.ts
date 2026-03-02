import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, customer_name, mobile_number, branch_name, credit_number, company_due } = await req.json();

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

    if (!branch_name || typeof branch_name !== "string" || branch_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Branch name is required" }),
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
      .select("id, is_active, is_consumed, expiry_date, is_unlimited")
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

    // For non-unlimited coupons, check if already consumed
    if (!coupon.is_unlimited && coupon.is_consumed) {
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

    if (coupon.is_unlimited) {
      // For unlimited coupons, insert into coupon_consumptions table
      const consumptionData: Record<string, unknown> = {
        coupon_id: coupon.id,
        code: code.trim().toUpperCase(),
        branch_name: branch_name.trim(),
        customer_name: customer_name.trim(),
        mobile_number: mobile_number.trim(),
      };

      if (credit_number !== undefined && typeof credit_number === "string") {
        consumptionData.credit_number = credit_number.trim();
      }
      if (company_due !== undefined && typeof company_due === "number" && company_due >= 0) {
        consumptionData.company_due = company_due;
      }

      const { error: insertError } = await supabase
        .from("coupon_consumptions")
        .insert(consumptionData);

      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Failed to log consumption" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Coupon consumed successfully (unlimited)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Single-use coupon: mark as consumed
      const updateData: Record<string, unknown> = {
        is_consumed: true,
        consumed_at: new Date().toISOString(),
        consumed_by_customer: customer_name.trim(),
        consumed_by_mobile: mobile_number.trim(),
        branch_name: branch_name.trim(),
        is_active: false,
      };

      if (credit_number !== undefined && typeof credit_number === "string") {
        updateData.credit_number = credit_number.trim();
      }
      if (company_due !== undefined && typeof company_due === "number" && company_due >= 0) {
        updateData.company_due = company_due;
      }

      const { error: updateError } = await supabase
        .from("coupons")
        .update(updateData)
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
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
