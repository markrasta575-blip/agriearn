// Admin image upload. Accepts { imageBase64, filename } and writes the decoded
// image to /public/uploads/<uuid>.<ext>. Returns { url }.
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { requireAdmin } from "@/lib/session";
import { handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

const ALLOWED_EXT = new Set(["png", "jpg", "jpeg", "webp"]);

function decodeBase64Image(raw: string): { buffer: Buffer; ext: string } | null {
  let ext = "";
  let payload = raw;
  // Support data URLs: data:image/png;base64,xxxx
  const m = raw.match(/^data:image\/([a-zA-Z0-9]+);base64,(.*)$/);
  if (m) {
    ext = m[1].toLowerCase();
    payload = m[2];
  }
  let buffer: Buffer;
  try {
    buffer = Buffer.from(payload, "base64");
  } catch {
    return null;
  }
  if (!buffer || buffer.length === 0) return null;
  if (!ext) {
    // Try to sniff from the first bytes.
    if (buffer.length >= 4) {
      const sig = buffer.toString("hex", 0, 4).toLowerCase();
      if (sig.startsWith("89504e47")) ext = "png";
      else if (sig.startsWith("ffd8")) ext = "jpg";
      else if (sig.startsWith("52494646")) ext = "webp";
    }
  }
  if (!ALLOWED_EXT.has(ext)) return null;
  return { buffer, ext };
}

function extFromFilename(name: string): string | null {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = name.slice(dot + 1).toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : null;
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const imageBase64 =
      typeof body.imageBase64 === "string" ? body.imageBase64 : "";
    const filename =
      typeof body.filename === "string" ? body.filename : "";

    if (!imageBase64) {
      return NextResponse.json(
        { ok: false, error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    let decoded = decodeBase64Image(imageBase64);
    if (!decoded && filename) {
      // Fallback: raw base64 + filename for extension.
      const ext = extFromFilename(filename);
      if (ext) {
        try {
          const buffer = Buffer.from(imageBase64, "base64");
          if (buffer.length > 0) decoded = { buffer, ext };
        } catch {
          decoded = null;
        }
      }
    }

    if (!decoded) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid image (allowed: png, jpg, jpeg, webp)",
        },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const fname = `${randomUUID()}.${decoded.ext}`;
    await fs.writeFile(path.join(uploadsDir, fname), decoded.buffer);
    return NextResponse.json({ ok: true, data: { url: `/uploads/${fname}` } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
