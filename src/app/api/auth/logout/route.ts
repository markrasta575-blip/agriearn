import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
