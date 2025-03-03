import React from "react";
import { Post } from "../Posts";
import "./index.css";
import CreatePost from "../CreatePost/CreatePost";

const Contents = () => {
  return (
    <div className="w-[95vw] h-[86vh] bg-white mt-5 shadow-2xl   rounded-xl m-auto flex ">
      <div className="w-[70%] h-full rounded-xl ">
        <div className="w-[60%] h-full overflow-y-scroll content-post m-auto rounded-t-xl border border-gray-300">
          <CreatePost />
          <Post />
          <Post />
          <Post />
        </div>
      </div>
      <div className="flex-1 h-full bg-red-400 rounded-xl"></div>
    </div>
  );
};

export default Contents;
