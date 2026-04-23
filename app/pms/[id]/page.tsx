import { getMultiPropertyData, getAllProperties } from "@/lib/actions/pms-actions";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth"; 
import PMSDashboard from "@/components/pms/PMSDashboard";
import { notFound, redirect } from "next/navigation";

// Define the expected session type for better TypeScript support
interface SessionPayload {
  name: string;
  role: "admin" | "manager" | "staff";
  email: string;
}

export default async function MultiPropertyPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const propertyId = params.id;

  // 1. Fetch & Decrypt Session
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  
  // Decrypt and cast the type so the dashboard knows exactly what role it's getting
  const session = token ? await decrypt(token) as unknown as SessionPayload : null;

  // 2. Strict Authentication Guard
  if (!session) {
    redirect("/ethereal-inn");
  }

  // 3. Parallel Data Fetching (Optimized Performance)
  const [data, fleet] = await Promise.all([
    getMultiPropertyData(propertyId),
    getAllProperties()
  ]);

  // Error Handling: If property doesn't exist in DB
  if (!data || "error" in data || !data.property) {
    return notFound();
  }

  // 4. Render Dashboard with Session Context
  return (
    <PMSDashboard 
      property={data.property}
      rooms={data.rooms}
      tasks={data.tasks || []}
      finance={data.financials} 
      inquiries={data.inquiries || []}
      statutory={data.statutory || []}
      stats={data.stats}
      user={{
        name: session.name || "Administrator",
        role: session.role || "staff" // Fallback to staff if role is missing
      }}
    />
  );
}