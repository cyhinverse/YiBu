import React, { useEffect, useState } from "react";
import {
  Settings,
  Edit,
  Camera,
  Link as LinkIcon,
  MapPin,
  Calendar,
  User as UserIcon,
  Share,
  ExternalLink,
  Heart,
  Sparkles,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import PostLists from "../Posts/PostLists";
import { useParams, Link as RouterLink } from "react-router-dom";
import User from "../../../services/userService";
import { getUserById } from "../../../slices/UserSlice";

const Profile = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [showBioFull, setShowBioFull] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await User.GET_USER_BY_ID(userId);
        console.log(`Check data res`, res);
        dispatch(getUserById(res.data));
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [userId, dispatch]);

  const user = useSelector((s) => s.user.user);
  const followerCount = user?.followers?.length || 0;
  const followingCount = user?.following?.length || 0;
  const userName = user?.name || "User";
  const postCount = 0;
  const currentUser = useSelector((s) => s.auth?.user);
  const isOwnProfile = currentUser?.id === userId;

  // Giả lập bio dài để demo tính năng "Xem thêm"
  const longBio =
    "Đam mê công nghệ, cháy hết mình với từng dòng code. Fullstack Developer với kinh nghiệm trong React, Node.js và các công nghệ hiện đại. Luôn tìm kiếm cơ hội để học hỏi và phát triển bản thân trong lĩnh vực công nghệ. Tin rằng code đẹp cũng quan trọng như UI đẹp.";

  if (isLoading) {
    return (
      <div className="w-[75%] h-full bg-white rounded-none md:rounded-xl shadow-sm flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-gray-400">Đang tải thông tin...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[75%] h-full bg-white rounded-none md:rounded-xl shadow-sm">
      <div className="h-full max-w-3xl mx-auto overflow-y-auto config-scroll">
        {/* Profile Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex justify-between items-start mb-6">
            {/* User info */}
            <div className="flex-1 pr-4">
              <div className="flex items-center mb-1">
                <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
                {user?.verified && (
                  <div className="ml-2 text-blue-500">
                    <Sparkles size={18} />
                  </div>
                )}
              </div>
              <p className="text-gray-500 mb-4 flex items-center">
                @{user?.username || userName.toLowerCase().replace(/\s+/g, "")}
              </p>

              <div className="mb-5">
                <p
                  className={`text-gray-700 text-sm ${
                    !showBioFull && "line-clamp-2"
                  }`}
                >
                  {longBio}
                </p>
                {longBio.length > 100 && (
                  <button
                    className="text-blue-500 text-sm mt-1 hover:underline"
                    onClick={() => setShowBioFull(!showBioFull)}
                  >
                    {showBioFull ? "Ẩn bớt" : "Xem thêm"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2 mb-5">
                <div className="flex items-center">
                  <MapPin size={14} className="mr-1 flex-shrink-0" />
                  <span>Hồ Chí Minh</span>
                </div>
                <div className="flex items-center group">
                  <LinkIcon size={14} className="mr-1 flex-shrink-0" />
                  <a
                    href="#"
                    className="text-blue-500 hover:underline group-hover:text-blue-600 transition-colors flex items-center"
                  >
                    portfolio.dev
                    <ExternalLink
                      size={12}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </a>
                </div>
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1 flex-shrink-0" />
                  <span>Tham gia tháng 1, 2023</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <RouterLink
                  to={`/followers/${userId}`}
                  className="flex items-center hover:underline"
                >
                  <span className="font-semibold text-gray-900">
                    {followerCount}
                  </span>
                  <span className="text-gray-500 ml-1">người theo dõi</span>
                </RouterLink>
                <RouterLink
                  to={`/following/${userId}`}
                  className="flex items-center hover:underline"
                >
                  <span className="font-semibold text-gray-900">
                    {followingCount}
                  </span>
                  <span className="text-gray-500 ml-1">đang theo dõi</span>
                </RouterLink>
              </div>
            </div>

            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-gray-200 relative group shadow-sm">
                <img
                  src={
                    user?.avatar ||
                    "https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3"
                  }
                  alt={`${userName}'s avatar`}
                  className="w-full h-full object-cover"
                />
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={20} className="text-white" />
                  </div>
                )}
              </div>

              {/* Status indicator */}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 mb-6">
            {isOwnProfile ? (
              <button className="flex-1 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center">
                <Edit size={16} className="mr-2" />
                Chỉnh sửa hồ sơ
              </button>
            ) : (
              <>
                <button className="flex-1 py-2 bg-gray-900 rounded-full text-sm font-medium text-white hover:bg-gray-800 transition-colors">
                  Theo dõi
                </button>
                <button className="flex-1 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Nhắn tin
                </button>
                <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  <Share size={18} className="text-gray-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 px-1">
          <div className="flex">
            <button
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === "posts" ? "text-gray-900" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("posts")}
            >
              Bài viết
              {activeTab === "posts" && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gray-900 rounded-full"></span>
              )}
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === "media" ? "text-gray-900" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("media")}
            >
              Media
              {activeTab === "media" && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gray-900 rounded-full"></span>
              )}
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === "likes" ? "text-gray-900" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("likes")}
            >
              Thích
              {activeTab === "likes" && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gray-900 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* Floating action button for new post - only for own profile */}
        {isOwnProfile && (
          <div className="fixed bottom-6 right-6 z-10">
            <button className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors group">
              <Edit
                size={24}
                className="text-white group-hover:scale-110 transition-transform"
              />
            </button>
          </div>
        )}

        {/* Content based on active tab */}
        <div className="pb-20">
          {activeTab === "posts" && (
            <div className="px-4 pt-2">
              <PostLists />
            </div>
          )}

          {activeTab === "media" && (
            <div className="p-4">
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                  <div
                    key={item}
                    className="aspect-square rounded-md overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity cursor-pointer group relative"
                  >
                    <img
                      src={`https://source.unsplash.com/random/300x300?sig=${item}`}
                      alt="Gallery"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Heart size={20} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "likes" && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Heart size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có bài viết đã thích
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                Khi {isOwnProfile ? "bạn" : userName} thích bài viết, chúng sẽ
                xuất hiện ở đây.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
