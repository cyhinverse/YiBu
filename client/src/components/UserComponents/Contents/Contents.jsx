import React from "react";
import { CreatePost, Post } from "../Posts";
import "./index.css";
import { TrendingTopics } from "../TrendingTopics";
import TopUser from "../TopUser/TopUser";

const Contents = () => {
  const trendingTopics = [
    { name: "#ChillCuốiTuần", posts: "12.4K" },
    { name: "#MondayMood", posts: "8.1K" },
    { name: "#FoodieLife", posts: "5.9K" },
    { name: "#CodeNewbie", posts: "3.4K" },
    { name: "#Travel2025", posts: "10.7K" },
  ];
  const topUsers = [
    { name: "Ngô Văn An", score: "18k🏆" },
    { name: "Nguyễn Văn B", score: "15k🔥" },
    { name: "Trần Thị C", score: "12k💎" },
    { name: "Lê Văn D", score: "10k✨" },
    { name: "Phạm Thị E", score: "9k🥇" },
    { name: "Hoàng Văn F", score: "7k🎉" },
  ];
  return (
    <div className="w-[95vw] h-[86vh] bg-purple-50 mt-5 shadow-2xl rounded-xl m-auto flex gap-2">
      <div className="w-[100%] h-full rounded-xl flex justify-between ">
        {/* Top users */}
        <TopUser topUsers={topUsers} />
        {/* List post all users */}
        <div className="w-[45%] h-full overflow-y-scroll content-post  rounded-t-xl border border-gray-300 ">
          <CreatePost />
          <Post />
          <Post />
          <Post />
        </div>
        <TrendingTopics trendingTopics={trendingTopics} />
      </div>

      {/* Trendings Topic */}
    </div>
  );
};

export default Contents;
