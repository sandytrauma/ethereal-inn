"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

interface ChartProps {
  currentLogs: any[];
  previousLogs?: any[]; // Optional for comparison
}

export default function RevenueChart({ currentLogs, previousLogs = [] }: ChartProps) {
  
  const chartData = {
    // We use day numbers (1-31) for the X-axis to align the two months
    labels: Array.from({ length: 31 }, (_, i) => i + 1), 
    datasets: [
      {
        label: 'This Month',
        data: currentLogs.map(l => Number(l.totalCollection)),
        borderColor: '#fbbf24', // Amber-400
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
      {
        label: 'Last Month',
        data: previousLogs.map(l => Number(l.totalCollection)),
        borderColor: '#475569', // Slate-600
        borderDash: [5, 5], // Dashed line
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0, // Hide points for the background dataset
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#64748b',
          boxWidth: 10,
          font: { size: 10, weight: 'bold' as const }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#0f172a',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 12,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } },
        title: { display: true, text: 'Day of Month', color: '#334155', font: { size: 9 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="h-72 w-full mt-4">
      <Line data={chartData} options={options} />
    </div>
  );
}