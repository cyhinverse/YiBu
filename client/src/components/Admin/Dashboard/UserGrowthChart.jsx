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
    <div className="h-80 w-full min-h-[280px] min-w-0">
      {data.length > 0 ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={240}
          minWidth={0}
        >
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
              stroke="#cbd5f5"
              opacity={0.35}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: '#9aa3b2',
                fontWeight: 500,
              }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: '#9aa3b2',
                fontWeight: 500,
              }}
              dx={-8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: 'none',
                boxShadow: 'none',
                padding: '10px 14px',
              }}
              itemStyle={{
                color: '#10b981',
                fontWeight: 600,
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
              strokeWidth={2.5}
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
