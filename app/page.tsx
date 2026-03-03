import { getSession } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import LoginPage from "@/components/Login";

export default async function Page() {
  const session = await getSession();

  // If this is your app/page.tsx, visit http://localhost:3000/ (root)
  if (!session) return <LoginPage />;
  return <Dashboard user={session} />;
}