import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import LandingLoginPage from "@/components/Login";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // Verify session on the server
  const session = token ? await decrypt(token).catch(() => null) : null;

  // Show internal system if logged in, otherwise public site
  if (session) {
    return <Dashboard user={session} />;
  }

  return <LandingLoginPage />;
}