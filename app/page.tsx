import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import LandingLoginPage from "@/components/Login";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // Verify session on the server
  const session = token ? await decrypt(token).catch(() => null) : null;

  // --- DEBUGGING: Check your terminal logs to see the structure ---
  if (session) {
    console.log("Server Session Data:", session);
  }

  if (session) {
    // Ensure we are passing a clean user object with a guaranteed ID
    const safeUser = {
      id: session.id || session.userId || session.sub, // Fallbacks for common ID names
      name: session.name || "User",
      role: session.role || "staff",
      email: session.email || ""
    };

    // If even after fallbacks ID is missing, we handle it
    if (!safeUser.id) {
      console.error("Critical: Session decrypted but no ID found.");
    }

    return <Dashboard user={safeUser} />;
  }

  return <LandingLoginPage />;
}