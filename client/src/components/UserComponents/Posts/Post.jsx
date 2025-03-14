import {
  Ellipsis,
  ExternalLink,
  Heart,
  MessageCircle,
  Save,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import PostOption from "./PostOption";
import { useSelector } from "react-redux";
import Like from "../../../services/likeService";

const Post = ({ type, mediaSrc, data }) => {
  const [liked, setLiked] = useState(false);
  const [postOption, setPostOption] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);

  const toggleLike = async () => {
    try {
      if (liked) {
        await Like.DELETE_LIKE({ postId: data._id });
        setLikes((prev) => prev - 1);
      } else {
        await Like.CREATE_LIKE({ postId: data._id });
        setLikes((prev) => prev + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error("Like action failed:", error);
    }
  };

  // useEffect(() => {
  //   const fetchLikes = async () => {
  //     try {
  //       const response = await Like.GET_LIKES({ postId: data._id });
  //       setLikes(response.likesCount);
  //       setLiked(response.likedByUser);
  //     } catch (error) {
  //       console.error("Error fetching likes:", error);
  //     }
  //   };
  //   fetchLikes();
  // }, [data._id]);

  return (
    <div className="w-full h-auto bg-white border-b border-gray-300 flex flex-col justify-start gap-2">
      <div className="flex justify-between px-4 pt-2">
        <div className="flex space-x-2 relative">
          <img
            className="h-[35px] w-[35px] object-cover rounded-full cursor-pointer"
            src="https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Profile"
          />
          <span className="font-semibold hover:underline ">
            {data.userId.name}
          </span>
        </div>
        <div onClick={() => setPostOption(!postOption)} className="relative">
          <Ellipsis className="cursor-pointer" size={20} />
          <PostOption show={postOption} />
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
            src={data.image}
          />
        )}
      </div>
      <div className="flex justify-between items-center w-[350px] mb-2 px-4">
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-1">
            <Heart
              onClick={toggleLike}
              className="cursor-pointer transition-all  duration-200 hover:scale-110 active:scale-90 "
              color={liked ? "red" : "black"}
              fill={liked ? "red" : "none"}
              size={20}
              strokeWidth={1}
            />
            {likes > 0 && (
              <span className="text-sm font-medium text-gray-700">{likes}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle
              className="cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90"
              strokeWidth={1}
              size={20}
            />
            {comments > 0 && (
              <span className="text-sm font-medium text-gray-700">
                {comments}
              </span>
            )}
          </div>
          <ExternalLink
            className="cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90"
            strokeWidth={1}
            size={20}
          />
        </div>
        <div>
          <Save
            className="cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90"
            strokeWidth={1}
            size={20}
          />
        </div>
      </div>
    </div>
  );
};

export default Post;
