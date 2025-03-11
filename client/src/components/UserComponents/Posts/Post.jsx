import {
  Ellipsis,
  ExternalLink,
  Heart,
  MessageCircle,
  Save,
} from "lucide-react";
import React, { useState } from "react";
import PostOption from "./PostOption";
import { useSelector } from "react-redux";

const Post = ({ type, mediaSrc, data }) => {
  const [liked, setLiked] = useState(false);
  const [postOption, setPostOption] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);

  const toggleLike = () => {
    setLiked(!liked);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };
  const user = useSelector((s) => s.auth.user.user);

  return (
    <div className="w-full h-auto bg-white border-b border-gray-300 flex flex-col justify-start gap-2">
      <div className="flex justify-between px-4 pt-2">
        <div className="flex space-x-2 relative">
          <img
            className="h-[40px] w-[40px] object-cover rounded-full cursor-pointer"
            src="https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Profile"
          />
          <span>{user.name}</span>
        </div>
        <div onClick={() => setPostOption(!postOption)} className="relative">
          <Ellipsis className="cursor-pointer" />
          {postOption && <PostOption />}
        </div>
      </div>
      <p className="px-4">{data.title}</p>
      <div className="w-[350px] h-auto mx-4 rounded-xl overflow-hidden">
        {type === "video" ? (
          <video controls className="w-full h-full object-cover bg-center">
            <source src={mediaSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            className={`w-full h-full object-cover bg-center ${
              !mediaSrc ? "hidden" : ""
            }`}
            src={mediaSrc}
          />
        )}
      </div>
      <div className="flex justify-between items-center w-[350px] mb-2 px-4">
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-1">
            <Heart
              onClick={toggleLike}
              className="cursor-pointer"
              color={liked ? "red" : "black"}
              fill={liked ? "red" : "none"}
              size={24}
            />
            {likes > 0 && <span>{likes}</span>}
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="cursor-pointer" />
            {comments > 0 && <span>{comments}</span>}
          </div>
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
