import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

import LandingLoginPage from "@/components/Login";
import PortfolioSummary from "@/components/admin/PortfolioSummary"; // Import the async component
import Dashboard from "@/components/Dashboard";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  const session = token ? await decrypt(token).catch(() => null) : null;

  if (session) {
    const safeUser = {
      id: String(session.id || session.userId || session.sub || ""), 
      name: String(session.name || "Staff Member"),
      role: String(session.role || "staff"),
      email: String(session.email || "")
    };

    if (!safeUser.id) {
      console.error("Auth Failure: Session found but User ID is missing.");
      return <LandingLoginPage />; 
    }

    return (
      <div className="relative min-h-screen w-full bg-transparent overflow-x-hidden">
        {/* Pass PortfolioSummary as a child to avoid the 'Async Client Component' error */}
        <Dashboard user={safeUser}>
          <PortfolioSummary />
        </Dashboard>
      </div>
    );
  }

  return <LandingLoginPage />;
}