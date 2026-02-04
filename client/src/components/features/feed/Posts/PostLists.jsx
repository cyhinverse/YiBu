import { useEffect, useMemo, useState, useCallback } from 'react';
import { FileText, PenSquare, Loader2 } from 'lucide-react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import Post from './Post';
import { useHomeFeed } from '@/hooks/useFeedQuery';

const PostLists = ({ activeTab = 'forYou', onOpenComments }) => {
  const [activeOptionsPostId, setActiveOptionsPostId] = useState(null);

  const handleOptionsToggle = useCallback((postId, isOpen) => {
    if (!postId) return;
    setActiveOptionsPostId(prev =>
      isOpen ? postId : prev === postId ? null : prev
    );
  }, []);
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
  const displayPosts = useMemo(
    () => data?.pages?.flatMap(page => page.posts || page) || [],
    [data]
  );

  const totalCount = hasNextPage ? displayPosts.length + 1 : displayPosts.length;
  const rowVirtualizer = useWindowVirtualizer({
    count: totalCount,
    estimateSize: () => 560,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    const isAtEnd = lastItem.index >= displayPosts.length - 1;
    if (isAtEnd && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    displayPosts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

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
    <div className="relative">
      <div
        className="relative w-full"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {virtualItems.map(virtualRow => {
          const isLoaderRow = virtualRow.index > displayPosts.length - 1;
          const post = displayPosts[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className={`absolute top-0 left-0 w-full pb-4 ${
                !isLoaderRow && activeOptionsPostId === post?._id
                  ? 'z-50'
                  : 'z-0'
              }`}
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {isLoaderRow ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : (
                <Post
                  key={post._id}
                  data={post}
                  onOpenComments={onOpenComments}
                  onOptionsToggle={handleOptionsToggle}
                />
              )}
            </div>
          );
        })}
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

