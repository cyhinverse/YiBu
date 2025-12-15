import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, PenSquare, Loader2 } from 'lucide-react';
import Post from './Post';
import {
  getAllPosts,
  getPersonalizedFeed,
  getTrendingPosts,
} from '../../../../redux/actions/postActions';
import { getBatchLikeStatus } from '../../../../redux/actions/likeActions';

const PostLists = ({ activeTab = 'forYou' }) => {
  const dispatch = useDispatch();
  const {
    posts,
    personalizedPosts,
    trendingPosts,
    loading,
    error,
    pagination,
  } = useSelector(state => state.post);
  const { likeStatuses } = useSelector(state => state.like);
  const loadingRef = useRef(false);
  const observerRef = useRef(null);
  const prevTabRef = useRef(activeTab);

  // Determine which posts to display based on active tab
  const getDisplayPosts = () => {
    switch (activeTab) {
      case 'forYou':
        return personalizedPosts?.length > 0 ? personalizedPosts : posts;
      case 'following':
        return posts;
      case 'latest':
        return trendingPosts?.length > 0 ? trendingPosts : posts;
      default:
        return posts;
    }
  };

  const displayPosts = getDisplayPosts();

  // Fetch posts based on active tab
  useEffect(() => {
    // Reset when tab changes
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
    }

    switch (activeTab) {
      case 'forYou':
        dispatch(getPersonalizedFeed({ page: 1, limit: 20 }));
        break;
      case 'following':
        dispatch(getAllPosts({ page: 1, limit: 20 }));
        break;
      case 'latest':
        dispatch(getTrendingPosts({ page: 1, limit: 20 }));
        break;
      default:
        dispatch(getAllPosts({ page: 1, limit: 20 }));
    }
  }, [dispatch, activeTab]);

  // Fetch like statuses when displayPosts change
  useEffect(() => {
    if (displayPosts?.length > 0) {
      // Ensure postIds are strings for backend validation
      const postIds = displayPosts.map(post => String(post._id));
      dispatch(getBatchLikeStatus(postIds));
    }
  }, [displayPosts, dispatch]);

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (loadingRef.current || !pagination?.hasMore) return;
    loadingRef.current = true;

    const loadAction = () => {
      switch (activeTab) {
        case 'forYou':
          return getPersonalizedFeed({
            page: pagination.currentPage + 1,
            limit: 20,
          });
        case 'latest':
          return getTrendingPosts({
            page: pagination.currentPage + 1,
            limit: 20,
          });
        default:
          return getAllPosts({ page: pagination.currentPage + 1, limit: 20 });
      }
    };

    dispatch(loadAction()).finally(() => {
      loadingRef.current = false;
    });
  }, [dispatch, pagination, activeTab]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && pagination?.hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, loading, pagination?.hasMore]);

  if (loading && (!displayPosts || displayPosts.length === 0)) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <FileText size={28} className="text-red-500" />
        </div>
        <h3 className="text-base font-medium text-black dark:text-white mb-2">
          Có lỗi xảy ra
        </h3>
        <p className="text-xs text-neutral-500 text-center max-w-xs mb-4">
          {error}
        </p>
        <button
          onClick={() => dispatch(getAllPosts({ page: 1, limit: 20 }))}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!displayPosts || displayPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <FileText size={28} className="text-neutral-400" />
        </div>
        <h3 className="text-base font-medium text-black dark:text-white mb-2">
          No posts yet
        </h3>
        <p className="text-xs text-neutral-500 text-center max-w-xs mb-4">
          When there are posts, they'll show up here. Be the first to share
          something!
        </p>
        <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity">
          <PenSquare size={14} />
          Create Post
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayPosts.map(post => (
        <Post
          key={post._id}
          data={post}
          isLiked={likeStatuses?.[post._id]?.isLiked}
        />
      ))}

      {/* Load more trigger */}
      <div ref={observerRef} className="h-10">
        {loading && displayPosts.length > 0 && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        )}
      </div>

      {!pagination?.hasMore && displayPosts.length > 0 && (
        <p className="text-center text-xs text-neutral-400 py-4">
          Bạn đã xem hết bài viết
        </p>
      )}
    </div>
  );
};

export default PostLists;
