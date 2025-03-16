import React, { useEffect } from "react";
import { Settings } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import PostLists from "../Posts/PostLists";
import { useParams } from "react-router-dom";
import User from "../../../services/userService";

const Profile = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await User.GET_USER_BY_ID(userId);
      console.log(`Check data res`, res);
    };
    fetchUsers();
  }, []);

  return (
    <div className="w-[75%] h-full bg-white rounded-3xl shadow-sm">
      <div className="h-full max-w-3xl mx-auto pt-8 px-4 overflow-y-auto config-scroll">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">home</h2>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Settings size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-8 mb-4">
              <div className="text-center">
                <span className="font-bold text-gray-900">{0}</span>
                <p className="text-sm text-gray-500">Bài viết</p>
              </div>
              <div className="text-center">
                <span className="font-bold text-gray-900">{0}</span>
                <p className="text-sm text-gray-500">Người theo dõi</p>
              </div>
              <div className="text-center">
                <span className="font-bold text-gray-900">{0}</span>
                <p className="text-sm text-gray-500">Đang theo dõi</p>
              </div>
            </div>
          </div>

          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
            <img
              src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3"
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-8">
          <p className="text-sm text-gray-700 font-medium">
            Fullstack Developer 🚀
          </p>
          <p className="text-sm text-gray-500">📍 Hồ Chí Minh, Việt Nam</p>
          <p className="text-sm text-gray-600 mt-2">
            "Đam mê công nghệ, cháy hết mình với từng dòng code."
          </p>
        </div>

        {/* Post Creation */}
        <div className="border-y border-gray-100 py-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
              <img
                src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3"
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <input
              type="text"
              placeholder="Bắt đầu một cuộc trò chuyện..."
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            />
            <button className="text-gray-700 text-sm font-semibold hover:text-gray-900 transition-colors">
              Đăng
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          <PostLists />
        </div>
      </div>
    </div>
  );
};

export default Profile;
