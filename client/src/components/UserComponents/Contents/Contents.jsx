import React, { useRef, useCallback } from "react";
import { CreatePost } from "../Posts";
import "./index.css";
import { TrendingTopics } from "../TrendingTopics";
import TopUser from "../TopUser/TopUser";
import PostLists from "../Posts/PostLists";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import POST from "../../../services/postService";
import {
  getAllPost,
  setLoading,
  resetPagination,
} from "../../../slices/PostSlice";

const Contents = () => {
  const trendingTopics = [
    { name: "#ChillCuốiTuần", posts: "12.4K" },
    { name: "#MondayMood", posts: "8.1K" },
    { name: "#FoodieLife", posts: "5.9K" },
    { name: "#CodeNewbie", posts: "3.4K" },
    { name: "#Travel2025", posts: "10.7K" },
  ];
  const contentPost = [
    { content: "Nguoi anh em o dong nai bat duoc ca sau" },
    { content: "Mot vu no lon tai cac nha may hat nhan cua my" },
    { content: "Chi phu cac quoc gia dang yeu cau trong cay" },
    { content: "Di em gai duoi que" },
  ];

  const dispatch = useDispatch();
  const { pagination = {}, loading } = useSelector((state) => state.post || {});
  const observer = useRef();
  const contentRef = useRef();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPosts = async (page = 1) => {
    try {
      dispatch(setLoading(true));
      if (page > 1) {
        setIsLoadingMore(true);
      }

      if (page > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const response = await POST.GET_ALL_USER(page, pagination?.limit || 10);

      if (response && response.code === 1) {
        const posts = response.posts || [];
        const paginationData = response.pagination || {
          page,
          limit: pagination?.limit || 10,
          totalPosts: 0,
          totalPages: 0,
          hasMore: false,
        };

        dispatch(
          getAllPost({
            posts,
            pagination: paginationData,
          })
        );
      } else {
        console.error("Invalid response format:", response);
      }

      dispatch(setLoading(false));
      setIsLoadingMore(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      dispatch(setLoading(false));
      setIsLoadingMore(false);
    }
  };

  const lastPostElementRef = useCallback(
    (node) => {
      if (loading || isLoadingMore) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && pagination?.hasMore) {
            console.log("Tải thêm bài viết...", pagination.page + 1);
            fetchPosts((pagination?.page || 0) + 1);
          }
        },
        { threshold: 0.1 }
      );

      if (node) observer.current.observe(node);
    },
    [loading, isLoadingMore, pagination?.hasMore, pagination?.page]
  );

  useEffect(() => {
    return () => {
      dispatch(resetPagination());
    };
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, []);

  return (
    <div className="w-[95vw] h-[86vh]  mt-5 shadow-md rounded-xl m-auto flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-[100%] h-full rounded-xl flex flex-col md:flex-row justify-between gap-6">
        <div className="hidden md:block md:w-1/4 h-full">
          <TopUser content={contentPost} />
        </div>
        <div
          ref={contentRef}
          className="w-full md:w-1/2 h-full overflow-y-scroll content-post rounded-t-xl border border-gray-300"
        >
          <CreatePost />
          <PostLists lastPostElementRef={lastPostElementRef} />

          {(loading || isLoadingMore) && (
            <div className="flex justify-center items-center py-3 mb-2 bg-white bg-opacity-70 sticky bottom-0 left-0 right-0">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-black"></div>
              <span className="ml-2 text-sm font-medium text-black">
                {pagination?.page > 1 ? "Đang tải thêm..." : "Đang tải..."}
              </span>
            </div>
          )}
        </div>

        <div className="hidden md:block md:w-1/4">
          <TrendingTopics trendingTopics={trendingTopics} />
        </div>
      </div>
    </div>
  );
};

export default Contents;
