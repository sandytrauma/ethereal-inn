"use server";

import { db } from "@/db";
import { inquiries, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createInquiryAction(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const message = formData.get("message") as string;
  const source = "Website_Direct";

  if (!name || !phone) return { error: "Name and Phone are required." };

  try {
    // 1. Client Upsert (Check if phone exists)
    let existingClient = await db.query.clients.findFirst({
      where: eq(clients.phone, phone),
    });

    let clientId: number;
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const [newClient] = await db.insert(clients).values({ name, phone }).returning({ id: clients.id });
      clientId = newClient.id;
    }

    // 2. Create Inquiry
    await db.insert(inquiries).values({
      clientId: clientId,
      source: source,
      message: message,
      status: "new",
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Inquiry Error:", error);
    return { error: "Submission failed." };
  }
}