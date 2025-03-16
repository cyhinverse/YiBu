import {
  Ellipsis,
  ExternalLink,
  Heart,
  MessageCircle,
  Save,
  X,
} from "lucide-react";
import { useContext, useState } from "react";
import PostOption from "./PostOption";
import Like from "../../../services/likeService";
import "./index.css";
import { DataContext } from "../../../DataProvider";
import CommentModel from "../Comment/CommentModel";

const Post = ({ data }) => {
  const [liked, setLiked] = useState(false);
  const [postOption, setPostOption] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [showImage, setShowImage] = useState(null);
  const { openComment, setOpenComment } = useContext(DataContext);

  // console.log("Check data:::", data);
  console.log(`Check data from post:::`, openComment);

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

  return (
    <div className="w-full h-auto bg-white border-b border-t border-gray-300 flex flex-col justify-start gap-2">
      {/* Header */}
      <div className="flex justify-between px-4 pt-2">
        <div className="flex space-x-2 relative">
          <img
            className="h-[35px] w-[35px] object-cover rounded-full cursor-pointer"
            src="https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Profile"
          />
          <span className="font-semibold hover:underline">
            {data.user.name}
          </span>
        </div>
        <div onClick={() => setPostOption(!postOption)} className="relative">
          <Ellipsis className="cursor-pointer" size={20} />
          <PostOption show={postOption} />
        </div>
      </div>

      <p className="px-4">{data.caption}</p>

      <div className="w-auto min-h-[200px] mx-4 overflow-x-scroll flex gap-2 flex-nowrap hide-scroll">
        {data.media?.length > 0 ? (
          data.media.map((item, index) => (
            <div key={index} className="flex-shrink-0">
              {item.type === "video" ? (
                <video
                  controls
                  className="w-auto h-auto max-h-[300px] object-cover bg-center"
                >
                  <source src={item.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  className="w-auto h-auto max-h-[300px] object-cover cursor-pointer rounded-md"
                  src={item.url}
                  alt={`Post Media ${index + 1}`}
                  onClick={() => setShowImage(item.url)}
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">
            Không có hình ảnh hoặc video
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center w-[350px] mb-2 px-4">
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-1">
            <Heart
              onClick={toggleLike}
              className="cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90"
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
              onClick={() => setOpenComment(!openComment)}
            />
            {openComment && <CommentModel />}
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

      {showImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="relative">
            <button
              className="absolute top-2 right-2 bg-gray-900 text-white rounded-full p-2 hover:bg-gray-700 transition-all"
              onClick={() => setShowImage(null)}
            >
              <X size={24} />
            </button>
            <img
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
              src={showImage}
              alt="Full Image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
