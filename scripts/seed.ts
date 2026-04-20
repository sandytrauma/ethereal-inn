import { config } from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

// 1. Load environment variables IMMEDIATELY
config({ path: path.resolve(process.cwd(), ".env.local") });

async function seed() {
  console.log("🌱 Seeding Ethereal Inn Admin...");

  // 2. Validate that the DB URL is loaded before proceeding
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not found. Check your .env.local file.");
    process.exit(1);
  }

  // 3. Dynamically import DB components AFTER environment variables are set
  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const adminEmail = "admin@ethereal.com";
  const password = "admin123"; 
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    console.log("🔍 Checking for existing admin...");
    
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("⚠️ Admin user already exists. Skipping...");
    } else {
      console.log("🚀 Creating new admin user...");
      
      await db.insert(users).values({
        name: "Admin Staff",
        email: adminEmail,
        password: hashedPassword,
        role: "admin", 
        // If your schema requires propertyId, uncomment the line below:
        // propertyId: "YOUR_PROPERTY_ID_HERE", 
      });

      console.log("✅ Admin user created successfully!");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${password}`);
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    // 4. Ensure the process exits cleanly
    process.exit(0);
  }
}

// Execute the seed function
seed();