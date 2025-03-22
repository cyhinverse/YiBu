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
  Image,
  BarChart2,
  MessageCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import PostLists from "../Posts/PostLists";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import User from "../../../services/userService";
import { getUserById } from "../../../slices/UserSlice";
import { formatDistance } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import { ROUTES } from "../../../constants/routes";

const Profile = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [showBioFull, setShowBioFull] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const currentUser = useSelector((s) => s.auth?.user);
  console.log("currentUser", currentUser);
  const userFromRedux = useSelector((s) => s.user.user);
  console.log("userFromRedux", userFromRedux);
  const user = userData || userFromRedux;

  // Cập nhật logic kiểm tra isOwnProfile để hỗ trợ cả id và _id
  const currentUserId = currentUser?.user?._id || currentUser?.user?.id;
  const profileUserId = userId;
  const isOwnProfile = currentUserId === profileUserId;

  console.log("Profile - currentUser:", currentUser);
  console.log("Profile - currentUserId:", currentUserId);
  console.log("Profile - profileUserId (userId):", profileUserId);
  console.log("Profile - userData:", userData);
  console.log("Profile - isOwnProfile:", isOwnProfile);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await User.GET_USER_BY_ID(userId);
        console.log(`Check data res`, res);
        dispatch(getUserById(res.data));
        setUserData(res.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [userId, dispatch]);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isOwnProfile && userId && currentUser) {
        try {
          const res = await User.checkFollowStatus(userId);
          setIsFollowing(res.isFollowing);
        } catch (error) {
          console.error("Error checking follow status:", error);
        }
      }
    };
    checkFollowStatus();
  }, [userId, isOwnProfile, currentUser]);

  const stats = user?.stats || {
    postsCount: 0,
    likesCount: 0,
    followersCount: 0,
    followingCount: 0,
  };

  const posts = user?.posts || [];
  const userName = user?.username || user?.name || "User";
  const displayName = userName;
  const bio = user?.profile?.bio || "Chưa có thông tin giới thiệu.";
  const joinDate = user?.createdAt ? new Date(user.createdAt) : new Date();
  const formattedJoinDate = formatDistance(joinDate, new Date(), {
    addSuffix: true,
    locale: vi,
  });

  const handleFollowToggle = async () => {
    if (!currentUser?.user?._id) {
      toast.error("Vui lòng đăng nhập để thực hiện chức năng này");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await User.unfollowUser(userId);
        setIsFollowing(false);
        toast.success("Đã hủy theo dõi");
      } else {
        await User.followUser(userId);
        setIsFollowing(true);
        toast.success("Đã theo dõi thành công");
      }

      // Cập nhật lại dữ liệu profile của người dùng hiện tại
      const currentUserRes = await User.GET_USER_BY_ID(currentUser.user._id);
      if (currentUserRes?.data) {
        dispatch(getUserById(currentUserRes.data));
      }

      // Cập nhật lại dữ liệu profile của người dùng đang xem
      const targetUserRes = await User.GET_USER_BY_ID(userId);
      if (targetUserRes?.data) {
        setUserData(targetUserRes.data);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error(error.message || "Có lỗi xảy ra khi thực hiện thao tác");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessageUser = () => {
    console.log("=== Start handleMessageUser ===");
    console.log("Current user data:", currentUser);
    console.log("Target user data:", user);

    if (!currentUser?.user?._id) {
      console.log("Error: No current user found");
      toast.error("Vui lòng đăng nhập để nhắn tin");
      navigate("/auth/login");
      return;
    }

    const targetUserId = user?._id;
    console.log("Target user ID:", targetUserId);

    if (!targetUserId) {
      console.log("Error: No target user ID found");
      toast.error("Không tìm thấy thông tin người dùng");
      return;
    }

    if (targetUserId === currentUser.user._id) {
      console.log("Error: Cannot message self");
      toast.error("Bạn không thể nhắn tin với chính mình");
      return;
    }

    // Đảm bảo ID là string để tránh lỗi so sánh
    const selectedUserData = {
      _id: targetUserId.toString(),
      email: user.email || `user_${targetUserId}@example.com`,
      name: user.name || user.username || "Người dùng",
      avatar: user.avatar || user.profile?.avatar,
      online: user.online || false,
    };

    console.log("Selected user data being passed:", selectedUserData);

    // Đường dẫn chính xác theo định dạng trong App.jsx
    // Kiểm tra xem URL nên là /messages hay /message
    const messagePath = `/messages/${targetUserId}`;
    console.log("Navigation path:", messagePath);

    // Điều hướng đến trang tin nhắn với người dùng được chọn
    navigate(messagePath, {
      state: {
        selectedUser: selectedUserData,
      },
    });

    console.log("=== End handleMessageUser ===");
  };

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
                <h2 className="text-2xl font-bold text-gray-900">
                  {displayName}
                </h2>
                {user?.verified && (
                  <div className="ml-2 text-blue-500">
                    <Sparkles size={18} />
                  </div>
                )}
              </div>
              <p className="text-gray-500 mb-4 flex items-center">
                @{userName.toLowerCase().replace(/\s+/g, "")}
              </p>

              <div className="mb-5">
                <p
                  className={`text-gray-700 text-sm ${
                    !showBioFull && "line-clamp-2"
                  }`}
                >
                  {bio}
                </p>
                {bio.length > 100 && (
                  <button
                    className="text-blue-500 text-sm mt-1 hover:underline"
                    onClick={() => setShowBioFull(!showBioFull)}
                  >
                    {showBioFull ? "Ẩn bớt" : "Xem thêm"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2 mb-5">
                {user?.profile?.location && (
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1 flex-shrink-0" />
                    <span>{user.profile.location}</span>
                  </div>
                )}
                {user?.profile?.website && (
                  <div className="flex items-center group">
                    <LinkIcon size={14} className="mr-1 flex-shrink-0" />
                    <a
                      href={user.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline group-hover:text-blue-600 transition-colors flex items-center"
                    >
                      {user.profile.website.replace(/(^\w+:|^)\/\//, "")}
                      <ExternalLink
                        size={12}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </a>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1 flex-shrink-0" />
                  <span>Tham gia {formattedJoinDate}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                  <p className="text-xl font-bold text-gray-800">
                    {stats.postsCount}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Image size={12} className="mr-1" />
                    Bài viết
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                  <p className="text-xl font-bold text-gray-800">
                    {stats.likesCount}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Heart size={12} className="mr-1" />
                    Lượt thích
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                  <p className="text-xl font-bold text-gray-800">
                    {stats.followersCount}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <UserIcon size={12} className="mr-1" />
                    Người theo dõi
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                  <p className="text-xl font-bold text-gray-800">
                    {stats.followingCount}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <UserIcon size={12} className="mr-1" />
                    Đang theo dõi
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm mt-4">
                <RouterLink
                  to={`/followers/${userId}`}
                  className="flex items-center hover:underline"
                >
                  <span className="font-semibold text-gray-900">
                    {stats.followersCount}
                  </span>
                  <span className="text-gray-500 ml-1">người theo dõi</span>
                </RouterLink>
                <RouterLink
                  to={`/following/${userId}`}
                  className="flex items-center hover:underline"
                >
                  <span className="font-semibold text-gray-900">
                    {stats.followingCount}
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
                    user?.profile?.avatar ||
                    "https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3"
                  }
                  alt={`${displayName}'s avatar`}
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
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors shadow-sm flex items-center justify-center ${
                    isFollowing
                      ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  }`}
                >
                  {followLoading ? (
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : (
                    <>{isFollowing ? "Đang theo dõi" : "Theo dõi"}</>
                  )}
                </button>
                <button
                  onClick={handleMessageUser}
                  className="flex-1 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle size={16} className="mr-2 inline-block" />
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
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
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
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
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
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
              )}
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === "stats" ? "text-gray-900" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("stats")}
            >
              Thống kê
              {activeTab === "stats" && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {isOwnProfile && (
          <div className="fixed bottom-6 right-6 z-10">
            <button className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center shadow-lg transition-colors group">
              <Edit
                size={24}
                className="text-white group-hover:scale-110 transition-transform"
              />
            </button>
          </div>
        )}

        <div className="pb-20">
          {activeTab === "posts" && (
            <div className="px-4 pt-2">
              {posts && posts.length > 0 ? (
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="mb-6 bg-gray-50 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center mb-3">
                      <img
                        src={
                          user?.avatar ||
                          user?.profile?.avatar ||
                          "https://via.placeholder.com/150"
                        }
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-800">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    {post.caption && (
                      <p className="text-gray-700 mb-3">{post.caption}</p>
                    )}

                    {post.media && post.media.length > 0 && (
                      <div className="mb-3 rounded-lg overflow-hidden">
                        {post.media[0].type === "image" ? (
                          <img
                            src={post.media[0].url}
                            alt="Post media"
                            className="w-full h-auto max-h-96 object-cover"
                          />
                        ) : (
                          <video
                            src={post.media[0].url}
                            controls
                            className="w-full h-auto max-h-96"
                          />
                        )}
                      </div>
                    )}

                    <div className="flex items-center text-gray-500 text-sm">
                      <button className="flex items-center hover:text-red-500 transition-colors">
                        <Heart size={18} className="mr-1" />
                        Thích
                      </button>
                      <button className="flex items-center ml-4 hover:text-blue-500 transition-colors">
                        <MessageCircle size={18} className="mr-1" />
                        Bình luận
                      </button>
                      <button className="flex items-center ml-4 hover:text-green-500 transition-colors">
                        <Share size={18} className="mr-1" />
                        Chia sẻ
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Image size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">Chưa có bài viết nào</p>
                  {isOwnProfile && (
                    <p className="text-sm text-gray-400">
                      Đăng bài viết đầu tiên của bạn để bắt đầu chia sẻ
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "media" && (
            <div className="px-4 pt-4 grid grid-cols-3 gap-1">
              {posts &&
                posts
                  .filter((post) => post.media && post.media.length > 0)
                  .map((post) => (
                    <div
                      key={post._id}
                      className="aspect-square relative group overflow-hidden rounded-md"
                    >
                      {post.media[0].type === "image" ? (
                        <img
                          src={post.media[0].url}
                          alt="Media"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={post.media[0].url}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white flex items-center">
                          <Heart size={16} className="mr-1" fill="white" />0
                        </p>
                      </div>
                    </div>
                  ))}
              {(!posts ||
                posts.filter((post) => post.media && post.media.length > 0)
                  .length === 0) && (
                <div className="col-span-3 text-center py-10">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Image size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">Chưa có media nào</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "likes" && (
            <div className="px-4 pt-4">
              <div className="text-center py-10">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500">Chưa có bài viết đã thích nào</p>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="px-4 pt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800">
                Thống kê hoạt động
              </h3>

              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-600">
                    Tổng quan
                  </h4>
                  <p className="text-xs text-gray-500">Từ khi tham gia</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Bài viết</p>
                    <p className="text-xl font-bold text-gray-800">
                      {stats.postsCount}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Lượt thích nhận được
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {stats.likesCount}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Người theo dõi</p>
                    <p className="text-xl font-bold text-gray-800">
                      {stats.followersCount}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Đang theo dõi</p>
                    <p className="text-xl font-bold text-gray-800">
                      {stats.followingCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5">
                <div className="flex items-center mb-4">
                  <BarChart2 size={18} className="text-purple-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">
                    Tỷ lệ tương tác
                  </h4>
                </div>

                <div className="h-8 bg-gray-200 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        stats.postsCount > 0
                          ? (stats.likesCount / stats.postsCount) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>

                <p className="text-sm text-gray-600">
                  {stats.postsCount > 0
                    ? `Trung bình ${(
                        stats.likesCount / stats.postsCount
                      ).toFixed(1)} lượt thích mỗi bài viết`
                    : "Chưa có đủ dữ liệu để tính tỷ lệ tương tác"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
