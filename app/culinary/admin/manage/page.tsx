// app/culinary/admin/manage/page.tsx
import { db } from "@/db";
import { culinaryOutlets } from "@/db/schema/culinary";

export default async function ManageOutletsPage() {
  const outlets = await db.select().from(culinaryOutlets);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Culinary Outlet Registry</h1>
      <table className="w-full border shadow-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Store Name</th>
            <th className="p-3">Slug</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {outlets.map((outlet) => (
            <tr key={outlet.id} className="border-t">
              <td className="p-3">{outlet.name}</td>
              <td className="p-3 font-mono">{outlet.slug}</td>
              <td className="p-3">{outlet.isActive ? "Active" : "Disabled"}</td>
              <td className="p-3">
                <a href={`/culinary/admin/edit/${outlet.id}`} className="text-blue-600 underline">Edit</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}