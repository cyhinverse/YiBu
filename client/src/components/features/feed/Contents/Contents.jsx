import React, { useEffect, useRef, useCallback } from "react";
import CreatePost from "../Posts/CreatePost";
import PostLists from "../Posts/PostLists";
import TrendingTopics from "../TrendingTopics/TrendingTopics";
import TopUser from "../../user/TopUser/TopUser";
import { useDispatch, useSelector } from "react-redux";
import { getAllPost } from "../../../../redux/actions/postActions";
import { Search } from "lucide-react";

const Contents = () => {
  const dispatch = useDispatch();
  const { loading, pagination } = useSelector((state) => state.post);
  const contentRef = useRef(null);

  const trendingTopics = [
    { name: "ChillCuốiTuần", count: "12.4K" },
    { name: "MondayMood", count: "8.1K" },
    { name: "FoodieLife", count: "5.9K" },
    { name: "CodeNewbie", count: "3.4K" },
    { name: "Travel2025", count: "10.7K" },
  ];

  /* Mock data or selector for TopUser content if needed, previously passed as prop */
  const contentPost = []; 

  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const fetchPosts = useCallback(
    async (page) => {
      try {
        const response = await dispatch(getAllPost({ page, limit: pagination?.limit || 10 })).unwrap();
        
        if (response && response.code === 1) {
            // response handled
        } else {
            console.error("Invalid response format:", response);
        }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  }, [dispatch, pagination?.limit]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleScroll = useCallback(async () => {
    if (loading || isLoadingMore || !pagination?.hasMore) return;

    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setIsLoadingMore(true);
        await fetchPosts(pagination.page + 1);
        setIsLoadingMore(false);
      }
    }
  }, [loading, isLoadingMore, pagination, fetchPosts]);

  useEffect(() => {
    const ref = contentRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (ref) {
        ref.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  const lastPostElementRef = useCallback(() => {
     // logic if needed for intersection observer instead of scroll event
  }, []);

  return (
    <div className="w-full flex justify-center min-h-screen">
      
      {/* Main Feed (Center) */}
      <div className="w-full flex-1 flex-shrink-0 h-screen flex flex-col bg-surface  shadow-none">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md  px-4 py-3 cursor-pointer" onClick={() => contentRef.current?.scrollTo({top: 0, behavior: 'smooth'})}>
              <h2 className="text-xl font-bold text-text-primary">Home</h2>
          </div>

        <div
          ref={contentRef}
          className="w-full h-full overflow-y-scroll custom-scrollbar"
        >
          <div className="p-4">
            <CreatePost />
          </div>
          <div className="pb-4">
            <PostLists lastPostElementRef={lastPostElementRef} />
          </div>

          {(loading || isLoadingMore) && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 "></div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar (Search + Trending + Suggested) */}
      <div className="hidden lg:flex flex-col w-[350px] pl-8 py-4 h-screen gap-6 sticky top-0">
         
         {/* Search Input */}
         <div className="w-full bg-surface-highlight/50 rounded-full h-12 flex items-center px-5 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary focus-within:text-primary transition-all group">
            <Search className="text-text-secondary group-focus-within:text-primary mr-3 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search" 
                className="bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary w-full"
            />
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-4">
            {/* Trending Topics */}
            <div className="bg-surface-highlight/30 rounded-2xl overflow-hidden  py-2">
                <TrendingTopics trendingTopics={trendingTopics} />
            </div>

            {/* Suggested Users */}
            <div className="bg-surface-highlight/30 rounded-2xl overflow-hidden shadow-md bg-white-500   py-2">
                <TopUser content={contentPost} />
            </div>

            {/* Footer Links (Static) */}
            <div className="px-4 text-xs text-text-secondary flex flex-wrap gap-2 leading-relaxed">
                <span className="hover:underline cursor-pointer">Terms of Service</span>
                <span className="hover:underline cursor-pointer">Privacy Policy</span>
                <span className="hover:underline cursor-pointer">Cookie Policy</span>
                <span>© 2025 YiBu.</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Contents;
