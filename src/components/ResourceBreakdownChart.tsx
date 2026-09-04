import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ResourceBreakdown } from '@/types';
import { formatBytes } from '@/utils/formatting';

interface ResourceBreakdownChartProps {
  breakdown: ResourceBreakdown;
}

const COLORS = {
  JavaScript: '#f59e0b',
  CSS: '#8b5cf6',
  Images: '#3b82f6',
  Fonts: '#22c55e',
  HTML: '#06b6d4',
  'XHR/Fetch': '#ec4899',
  Other: '#6b7280',
};

interface TooltipPayload {
  name: string;
  value: number;
  payload: { percent: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <div className="font-medium text-gray-200 mb-0.5">{item.name}</div>
      <div className="text-gray-400">{formatBytes(item.value)}</div>
      <div className="text-gray-500">{(item.payload.percent * 100).toFixed(1)}%</div>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-gray-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ResourceBreakdownChart({ breakdown }: ResourceBreakdownChartProps) {
  const data = useMemo(() => {
    const items = [
      { name: 'JavaScript', size: breakdown.javascript.transferSize, color: COLORS.JavaScript },
      { name: 'CSS', size: breakdown.css.transferSize, color: COLORS.CSS },
      { name: 'Images', size: breakdown.images.transferSize, color: COLORS.Images },
      { name: 'Fonts', size: breakdown.fonts.transferSize, color: COLORS.Fonts },
      { name: 'HTML', size: breakdown.html.transferSize, color: COLORS.HTML },
      { name: 'XHR/Fetch', size: breakdown.xhrFetch.transferSize, color: COLORS['XHR/Fetch'] },
      { name: 'Other', size: breakdown.other.transferSize, color: COLORS.Other },
    ];
    const total = items.reduce((sum, i) => sum + i.size, 0);
    return items
      .filter((i) => i.size > 0)
      .map((i) => ({ ...i, percent: total > 0 ? i.size / total : 0 }));
  }, [breakdown]);

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Resource Breakdown
      </h3>

      <div className="relative h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={2}
              dataKey="size"
              nameKey="name"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-6">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-200">{formatBytes(breakdown.totalTransferSize)}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-400">{entry.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 tabular-nums">{formatBytes(entry.size)}</span>
              <span className="text-gray-600 tabular-nums w-10 text-right">
                {(entry.percent * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
