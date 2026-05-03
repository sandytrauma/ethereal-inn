// app/(admin)/management/page.tsx
import PropertyLauncher from "@/components/admin/PropertyLauncher";

export default function ManagementPage() {
  return (
    <div className="min-h-screen bg-black p-8 flex flex-col items-center justify-center">
      <PropertyLauncher />
    </div>
  );
}