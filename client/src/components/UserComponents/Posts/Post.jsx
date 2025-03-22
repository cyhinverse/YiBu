import {
  Ellipsis,
  ExternalLink,
  Heart,
  MessageCircle,
  Save,
} from "lucide-react";
import { useContext, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PostOption from "./PostOption";
import Like from "../../../services/likeService";
import "./index.css";
import { DataContext } from "../../../DataProvider";
import CommentModel from "../Comment/CommentModel";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import ShowImagePost from "./ShowImagePost";
import ShowVideoPost from "./ShowVideoPost";
import { setPostLikeStatus } from "../../../slices/LikeSlice";
import SAVE_POST from "../../../services/savePostService";
import { setSavedStatus } from "../../../slices/SavePostSlice";
import { toast } from "react-hot-toast";
import { getLikeManager } from "../../../socket/likeManager";

const InvalidPostFallback = ({ message }) => (
  <div className="w-full p-4 border-b border-gray-200">
    <div className="flex items-center space-x-2">
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 w-16 bg-gray-100 rounded mt-2 animate-pulse"></div>
      </div>
    </div>
    <div className="mt-3 text-sm text-red-500">{message}</div>
  </div>
);

const Post = ({ data, isSavedPost = false }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);
  const likeState = useSelector((state) => {
    return state?.like?.likesByPost?.[data._id] || { isLiked: false, count: 0 };
  });
  const savedStatus = useSelector(
    (state) => state.savePost?.savedStatus?.[data?._id] || isSavedPost
  );

  const [postOption, setPostOption] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const { openComment, setOpenComment } = useContext(DataContext);
  const [showImage, setShowImage] = useState(null);
  const [showVideo, setShowVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState({});
  const [volumeControls, setVolumeControls] = useState({});
  const videoRefs = useRef({});
  const [likeLoading, setLikeLoading] = useState(false);
  const isProcessingLike = useRef(false);
  const [comments] = useState(0);

  const isValidData = data && data._id;

  const user = data?.user || {
    name: "Người dùng không xác định",
    avatar: null,
  };

  const formatTime = (date) => {
    if (!date) return "Không xác định";
    try {
      const formattedRelative = formatDistanceToNowStrict(new Date(date), {
        addSuffix: true,
        locale: vi,
      });
      return formattedRelative.includes("dưới 1 phút trước")
        ? "Vừa xong"
        : formattedRelative;
    } catch (error) {
      console.error("Lỗi định dạng thời gian:", error);
      return "Không xác định";
    }
  };

  const handleVideoLoaded = (videoId) => {
    if (videoRefs.current[videoId]) {
      setIsPlaying((prev) => ({ ...prev, [videoId]: true }));
      setVolumeControls((prev) => ({
        ...prev,
        [videoId]: videoRefs.current[videoId].volume,
      }));
    }
  };

  const togglePlay = (videoId) => {
    const video = videoRefs.current[videoId];
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying((prev) => ({ ...prev, [videoId]: true }));
    } else {
      video.pause();
      setIsPlaying((prev) => ({ ...prev, [videoId]: false }));
    }
  };

  const toggleMute = (videoId) => {
    const video = videoRefs.current[videoId];
    if (!video) return;

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  useEffect(() => {
    if (!isValidData) return;

    let isMounted = true;
    const postId = data._id;
    const likeManager = getLikeManager();

    const fetchLikeData = async () => {
      try {
        setLikeLoading(true);
        const [statusResponse, countResponse] = await Promise.all([
          Like.GET_LIKE_STATUS(postId),
          Like.GET_ALL_LIKES([postId]),
        ]);

        if (!isMounted) return;

        if (
          statusResponse?.data?.code === 1 &&
          countResponse?.data?.code === 1
        ) {
          const isLiked = statusResponse.data.data?.isLiked || false;
          const count = countResponse.data.data?.[postId]?.count || 0;

          dispatch(
            setPostLikeStatus({
              postId,
              isLiked,
              count,
            })
          );
        }
      } catch (error) {
        console.error(`[Post ${postId}] Error fetching like data:`, error);
      } finally {
        if (isMounted) {
          setLikeLoading(false);
        }
      }
    };

    // Tham gia phòng socket cho post này
    if (likeManager) {
      console.log(`[Post ${postId}] Joining post room for realtime updates`);
      likeManager.joinPostRoom(postId);
    } else {
      console.warn(
        `[Post ${postId}] likeManager not available, can't join room`
      );
    }

    // Check saved status
    const checkSavedStatus = async () => {
      try {
        const response = await SAVE_POST.CHECK_SAVED_STATUS(postId);
        if (response.data?.code === 1) {
          dispatch(setSavedStatus({ postId, status: response.data.isSaved }));
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };

    fetchLikeData();
    checkSavedStatus();

    return () => {
      isMounted = false;
    };
  }, [dispatch, isValidData, data?._id, currentUser?.user?._id]);

  const handleLike = () => {
    if (!isValidData || likeLoading || !currentUser?.user?._id) {
      console.log("[Like Debug] Cannot like:", {
        isValidData,
        likeLoading,
        userId: currentUser?.user?._id,
      });
      return;
    }

    try {
      setLikeLoading(true);
      isProcessingLike.current = true;

      const oldState = { ...likeState };
      const postId = data._id;
      const userId = currentUser.user._id;
      const newIsLiked = !likeState.isLiked;
      const newCount = newIsLiked
        ? likeState.count + 1
        : Math.max(0, likeState.count - 1);

      console.log("[Like Debug] Attempting to like/unlike:", {
        postId,
        oldState,
        newIsLiked,
        newCount,
        userId,
      });

      // Cập nhật UI trước
      dispatch(
        setPostLikeStatus({
          postId,
          isLiked: newIsLiked,
          count: newCount,
        })
      );

      // Gửi sự kiện thông qua socket
      const likeManager = getLikeManager();
      if (likeManager) {
        likeManager.emitLikeAction(
          postId,
          userId,
          newIsLiked ? "like" : "unlike"
        );
      }

      // Debug output trước khi gọi API
      console.log("[Like Debug] Calling API:", {
        endpoint: newIsLiked ? "CREATE_LIKE" : "DELETE_LIKE",
        data: { postId },
      });

      const apiCall = newIsLiked ? Like.CREATE_LIKE : Like.DELETE_LIKE;
      apiCall({ postId })
        .then((response) => {
          console.log("[Like Debug] API response:", response);

          if (!response || response.data?.code !== 1) {
            console.warn(
              "[Like Debug] API returned non-success code:",
              response?.data
            );
            dispatch(
              setPostLikeStatus({
                postId,
                isLiked: oldState.isLiked,
                count: oldState.count,
              })
            );
          } else {
            // API thành công - cập nhật lần cuối với dữ liệu từ server
            const serverCount = response.data?.data?.likeCount || newCount;
            if (serverCount !== newCount) {
              dispatch(
                setPostLikeStatus({
                  postId,
                  isLiked: newIsLiked,
                  count: serverCount,
                })
              );
            }
          }
        })
        .catch((error) => {
          console.error(`[Post ${postId}] Like action failed:`, error);
          console.error("[Like Debug] Error details:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
          });

          // Khôi phục trạng thái cũ nếu API thất bại
          dispatch(
            setPostLikeStatus({
              postId,
              isLiked: oldState.isLiked,
              count: oldState.count,
            })
          );
        })
        .finally(() => {
          isProcessingLike.current = false;
          setLikeLoading(false);
        });
    } catch (error) {
      console.error(`[Post ${data._id}] Like action failed:`, error);
      // Khôi phục trạng thái ban đầu nếu xảy ra lỗi
      dispatch(
        setPostLikeStatus({
          postId: data._id,
          isLiked: likeState.isLiked,
          count: likeState.count,
        })
      );
      isProcessingLike.current = false;
      setLikeLoading(false);
    }
  };

  const handleVolumeChange = (videoId, value) => {
    if (videoRefs.current[videoId]) {
      const video = videoRefs.current[videoId];
      const volume = parseFloat(value);
      video.volume = volume;

      setVolumeControls((prev) => ({ ...prev, [videoId]: volume }));

      if (volume === 0) {
        video.muted = true;
        setIsMuted(true);
      } else if (video.muted) {
        video.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleSavePost = async () => {
    if (!isValidData || saveLoading) return;

    try {
      setSaveLoading(true);
      const postId = data._id;

      const apiCall = savedStatus ? SAVE_POST.UNSAVE_POST : SAVE_POST.SAVE_POST;
      const response = await apiCall(postId);

      if (response.data?.code === 1) {
        dispatch(
          setSavedStatus({
            postId,
            status: !savedStatus,
          })
        );
        toast.success(savedStatus ? "Đã bỏ lưu bài viết" : "Đã lưu bài viết");
      } else {
        toast.error(response.data?.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi lưu bài viết"
      );
    } finally {
      setSaveLoading(false);
    }
  };

  if (!isValidData) {
    const errorMessage = !data
      ? "Dữ liệu bài viết không tồn tại"
      : "Dữ liệu bài viết không hợp lệ (thiếu ID)";
    console.error("Post component:", errorMessage, data);
    return <InvalidPostFallback message={errorMessage} />;
  }

  return (
    <div className="w-full bg-white border-b border-gray-300 flex flex-col justify-start gap-2">
      <div className="flex justify-between px-4 pt-2">
        <div className="flex space-x-2 relative">
          <img
            className="h-[35px] w-[35px] object-cover rounded-full cursor-pointer"
            src={
              user?.avatar ||
              "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1"
            }
            alt="Profile"
          />
          <div className="flex gap-3 justify-start">
            <span className="font-semibold hover:underline">
              {user?.name || "Người dùng"}
            </span>
            <span className="text-sm font-semibold text-black/15">
              {formatTime(data.createdAt)}
            </span>
          </div>
        </div>
        <div onClick={() => setPostOption(!postOption)} className="relative">
          <Ellipsis className="cursor-pointer" size={20} />
          <PostOption show={postOption} />
        </div>
      </div>

      <p className="px-4">{data.caption || ""}</p>

      {data.media && data.media.length > 0 && (
        <div className="w-auto mx-4 overflow-x-scroll flex gap-2 flex-nowrap hide-scroll">
          {data.media.map((item, index) => (
            <div key={index} className="flex-shrink-0">
              {item?.type === "video" ? (
                <div className="threads-video-container relative">
                  <video
                    ref={(el) => (videoRefs.current[`video-${index}`] = el)}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    loop
                    onLoadedData={() => handleVideoLoaded(`video-${index}`)}
                    className="w-auto h-auto max-h-[300px] object-cover bg-center rounded-md cursor-pointer"
                    onClick={() => setShowVideo(item.url)}
                  >
                    <source src={item.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="threads-video-controls absolute bottom-3 right-3 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                    <button
                      className="text-white hover:text-gray-200 transition-colors"
                      onClick={() => togglePlay(`video-${index}`)}
                    >
                      {isPlaying[`video-${index}`] ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      )}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        className="text-white hover:text-gray-200 transition-colors"
                        onClick={() => toggleMute(`video-${index}`)}
                      >
                        {videoRefs.current[`video-${index}`]?.muted ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                            <line x1="23" y1="9" x2="17" y2="15"></line>
                            <line x1="17" y1="9" x2="23" y2="15"></line>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          </svg>
                        )}
                      </button>

                      {!videoRefs.current[`video-${index}`]?.muted && (
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volumeControls[`video-${index}`] || 1}
                          onChange={(e) =>
                            handleVolumeChange(`video-${index}`, e.target.value)
                          }
                          className="volume-slider w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  className="w-auto h-auto max-h-[300px] object-cover cursor-pointer rounded-md"
                  src={item.url}
                  alt={`Post Media ${index + 1}`}
                  onClick={() => setShowImage(item.url)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center w-[350px] mb-2 px-4">
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-1">
            <Heart
              onClick={handleLike}
              className={`cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90 ${
                likeLoading ? "opacity-50" : ""
              }`}
              color={likeState.isLiked ? "red" : "black"}
              fill={likeState.isLiked ? "red" : "none"}
              size={23}
              strokeWidth={1}
            />
            <span className="text-sm font-medium text-gray-700">
              {likeState.count}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle
              className="cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90"
              strokeWidth={1}
              size={23}
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
            size={23}
          />
        </div>
        <div>
          <Save
            onClick={handleSavePost}
            className={`cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90 ${
              saveLoading ? "opacity-50" : ""
            }`}
            strokeWidth={1}
            size={23}
          />
        </div>
      </div>

      {showImage && (
        <ShowImagePost setShowImage={setShowImage} showImage={showImage} />
      )}
      {showVideo && (
        <ShowVideoPost setShowVideo={setShowVideo} showVideo={showVideo} />
      )}
      {openComment === data._id && (
        <CommentModel post={data} setOpenComment={setOpenComment} />
      )}
      {postOption && <PostOption post={data} setPostOption={setPostOption} />}
    </div>
  );
};

export default Post;
