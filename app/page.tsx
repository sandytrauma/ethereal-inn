import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/db"; // Points to your database initialization
import { properties as propertiesTable } from "@/db/micro-schema"; // Points to your micro-schema

import LandingLoginPage from "@/components/Login";
import PortfolioSummary from "@/components/admin/PortfolioSummary";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/layout/Footer";

// Define the interface to strictly match the UI expectations
interface Property {
  id: string; 
  name: string;
}

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // 1. Session Decryption
  const session = token ? await decrypt(token).catch(() => null) : null;

  if (session) {
    const safeUser = {
      id: String(session.id || session.userId || session.sub || ""), 
      name: String(session.name || "Staff Member"),
      role: String(session.role || "staff"),
      email: String(session.email || ""),
      // Use "global" as a fallback if no property is selected
      propertyId: session.propertyId ? String(session.propertyId) : "global"
    };

    if (!safeUser.id) return <LandingLoginPage />; 

    let propertyList: Property[] = []; 
    
    try {
      // 2. Fetch from /micro-schema
      const data = await db
        .select({
          id: propertiesTable.id,
          name: propertiesTable.name,
        })
        .from(propertiesTable);

      // 3. Normalize ID to string to avoid Number/UUID conflicts
      propertyList = data.map(p => ({
        id: String(p.id),
        name: p.name || "Unnamed Property"
      }));
    } catch (error) {
      console.error("Drizzle Fetch Error from micro-schema:", error);
    }

    return (
      <div className="relative min-h-screen w-full bg-transparent overflow-x-hidden">
        {/* Dashboard handles property context for the app */}
        <Dashboard 
          user={safeUser} 
          properties={propertyList}
        >
          {/* PortfolioSummary rendered as a server component child */}
          <PortfolioSummary />
        </Dashboard>
        <Footer/>
      </div>
    );
  }

  return <LandingLoginPage />;
}