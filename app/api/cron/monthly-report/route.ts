import { db } from '@/db';
import { financialRecords } from '@/db/schema';
import { properties } from '@/db/micro-schema';
import { and, gte, lte, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * GET /api/cron/monthly-report
 * Triggered by a cron job to generate financial summaries for all properties.
 */
export async function GET(req: Request) {
  // 1. Security Check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Calculate Last Month Range
    const now = new Date();
    // First day of current month
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Last day of previous month
    const lastDayLastMonthDate = new Date(firstDayCurrentMonth.getTime() - 86400000);
    // First day of previous month
    const firstDayLastMonthDate = new Date(lastDayLastMonthDate.getFullYear(), lastDayLastMonthDate.getMonth(), 1);

    const startOfLastMonth = firstDayLastMonthDate.toISOString().split('T')[0];
    const endOfLastMonth = lastDayLastMonthDate.toISOString().split('T')[0];

    // 3. Fetch All Properties to generate individual reports
    const allProperties = await db.select().from(properties);

    if (allProperties.length === 0) {
      return NextResponse.json({ success: true, message: "No properties found to report." });
    }

    // 4. Process Reports for each property
    const propertyReports = await Promise.all(allProperties.map(async (prop) => {
      // Fetch records scoped to THIS property and THIS date range
      const records = await db.select()
        .from(financialRecords)
        .where(
          and(
            eq(financialRecords.propertyId, prop.id),
            gte(financialRecords.date, startOfLastMonth),
            lte(financialRecords.date, endOfLastMonth)
          )
        );

      // Aggregate data for this specific property
      const summary = records.reduce((acc, curr) => ({
        revenue: acc.revenue + Number(curr.totalCollection || 0),
        expenses: acc.expenses + Number(curr.pettyExpenses || 0),
      }), { revenue: 0, expenses: 0 });

      const netProfit = summary.revenue - summary.expenses;

      // Log property-specific results
      console.log(`[CRON] Report for ${prop.name} (${startOfLastMonth} to ${endOfLastMonth})`);
      console.log(`- Revenue: ₹${summary.revenue}`);
      console.log(`- Expenses: ₹${summary.expenses}`);
      console.log(`- Net Profit: ₹${netProfit}`);

      return {
        propertyId: prop.id,
        propertyName: prop.name,
        revenue: summary.revenue,
        expenses: summary.expenses,
        netProfit
      };
    }));

    // 5. Calculate Grand Totals across all properties (Corporate Overview)
    const grandTotal = propertyReports.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      expenses: acc.expenses + curr.expenses,
      netProfit: acc.netProfit + curr.netProfit,
    }), { revenue: 0, expenses: 0, netProfit: 0 });

    return NextResponse.json({ 
      success: true, 
      range: { start: startOfLastMonth, end: endOfLastMonth },
      reports: propertyReports,
      corporateOverview: grandTotal
    });

  } catch (error) {
    console.error("[CRON ERROR]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}