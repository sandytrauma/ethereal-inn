"use client";

import { useTransition } from "react";
import { onboardCulinaryTenantAction } from "@/lib/actions/culinary-onboard";

export function OnboardForm() {
  const [isPending, startTransition] = useTransition();

  const handleAction = async (formData: FormData) => {
    startTransition(async () => {
      const payload = {
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        locationContext: formData.get("locationContext") as string,
        whatsappNumber: formData.get("whatsappNumber") as string,
        zomatoStoreId: formData.get("zomatoStoreId") as string,
        swiggyStoreId: formData.get("swiggyStoreId") as string,
        toingStoreId: formData.get("toingStoreId") as string,
      };

      const res = await onboardCulinaryTenantAction(payload, formData.get("masterSecret") as string);
      
      if (res.success) alert(`Success: ${res.data?.accessPath}`);
      else alert(`Error: ${res.error}`);
    });
  };

  return (
    <form action={handleAction} className="w-full max-w-2xl p-8 bg-[#111111] border border-[#222222] shadow-2xl rounded-sm">
      <table className="w-full border-collapse text-sm text-gray-300">
        <tbody className="divide-y divide-[#222222]">
          {[
            { label: "Store Name", name: "name", placeholder: "e.g. SK Butter Momos" },
            { label: "URL Slug", name: "slug", placeholder: "e.g. sk-butter-momos" },
            { label: "Location", name: "locationContext", placeholder: "Sector/Area" },
            { label: "WhatsApp", name: "whatsappNumber", placeholder: "+91..." },
          ].map((field) => (
            <tr key={field.name}>
              <td className="py-4 font-mono text-[10px] uppercase text-pink-500">{field.label}</td>
              <td className="py-4">
                <input 
                  name={field.name} required 
                  className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-2 rounded-none focus:ring-1 focus:ring-pink-500 outline-none transition-all placeholder:text-[#444]" 
                  placeholder={field.placeholder} 
                />
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-4 font-mono text-[10px] uppercase text-pink-500">Platform IDs</td>
            <td className="py-4 grid grid-cols-3 gap-3">
              {['zomatoStoreId', 'swiggyStoreId', 'toingStoreId'].map(id => (
                <input key={id} name={id} placeholder={id.replace('StoreId', '').toUpperCase()} className="bg-[#1A1A1A] border border-[#333333] px-3 py-2 rounded-none outline-none placeholder:text-[#444]" />
              ))}
            </td>
          </tr>
          <tr>
            <td className="py-4 font-mono text-[10px] uppercase text-pink-500">Master Secret</td>
            <td className="py-4">
              <input type="password" name="masterSecret" required className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-2 rounded-none focus:ring-1 focus:ring-pink-500 outline-none font-mono" />
            </td>
          </tr>
        </tbody>
      </table>

      <button 
        disabled={isPending}
        className="w-full mt-8 bg-white text-black text-[10px] font-bold tracking-widest uppercase py-4 hover:bg-pink-500 hover:text-white transition-all disabled:opacity-50"
      >
        {isPending ? "Syncing Node..." : "Initiate Provisioning"}
      </button>
    </form>
  );
}