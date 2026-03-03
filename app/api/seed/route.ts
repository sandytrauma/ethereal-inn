import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  await db.insert(users).values({
    name: "Admin Staff",
    email: "admin@ethereal.com",
    password: hashedPassword,
    role: "admin",
  });

  return NextResponse.json({ message: "Admin Seeded" });
}