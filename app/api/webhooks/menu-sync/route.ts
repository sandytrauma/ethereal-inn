// app/api/webhooks/menu-sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { reconcileScrapedPricesAction } from "@/lib/actions/culinary-sync";

// 🏎️ FORCE EDGE-COMPATIBLE RUNTIME EXECUTION matrix limits for peak scalability
export const runtime = "edge";

/**
 * PRODUCTION INGESTION WEBHOOK ENDPOINT
 * POST /api/webhooks/menu-sync
 */
export async function POST(req: NextRequest) {
  try {
    // 🛡️ SECURITY GATE 1: Verify inbound system handshake credentials using explicit naming
    const incomingAuthToken = req.headers.get("x-ethereal-webhook-secret");
    const internalSecretToken = process.env.MASTER_ADMIN_SECRET_CULINARY;

    if (!internalSecretToken || incomingAuthToken !== internalSecretToken) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Security Breach Rejection: Invalid webhook token signature." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request payload matching the Apify Webhook structural template
    const body = await req.json();
    const { eventType, eventData } = body;

    // Operational parameter checks for safety gates
    if (eventType !== "actor.run.succeeded" || !eventData) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Validation Failure: Faulty payload property parameters structure." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { outletId, platform, datasetId } = eventData;
    if (!outletId || !platform || !datasetId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Validation Failure: Missing essential operational eventData metrics." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Enforce multi-platform validation checks
    if (platform !== "zomato" && platform !== "swiggy" && platform !== "toing") {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Validation Failure: Unsupported platform source variable." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch the clean scraped dataset matrix directly from Apify's high-speed CDN cache pools
    const apifyDataUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true`;
    const apifyResponse = await fetch(apifyDataUrl);
    
    if (!apifyResponse.ok) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Failed to extract clean dataset array from Apify cloud storage." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const scrapedMenuDataset = await apifyResponse.json();

    // 4. Dispatch the payload arrays safely to your backend server execution threads for reconciliation
    const syncResult = await reconcileScrapedPricesAction(outletId, scrapedMenuDataset, platform);

    if (!syncResult.success) {
      return new NextResponse(
        JSON.stringify({ success: false, error: syncResult.error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: true, message: `Ecosystem pricing data array processed flawlessly for platform: ${platform}.` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Webhook Router Crash Exception:", error.message);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Internal server proxy execution exception loop break." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}