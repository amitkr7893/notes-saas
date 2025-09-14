import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
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

export async function GET(req, { params }) {
  const user = getUserFromAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const note = await prisma.note.findFirst({
    where: { id: params.id, tenantId: user.tenantId },
  });

  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(note);
}

export async function PUT(req, { params }) {
  const user = getUserFromAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content } = await req.json();
  const note = await prisma.note.updateMany({
    where: { id: params.id, tenantId: user.tenantId },
    data: { title, content },
  });

  if (!note.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  const user = getUserFromAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await prisma.note.deleteMany({
    where: { id: params.id, tenantId: user.tenantId },
  });

  if (!deleted.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
