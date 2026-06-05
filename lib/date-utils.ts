export function getTodayDateRange() {
  const now = new Date();
  const localDateStr = now.toISOString().split("T")[0];

  const startOfDay = new Date(`${localDateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${localDateStr}T23:59:59.999Z`);

  return { localDateStr, startOfDay, endOfDay };
}
