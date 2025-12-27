import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, PenSquare, Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import Post from './Post';
import { useHomeFeed } from '../../../../hooks/useFeedQuery';
import { getBatchLikeStatus } from '../../../../redux/actions/likeActions';

const PostLists = ({ activeTab = 'forYou' }) => {
  const dispatch = useDispatch();
  const { likeStatuses } = useSelector(state => state.like);

  // React Query Hook
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
    refetch,
  } = useHomeFeed(activeTab);

  // Flatten pages to get all posts
  const displayPosts = data?.pages?.flatMap(page => page.posts || page) || [];

  // Infinite Scroll Observer
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch like statuses when displayPosts change
  const postIdsString = displayPosts?.map(p => p._id).join(',');

  useEffect(() => {
    if (displayPosts?.length > 0) {
      const postIds = displayPosts.map(post => String(post._id));
      dispatch(getBatchLikeStatus(postIds));
    }
  }, [postIdsString, dispatch]);

  if (isLoading) {
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
          {error?.message || 'Không thể tải bài viết'}
        </p>
        <button
          onClick={() => refetch()}
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
      <div ref={ref} className="h-10">
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        )}
      </div>

      {!hasNextPage && displayPosts.length > 0 && (
        <p className="text-center text-xs text-neutral-400 py-4">
          Bạn đã xem hết bài viết
        </p>
      )}
    </div>
  );
};

export default PostLists;
