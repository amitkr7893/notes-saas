import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { setCorsHeaders } from "@/lib/cors";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

function getUserFromAuth(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  try {
    return jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  setCorsHeaders(res);
  return res;
}

export async function POST(req, context) {
  const { params } = await context; // ✅ await params
  const slugOrId = params.slug;     // could be slug or UUID

  const user = getUserFromAuth(req);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    setCorsHeaders(res);
    return res;
  }

  if (user.role !== "ADMIN") {
    const res = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    setCorsHeaders(res);
    return res;
  }

  // Update tenant plan by slug or ID
  let tenant;
  try {
    if (slugOrId.includes("-")) {
      // looks like UUID → try by id
      tenant = await prisma.tenant.update({
        where: { id: slugOrId },
        data: { plan: "PRO" },
      });
    } else {
      // assume slug
      tenant = await prisma.tenant.update({
        where: { slug: slugOrId },
        data: { plan: "PRO" },
      });
    }
  } catch (err) {
    const res = NextResponse.json({ error: "Tenant not found or update failed" }, { status: 404 });
    setCorsHeaders(res);
    return res;
  }

  const res = NextResponse.json({ success: true, tenant });
  setCorsHeaders(res);
  return res;
}
