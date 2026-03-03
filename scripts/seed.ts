import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding Ethereal Inn Admin...");

  const adminEmail = "admin@ethereal.com";
  const password = "admin123"; // Change this after first login!
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      name: "Admin Staff",
      email: adminEmail,
      password: hashedPassword,
      role: "admin", // Ensure this matches your schema enum
    });

    console.log("✅ Admin user created successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seed();