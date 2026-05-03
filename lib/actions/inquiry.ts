"use server";

import { db } from "@/db";
import { inquiries, clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { validate as validateUuid } from 'uuid';

export type InquiryResponse = {
  success?: boolean;
  error?: string;
};

/**
 * Creates an inquiry and binds it to a specific property.
 * Upserts the client based on phone number to prevent duplicate client records.
 */
export async function createInquiryAction(
  propertyId: string, 
  formData: FormData
): Promise<InquiryResponse> {
  // 1. Validate Property ID
  if (!propertyId || !validateUuid(propertyId)) {
    return { error: "Invalid or missing Property ID." };
  }

  // 2. Extract and Validate Form Data
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const message = formData.get("message") as string;
  const source = (formData.get("source") as string) || "Website_Direct";

  if (!name || !phone) {
    return { error: "Name and Phone are required." };
  }

  try {
    return await db.transaction(async (tx) => {
      // 3. Client Upsert (Check if phone exists globally)
      let existingClient = await tx.query.clients.findFirst({
        where: eq(clients.phone, phone),
      });

      let clientId: string | number; // Matches your schema's ID type

      if (existingClient) {
        clientId = existingClient.id;
        // Optional: Update name if the existing client's name is different
        if (existingClient.name !== name) {
          await tx.update(clients)
            .set({ name })
            .where(eq(clients.id, clientId));
        }
      } else {
        const [newClient] = await tx.insert(clients)
          .values({ 
            name, 
            phone 
          })
          .returning({ id: clients.id });
        clientId = newClient.id;
      }

      // 4. Create Inquiry linked to BOTH the Client and the Property
      await tx.insert(inquiries).values({
        propertyId: propertyId, // Binding to property
        clientId: clientId as any, // Cast if necessary based on schema type
        source: source,
        message: message || "No message provided",
        status: "new",
        createdAt: new Date(),
      });

      // 5. Revalidate relevant paths
      revalidatePath("/dashboard");
      revalidatePath(`/pms/${propertyId}`);
      revalidatePath("/inquiries");

      return { success: true };
    });
  } catch (error: any) {
    console.error("Inquiry Submission Error:", error);
    return { 
      error: error.message || "Failed to process inquiry. Please try again." 
    };
  }
}