// Products API: list / detail / create / update / delete.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError } from "@/lib/http";
import type { ProductPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseBenefits(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
    return [];
  } catch {
    return [];
  }
}

function toPublic(p: {
  id: string;
  name: string;
  category: string;
  price: number;
  dailyIncome: number;
  description: string;
  image: string;
  benefits: string;
  status: string;
  createdAt: Date;
}): ProductPublic {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    dailyIncome: p.dailyIncome,
    description: p.description,
    image: p.image,
    benefits: parseBenefits(p.benefits),
    status: p.status as "AVAILABLE" | "UNAVAILABLE",
    createdAt: p.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const all = url.searchParams.get("all") === "1";

    if (id) {
      const product = await db.product.findUnique({ where: { id } });
      if (!product) {
        return NextResponse.json(
          { ok: false, error: "Product not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, data: { product: toPublic(product) } });
    }

    if (all) {
      await requireAdmin();
      const products = await db.product.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({
        ok: true,
        data: { products: products.map(toPublic) },
      });
    }

    const products = await db.product.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      ok: true,
      data: { products: products.map(toPublic) },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const price = Number(body.price);
    const dailyIncome = Number(body.dailyIncome);
    const description =
      typeof body.description === "string" ? body.description : "";
    const image =
      typeof body.image === "string" && body.image.trim().length > 0
        ? body.image.trim()
        : "/wheat.jpg";
    const benefits = Array.isArray(body.benefits)
      ? body.benefits.filter((b): b is string => typeof b === "string")
      : [];
    const status =
      body.status === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";

    if (!name || !category || !Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid product fields" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        category,
        price,
        dailyIncome: Number.isFinite(dailyIncome) ? dailyIncome : 0,
        description,
        image,
        benefits: JSON.stringify(benefits),
        status,
      },
    });
    return NextResponse.json({ ok: true, data: { product: toPublic(product) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Product id is required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.category === "string") data.category = body.category.trim();
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (Number.isFinite(price)) data.price = price;
    }
    if (body.dailyIncome !== undefined) {
      const dailyIncome = Number(body.dailyIncome);
      if (Number.isFinite(dailyIncome)) data.dailyIncome = dailyIncome;
    }
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.image === "string") data.image = body.image.trim();
    if (Array.isArray(body.benefits)) {
      data.benefits = JSON.stringify(
        body.benefits.filter((b): b is string => typeof b === "string")
      );
    }
    if (body.status === "AVAILABLE" || body.status === "UNAVAILABLE") {
      data.status = body.status;
    }

    const product = await db.product.update({ where: { id }, data });
    return NextResponse.json({ ok: true, data: { product: toPublic(product) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Product id is required" },
        { status: 400 }
      );
    }
    await db.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
