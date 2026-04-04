"use server";
import { Resend } from 'resend';

// Safety check for Environment Variable
if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is missing from environment variables.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAction(formData: FormData) {
  // Extract and validate
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const subject = formData.get("subject")?.toString();
  const message = formData.get("message")?.toString();

  if (!name || !email || !message) {
    return { success: false, error: "Missing required fields." };
  }

  try {
    const { data, error } = await resend.emails.send({
      // Your verified Resend domain identity
      from: 'Ethereal Inn Concierge <inquiry@feruecrisu.resend.app>',
      to: 'etherealinn055@gmail.com', 
      subject: `[Website Inquiry] ${subject}`,
      replyTo: email, 
      // Plain text version for accessibility/spam filters
      text: `New Inquiry from ${name} (${email}): ${message}`,
      // HTML version for a clean look in your Gmail inbox
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #c5a059; font-style: italic;">New Ethereal Inn Inquiry</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <footer style="margin-top: 20px; font-size: 12px; color: #888;">
            Sent via Ethereal Inn Web Portal
          </footer>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("System Email Error:", error);
    return { success: false, error: "System error. Please try WhatsApp." };
  }
}