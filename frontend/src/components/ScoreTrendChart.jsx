import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ScoreTrendChart({ trendData = [], averageScore = 0 }) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 text-center text-xs text-[#9CA3AF]">
        No trend data yet. Analyze multiple job descriptions to track score progression over time!
      </div>
    );
  }

  // Custom tooltip for dark theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#151D30] border border-[#374151] p-2.5 rounded-xl shadow-xl text-xs">
          <p className="font-semibold text-[#F9FAFB]">{data.company || 'Job Match'}</p>
          <p className="text-[11px] text-[#9CA3AF] mb-1">{data.title}</p>
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-[#10B981] font-bold">Match Score: {payload[0].value}%</span>
            <span className="text-[10px] text-[#6B7280]">({data.date})</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
            <h3 className="font-heading font-semibold text-lg text-[#F9FAFB]">
              Match Score Trend Over Time
            </h3>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            Progression of your resume semantic match across past target jobs.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">
            Avg Score
          </span>
          <span className="font-mono text-lg font-bold text-[#10B981]">
            {averageScore}%
          </span>
        </div>
      </div>

      {/* Recharts Area / Line Chart with Emerald Gradient */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#scoreGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
