import { db } from '@/db';
import { financialRecords } from '@/db/schema';
import { and, gte, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // Check auth header to ensure only your cron provider can call this
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

  // 1. Fetch all records for last month
  const records = await db.select().from(financialRecords)
    .where(and(
      gte(financialRecords.date, startOfLastMonth),
      lte(financialRecords.date, endOfLastMonth)
    ));

  // 2. Generate Summary (Total Rev, Expenses, Net)
  const summary = records.reduce((acc, curr) => ({
    revenue: acc.revenue + Number(curr.totalCollection),
    expenses: acc.expenses + Number(curr.pettyExpenses),
  }), { revenue: 0, expenses: 0 });

  // 3. TODO: Save to a 'reports' table or send email
  console.log(`Monthly Report Generated: ₹${summary.revenue - summary.expenses} profit`);

  return NextResponse.json({ success: true });
}