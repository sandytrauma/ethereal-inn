"use server";
import { Resend } from 'resend';
import { db } from '@/db';
import { properties } from '@/db/micro-schema';
import { inquiries } from '@/db/schema'; // Using your existing inquiries table
import { eq } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function dispatchToProperty(propertyId: string, guestData: any) {
  try {
    // Find which manager needs to receive this
    const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
    
    if (!property) throw new Error("Property not found");

    // 1. Log to your PARENT inquiries table (keeping your original logic)
    // We assume you add a 'propertyId' column to your existing inquiries table
    await db.insert(inquiries).values({
      propertyId: property.id,
      message: guestData.message,
      status: "new",
    });

    // 2. Send the routed email
    await resend.emails.send({
      from: 'Ethereal Logistics <onboarding@resend.dev>',
      to: property.managerEmail,
      subject: `[Routing] New Inquiry for ${property.name}`,
      text: `Guest: ${guestData.name}\nMessage: ${guestData.message}`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}