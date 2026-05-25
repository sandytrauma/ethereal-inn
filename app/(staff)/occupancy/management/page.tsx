// app/(staff)/occupancy/management/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/auth";
import PropertyLauncher from "@/components/admin/PropertyLauncher";

interface SessionPayload {
  userId: number;
  id?: number | string; 
  sub?: string;         
  name: string;
  role: string; // Adjusted to match generic casing check strings cleanly
  email: string;
}

export default async function ManagementPage() {
  // 1. EXTRACT AND VERIFY SEED CREDENTIALS ON THE SERVER
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  const session = token ? (await decrypt(token).catch(() => null)) as unknown as SessionPayload : null;

  // 2. SECURITY CHECKPOINT A: Send unauthenticated walk-ins back to login gate
  if (!session) {
    redirect("/ethereal-inn");
  }

  // Normalize role matching signatures to safeguard containment fences
  const safeRole = String(session.role || "staff").toLowerCase().trim();
  const isMasterSuperAdmin = Number(session.userId || session.id) === 1;

  // =========================================================================
  // 🌟 THE SECURITY FIX: ENFORCE STRICT ROLE VALIDATION
  // Block general managers, receptionists, and staff roles from building assets
  // =========================================================================
  if (safeRole !== "admin" && safeRole !== "owner" && !isMasterSuperAdmin) {
    // Silently redirect staff back to their dashboard node to prevent malicious URL probing
    redirect("/"); 
  }

  // 3. SECURE PASS-THROUGH
  // Extract the true underlying integer ID to feed into your provisioning action loops
  const currentUserId = Number(session.userId || session.id || 0);

  return (
    <div className="min-h-screen bg-black p-8 flex flex-col items-center justify-center font-sans selection:bg-amber-400 selection:text-black">
      {/* Background radial layer matching your dark Ethereal theme */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* CRITICAL PROP ADDITION: Passing currentUserId ensures that when the tenant completes 
        their floor-by-floor configuration form, their unique database ID is explicitly bound 
        to the property record's new ownerId column.
      */}
<PropertyLauncher 
      userId={currentUserId} 
      userEmail={String(session.email || "")} // 🌟 Dynamically inject the active manager's email payload
    />
        </div>
  );
}