import { db } from '@/db';
import { financialRecords } from '@/db/schema';
import { and, gte, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // 1. Security Check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Calculate Last Month Range
    const now = new Date();
    // Go to the first day of the current month, then back one day to get last month
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayLastMonthDate = new Date(firstDayCurrentMonth.getTime() - 86400000);
    const firstDayLastMonthDate = new Date(lastDayLastMonthDate.getFullYear(), lastDayLastMonthDate.getMonth(), 1);

    // 3. Format to YYYY-MM-DD strings for Drizzle/Postgres compatibility
    const startOfLastMonth = firstDayLastMonthDate.toISOString().split('T')[0];
    const endOfLastMonth = lastDayLastMonthDate.toISOString().split('T')[0];

    // 4. Fetch records using string boundaries
    const records = await db.select().from(financialRecords)
      .where(and(
        gte(financialRecords.date, startOfLastMonth),
        lte(financialRecords.date, endOfLastMonth)
      ));

    // 5. Generate Summary
    const summary = records.reduce((acc, curr) => ({
      revenue: acc.revenue + Number(curr.totalCollection || 0),
      expenses: acc.expenses + Number(curr.pettyExpenses || 0),
    }), { revenue: 0, expenses: 0 });

    const netProfit = summary.revenue - summary.expenses;

    // 6. Log results (You can later extend this to save to a 'reports' table)
    console.log(`[CRON] Monthly Report (${startOfLastMonth} to ${endOfLastMonth})`);
    console.log(`Total Revenue: ₹${summary.revenue}`);
    console.log(`Total Expenses: ₹${summary.expenses}`);
    console.log(`Net Profit: ₹${netProfit}`);

    return NextResponse.json({ 
      success: true, 
      range: { start: startOfLastMonth, end: endOfLastMonth },
      summary: { ...summary, netProfit } 
    });

  } catch (error) {
    console.error("[CRON ERROR]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}