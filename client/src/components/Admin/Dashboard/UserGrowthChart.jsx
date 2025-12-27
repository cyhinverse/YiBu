import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';

const UserGrowthChart = ({ data }) => {
  return (
    <div className="h-80 w-full">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: 'var(--color-text-secondary)',
                fontWeight: 600,
              }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: 'var(--color-text-secondary)',
                fontWeight: 600,
              }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xl)',
                padding: '12px 16px',
              }}
              itemStyle={{
                color: 'var(--color-text-primary)',
                fontWeight: 700,
              }}
              cursor={{
                stroke: 'var(--color-primary)',
                strokeWidth: 2,
                strokeDasharray: '5 5',
              }}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="var(--color-primary)"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorUsers)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-secondary/40">
          <Activity size={48} className="mb-4 opacity-20" />
          <p className="font-bold">Không có dữ liệu cho giai đoạn này</p>
        </div>
      )}
    </div>
  );
};

export default UserGrowthChart;
