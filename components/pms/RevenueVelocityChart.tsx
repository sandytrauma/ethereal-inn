import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';


export interface FinancialRecord {
  id: number;
  date: string;
  totalCollection: string | number;
  pettyexpenses: string | number;
  upiRevenue: string | number;
  cashRevenue: string | number;
  roomRevenue: string | number;
  status: string;
}

interface ChartProps {
  financeRecords: FinancialRecord[];
  monthlyOpex: number;
}

export const RevenueVelocityChart = ({ financeRecords, monthlyOpex }: ChartProps) => {
  // Get current year and month to filter "till date"
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const data = financeRecords
    .filter((r) => r.status === 'reconciled' && r.date.startsWith(currentYearMonth))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r, index, arr) => {
      // Cumulative revenue logic for the burn-down effect
      const cumulativeRevenue = arr
        .slice(0, index + 1)
        .reduce((sum, item) => sum + Number(item.totalCollection), 0);
      
      return {
        date: new Date(r.date).getDate(),
        revenue: cumulativeRevenue,
      };
    });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{fontSize: 10}} />
        <YAxis tick={{fontSize: 10}} />
        <Tooltip />
        <ReferenceLine y={monthlyOpex} stroke="red" strokeDasharray="3 3" />
        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#eff6ff" />
      </AreaChart>
    </ResponsiveContainer>
  );
};