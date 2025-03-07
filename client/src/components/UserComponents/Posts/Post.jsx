import {
  Ellipsis,
  ExternalLink,
  Heart,
  MessageCircle,
  Save,
} from "lucide-react";
import React, { useState } from "react";
import PostOption from "./PostOption";

const Post = () => {
  const [liked, setLiked] = useState(false);
  const [postOption, setPostOption] = useState(false);

  return (
    <div className="w-full h-[80%] bg-white border-b  border-gray-300 flex flex-col justify-start gap-2">
      <div className="flex justify-between px-4 pt-2">
        <div className="flex space-x-2 relative">
          <img
            className="h-[40px] w-[40px] object-cover rounded-full cursor-pointer"
            src="https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
          />

          <span>John</span>
        </div>
        <div onClick={() => setPostOption(!postOption)} className="relative">
          <Ellipsis className="cursor-pointer" />
          {postOption && <PostOption />}
        </div>
      </div>
      <p className="px-4">
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
      </p>
      <div className="w-[350px] h-auto mx-4  rounded-xl overflow-hidden">
        <img
          className="w-full h-full object-cover bg-center"
          src="https://images.unsplash.com/photo-1727466943994-911d391dddb1?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
        />
      </div>

      <div className="flex justify-between items-center w-[350px] mb-2 ">
        <div className="flex px-4 space-x-6">
          <Heart
            onClick={() => setLiked(!liked)}
            className="cursor-pointer"
            color={liked ? "red" : "black"}
            fill={liked ? "red" : "none"}
            size={24}
          />

          <MessageCircle />
          <ExternalLink />
        </div>

        <div>
          <Save />
        </div>
      </div>
    </div>
  );
};

export default Post;
