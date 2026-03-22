import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import LandingLoginPage from "@/components/Login";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // Verify session on the server
  const session = token ? await decrypt(token).catch(() => null) : null;

  if (session) {
    // 1. Clean User Object Construction
    const safeUser = {
      // Prioritize the ID fields used in Drizzle/JWT
      id: String(session.id || session.userId || session.sub || ""), 
      name: session.name || "Staff Member",
      role: session.role || "staff",
      email: session.email || ""
    };

    // 2. Safety Check for Corrupted Sessions
    if (!safeUser.id) {
      console.error("Auth Failure: Session found but User ID is missing.");
      return <LandingLoginPage />; 
    }

    // 3. Transparent Layout Injection
    // We use min-h-screen and bg-transparent to ensure the 
    // fixed background blobs are visible behind the Dashboard panels.
    return (
      <div className="relative min-h-screen w-full bg-transparent overflow-x-hidden">
        <Dashboard user={safeUser} />
      </div>
    );
  }

  // If no session, show login
  return <LandingLoginPage />;
}