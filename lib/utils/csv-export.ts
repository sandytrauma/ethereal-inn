// lib/utils/csv-export.ts
export function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  // 1. Define Headers
  const headers = Object.keys(data[0]).join(",");

  // 2. Map Rows
  const rows = data.map(row => 
    Object.values(row)
      .map(value => `"${String(value).replace(/"/g, '""')}"`) // Escape quotes and wrap in quotes
      .join(",")
  );

  // 3. Create Blob
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // 4. Trigger Download
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}