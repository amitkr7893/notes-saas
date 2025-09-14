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

export async function GET(req, { params }) {
  const user = getUserFromAuth(req);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    setCorsHeaders(res);
    return res;
  }

  const note = await prisma.note.findFirst({
    where: { id: params.id, tenantId: user.tenantId },
  });

  if (!note) {
    const res = NextResponse.json({ error: "Not found" }, { status: 404 });
    setCorsHeaders(res);
    return res;
  }

  const res = NextResponse.json(note);
  setCorsHeaders(res);
  return res;
}

export async function PUT(req, { params }) {
  const user = getUserFromAuth(req);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    setCorsHeaders(res);
    return res;
  }

  const { title, content } = await req.json();
  const note = await prisma.note.updateMany({
    where: { id: params.id, tenantId: user.tenantId },
    data: { title, content },
  });

  if (!note.count) {
    const res = NextResponse.json({ error: "Not found" }, { status: 404 });
    setCorsHeaders(res);
    return res;
  }

  const res = NextResponse.json({ success: true });
  setCorsHeaders(res);
  return res;
}

export async function DELETE(req, { params }) {
  const user = getUserFromAuth(req);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    setCorsHeaders(res);
    return res;
  }

  const deleted = await prisma.note.deleteMany({
    where: { id: params.id, tenantId: user.tenantId },
  });

  if (!deleted.count) {
    const res = NextResponse.json({ error: "Not found" }, { status: 404 });
    setCorsHeaders(res);
    return res;
  }

  const res = NextResponse.json({ success: true });
  setCorsHeaders(res);
  return res;
}
