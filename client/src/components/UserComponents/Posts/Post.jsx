import {
  Ellipsis,
  ExternalLink,
  Heart,
  MessageCircle,
  Save,
  X,
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
import { socket } from "../../../socket";
import ShowImagePost from "./ShowImagePost";
import ShowVideoPost from "./ShowVideoPost";
import { setPostLikeStatus, updateLikeCount } from "../../../slices/LikeSlice";

const Post = ({ data }) => {
  const dispatch = useDispatch();
  const likeState = useSelector((state) => {
    // console.log(`[REDUX STATE] Post ${data?._id}:`, state?.like);
    return state?.like?.likesByPost?.[data._id] || { isLiked: false, count: 0 };
  });
  const [postOption, setPostOption] = useState(false);
  const [comments] = useState(0);
  const [showImage, setShowImage] = useState(null);
  const [showVideo, setShowVideo] = useState(null);
  const { openComment, setOpenComment } = useContext(DataContext);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState({});
  const [volumeControls, setVolumeControls] = useState({});
  const videoRefs = useRef({});
  const [likeLoading, setLikeLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // useEffect(() => {
  //   console.log(`[Post ${data?._id}] Current like state:`, likeState);
  // }, [data?._id, likeState]);

  const formatTime = (date) => {
    const formattedRelative = formatDistanceToNowStrict(new Date(date), {
      addSuffix: true,
      locale: vi,
    });
    return formattedRelative.includes("dưới 1 phút trước")
      ? "Vừa xong"
      : formattedRelative;
  };

  useEffect(() => {
    if (!data || !data._id) {
      console.log("[Post] Missing data or post ID");
      return;
    }

    // console.log(
    //   `[Post ${data._id}] Setting up effect for data loading and socket`
    // );
    let isMounted = true;

    const fetchLikeData = async () => {
      try {
        setLikeLoading(true);
        // console.log(`[Post ${data._id}] Fetching like data from API...`);

        const [statusResponse, countResponse] = await Promise.all([
          Like.GET_LIKE_STATUS(data._id),
          Like.GET_ALL_LIKES([data._id]),
        ]);

        if (!isMounted) {
          // console.log(
          //   `[Post ${data._id}] Component unmounted, ignoring responses`
          // );
          return;
        }

        // console.log(`[Post ${data._id}] API responses:`, {
        //   statusResponse: statusResponse?.data,
        //   countResponse: countResponse?.data,
        // });

        if (
          statusResponse?.data?.code === 1 &&
          countResponse?.data?.code === 1
        ) {
          const isLiked = statusResponse.data.data?.isLiked || false;
          const count = countResponse.data.data?.[data._id]?.count || 0;

          // console.log(`[Post ${data._id}] Processed data:`, { isLiked, count });

          dispatch(
            setPostLikeStatus({
              postId: data._id,
              isLiked,
              count,
            })
          );
          setDataLoaded(true);
        } else {
          console.error(`[Post ${data._id}] Invalid API response:`, {
            statusCode: statusResponse?.data?.code,
            countCode: countResponse?.data?.code,
          });
        }
      } catch (error) {
        console.error(`[Post ${data._id}] Error fetching like data:`, error);
      } finally {
        if (isMounted) {
          setLikeLoading(false);
        }
      }
    };

    const handleLikeUpdate = (updateData) => {
      if (!isMounted) return;

      // console.log(`[Post ${data._id}] Socket update received:`, updateData);

      if (typeof updateData === "object" && updateData !== null) {
        if ("isLiked" in updateData) {
          // console.log(
          //   `[Post ${data._id}] Updating like status and count:`,
          //   updateData
          // );
          dispatch(
            setPostLikeStatus({
              postId: data._id,
              isLiked: updateData.isLiked,
              count: updateData.count || 0,
            })
          );
        } else {
          // console.log(
          //   `[Post ${data._id}] Updating like count only:`,
          //   updateData.count
          // );
          dispatch(
            updateLikeCount({
              postId: data._id,
              count: updateData.count || 0,
            })
          );
        }
      } else {
        // console.log(
        //   `[Post ${data._id}] Updating like count (numeric):`,
        //   updateData
        // );
        dispatch(
          updateLikeCount({
            postId: data._id,
            count: updateData || 0,
          })
        );
      }
    };

    const socketEvent = `post:${data._id}:likeUpdate`;
    // console.log(
    //   `[Post ${data._id}] Registering socket listener for:`,
    //   socketEvent
    // );
    socket.on(socketEvent, handleLikeUpdate);

    if (!dataLoaded) {
      // console.log(`[Post ${data._id}] Initial data load`);
      fetchLikeData();
    }

    return () => {
      // console.log(`[Post ${data._id}] Cleaning up effect`);
      isMounted = false;
      socket.off(socketEvent, handleLikeUpdate);
    };
  }, [data, dispatch, dataLoaded]);

  const handleLike = async () => {
    if (likeLoading || !data?._id) {
      // console.log(
      //   `[Post ${data?._id}] Skipping like action, loading:${likeLoading}`
      // );
      return;
    }

    // console.log(
    //   `[Post ${data._id}] Like button clicked, current state:`,
    //   likeState
    // );

    try {
      setLikeLoading(true);

      const oldState = { ...likeState };

      const newIsLiked = !likeState.isLiked;
      const newCount = newIsLiked
        ? likeState.count + 1
        : Math.max(0, likeState.count - 1);

      console.log(`[Post ${data._id}] Optimistic update:`, {
        newIsLiked,
        newCount,
      });

      dispatch(
        setPostLikeStatus({
          postId: data._id,
          isLiked: newIsLiked,
          count: newCount,
        })
      );

      let response;
      if (newIsLiked) {
        // console.log(`[Post ${data._id}] Calling CREATE_LIKE API`);
        response = await Like.CREATE_LIKE({ postId: data._id });
      } else {
        // console.log(`[Post ${data._id}] Calling DELETE_LIKE API`);
        response = await Like.DELETE_LIKE({ postId: data._id });
      }

      // console.log(`[Post ${data._id}] API response:`, response?.data);

      if (!response || response.data?.code !== 1) {
        // console.error(`[Post ${data._id}] API error:`, response?.data);
        dispatch(
          setPostLikeStatus({
            postId: data._id,
            isLiked: oldState.isLiked,
            count: oldState.count,
          })
        );
      } else {
        console.log(`[Post ${data._id}] Like action successful`);
      }
    } catch (error) {
      console.error(`[Post ${data._id}] Like action failed:`, error);

      dispatch(
        setPostLikeStatus({
          postId: data._id,
          isLiked: likeState.isLiked,
          count: likeState.count,
        })
      );
    } finally {
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

  const toggleMute = (videoId) => {
    if (videoRefs.current[videoId]) {
      const video = videoRefs.current[videoId];
      video.muted = !video.muted;

      if (!video.muted) {
        const savedVolume = volumeControls[videoId] || 1.0;
        video.volume = savedVolume;
        video.currentTime = 0;
        video
          .play()
          .catch((err) => console.error("Không thể phát video:", err));
      }

      setIsMuted(video.muted);
    }
  };

  const togglePlay = (videoId) => {
    if (videoRefs.current[videoId]) {
      const video = videoRefs.current[videoId];
      if (video.paused) {
        video
          .play()
          .then(() => {
            setIsPlaying((prev) => ({ ...prev, [videoId]: true }));
          })
          .catch((err) => console.error("Lỗi khi phát video:", err));
      } else {
        video.pause();
        setIsPlaying((prev) => ({ ...prev, [videoId]: false }));
      }
    }
  };

  const handleVideoLoaded = (videoId) => {
    if (videoRefs.current[videoId]) {
      const video = videoRefs.current[videoId];

      video.addEventListener("play", () => {
        setIsPlaying((prev) => ({ ...prev, [videoId]: true }));
      });

      video.addEventListener("pause", () => {
        setIsPlaying((prev) => ({ ...prev, [videoId]: false }));
      });

      if (!video.paused) {
        setIsPlaying((prev) => ({ ...prev, [videoId]: true }));
      }
    }
  };

  return (
    <div className="w-full bg-white border-b border-t border-gray-300 flex flex-col justify-start gap-2">
      {/* Header */}
      <div className="flex justify-between px-4 pt-2">
        <div className="flex space-x-2 relative">
          <img
            className="h-[35px] w-[35px] object-cover rounded-full cursor-pointer"
            src={
              data.user?.avatar ||
              "https://i0.wp.com/sbcf.fr/wp-content/uploads/2018/03/sbcf-default-avatar.png?ssl=1"
            }
            alt="Profile"
          />
          <div className="flex gap-3 justify-start ">
            <span className="font-semibold hover:underline">
              {data.user.name}
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

      {/* Caption */}
      <p className="px-4">{data.caption}</p>

      {/* Media */}
      {data.media?.length > 0 && (
        <div className="w-auto mx-4 overflow-x-scroll flex gap-2 flex-nowrap hide-scroll">
          {data.media.map((item, index) => (
            <div key={index} className="flex-shrink-0">
              {item.type === "video" ? (
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

      {/* Actions */}
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
              size={20}
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

      {/* Full Image View */}
      {showImage && (
        <ShowImagePost setShowImage={setShowImage} showImage={showImage} />
      )}

      {/* Full Video View */}
      {showVideo && (
        <ShowVideoPost setShowVideo={setShowVideo} showVideo={showVideo} />
      )}
    </div>
  );
};

export default Post;
