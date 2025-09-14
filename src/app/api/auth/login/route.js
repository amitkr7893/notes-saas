import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { setCorsHeaders } from "@/lib/cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Handle CORS preflight
export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  setCorsHeaders(res);
  return res;
}

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      const res = NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      setCorsHeaders(res);
      return res;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const res = NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      setCorsHeaders(res);
      return res;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenantId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = NextResponse.json({ token });
    setCorsHeaders(res);
    return res;
  } catch (err) {
    const res = NextResponse.json({ error: err.message }, { status: 500 });
    setCorsHeaders(res);
    return res;
  }
}
