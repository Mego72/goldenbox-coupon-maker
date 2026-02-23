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
    const { code, credit_number, company_due } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Coupon code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (credit_number === undefined && company_due === undefined) {
      return new Response(
        JSON.stringify({ error: "At least one of credit_number or company_due is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (company_due !== undefined && (typeof company_due !== "number" || company_due < 0)) {
      return new Response(
        JSON.stringify({ error: "company_due must be a positive number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (credit_number !== undefined && typeof credit_number !== "string") {
      return new Response(
        JSON.stringify({ error: "credit_number must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check coupon exists
    const { data: coupon, error: fetchError } = await supabase
      .from("coupons")
      .select("id, code")
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

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (credit_number !== undefined) updateData.credit_number = credit_number.trim();
    if (company_due !== undefined) updateData.company_due = company_due;

    const { error: updateError } = await supabase
      .from("coupons")
      .update(updateData)
      .eq("id", coupon.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update coupon" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Coupon updated successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
