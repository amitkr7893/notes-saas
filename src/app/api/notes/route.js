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

// GET → list notes
export async function GET(req) {
  const user = getUserFromAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.note.findMany({
    where: { tenantId: user.tenantId },
  });

  return NextResponse.json(notes);
}

// POST → create note
export async function POST(req) {
  const user = getUserFromAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });

  // enforce subscription limit
  if (tenant.plan === "FREE") {
    const count = await prisma.note.count({ where: { tenantId: user.tenantId } });
    if (count >= 3) {
      return NextResponse.json(
        { error: "Free plan limit reached. Upgrade to Pro." },
        { status: 403 }
      );
    }
  }

  const { title, content } = await req.json();
  const note = await prisma.note.create({
    data: {
      title,
      content,
      tenantId: user.tenantId,
      ownerId: user.userId,
    },
  });

  return NextResponse.json(note);
}
