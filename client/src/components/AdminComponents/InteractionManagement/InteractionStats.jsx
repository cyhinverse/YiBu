import React from "react";
import { Heart, MessageSquare, Share, Eye } from "lucide-react";

const StatCard = ({ icon, label, value, change, bgColor }) => {
  const isPositive = !change.includes("-");

  return (
    <div className={`${bgColor} p-4 rounded-lg shadow flex items-center`}>
      <div className="mr-4 p-3 rounded-full bg-white">{icon}</div>
      <div>
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <h3 className="text-gray-900 text-xl font-bold">{value}</h3>
        <p
          className={`text-sm font-medium ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {change}
        </p>
      </div>
    </div>
  );
};

const InteractionStats = ({ stats = {} }) => {
  const { likes, comments, shares, views } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Heart className="text-red-500" />}
        label="Lượt thích"
        value={likes?.total || "0"}
        change={likes?.change || "+0%"}
        bgColor="bg-red-50"
      />
      <StatCard
        icon={<MessageSquare className="text-blue-500" />}
        label="Bình luận"
        value={comments?.total || "0"}
        change={comments?.change || "+0%"}
        bgColor="bg-blue-50"
      />
      <StatCard
        icon={<Share className="text-green-500" />}
        label="Chia sẻ"
        value={shares?.total || "0"}
        change={shares?.change || "+0%"}
        bgColor="bg-green-50"
      />
      <StatCard
        icon={<Eye className="text-purple-500" />}
        label="Lượt xem"
        value={views?.total || "0"}
        change={views?.change || "+0%"}
        bgColor="bg-purple-50"
      />
    </div>
  );
};

export default InteractionStats;
