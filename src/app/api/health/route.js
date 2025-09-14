import { NextResponse } from "next/server";
import { setCorsHeaders } from "@/lib/cors";

export function GET() {
  const res = NextResponse.json({ status: "ok" });
  setCorsHeaders(res);
  return res;
}

export function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  setCorsHeaders(res);
  return res;
}
