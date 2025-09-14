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

export async function POST(req, { params }) {
  const user = getUserFromAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenant = await prisma.tenant.update({
    where: { slug: params.slug },
    data: { plan: "PRO" },
  });

  return NextResponse.json({ success: true, tenant });
}
