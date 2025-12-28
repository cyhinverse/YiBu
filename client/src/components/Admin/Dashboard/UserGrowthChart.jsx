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
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e5e5"
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: '#737373',
                fontWeight: 600,
              }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: '#737373',
                fontWeight: 600,
              }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e5e5',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
              }}
              itemStyle={{
                color: '#10b981',
                fontWeight: 700,
              }}
              cursor={{
                stroke: '#10b981',
                strokeWidth: 2,
                strokeDasharray: '5 5',
              }}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorUsers)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-neutral-400">
          <Activity size={40} className="mb-4 opacity-20" />
          <p className="font-bold text-sm">
            Không có dữ liệu cho giai đoạn này
          </p>
        </div>
      )}
    </div>
  );
};

export default UserGrowthChart;
