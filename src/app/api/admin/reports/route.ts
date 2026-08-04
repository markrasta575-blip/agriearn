// Admin reports: platform KPIs + 7-day revenue & purchase trends.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { handleError } from "@/lib/http";
import { computeAdminReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const { report, revenue7d, purchases7d } = await computeAdminReport();
    return NextResponse.json({
      ok: true,
      data: { report, revenue7d, purchases7d },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
