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

// GET → list notes
export async function GET(req) {
  const user = getUserFromAuth(req);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    setCorsHeaders(res);
    return res;
  }

  const [notes, tenant] = await Promise.all([
    prisma.note.findMany({
      where: { tenantId: user.tenantId },
      include: { owner: true }, // optional: include owner info
    }),
    prisma.tenant.findUnique({ where: { id: user.tenantId } }),
  ]);

  const res = NextResponse.json({ notes, tenant });
  setCorsHeaders(res);
  return res;
}


// POST → create note
export async function POST(req) {
  const user = getUserFromAuth(req);
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    setCorsHeaders(res);
    return res;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });

  // enforce subscription limit
  if (tenant.plan === "FREE") {
    const count = await prisma.note.count({ where: { tenantId: user.tenantId } });
    if (count >= 3) {
      const res = NextResponse.json(
        { error: "Free plan limit reached. Upgrade to Pro." },
        { status: 403 }
      );
      setCorsHeaders(res);
      return res;
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

  const res = NextResponse.json(note);
  setCorsHeaders(res);
  return res;
}
