import { useState, useMemo } from 'react';
import { Bookmark, Grid, List, X, Trash2, Loader2 } from 'lucide-react';
import Post from '@/components/features/feed/Posts/Post';
import { useSavedPosts, useToggleSave } from '@/hooks/usePostsQuery';
import toast from 'react-hot-toast';

const SavePosts = () => {
  const [viewMode, setViewMode] = useState('list');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const { data: savedPostsData, isLoading, error } = useSavedPosts();
  const toggleSaveMutation = useToggleSave();

  const posts = useMemo(() => {
    return Array.isArray(savedPostsData)
      ? savedPostsData
      : savedPostsData?.posts || savedPostsData?.data || [];
  }, [savedPostsData]);

  const handleUnsave = postId => {
    setSelectedPostId(postId);
    setShowDeleteModal(true);
  };

  const confirmUnsave = async () => {
    if (!selectedPostId) return;
    try {
      await toggleSaveMutation.mutateAsync(selectedPostId);
      toast.success('Đã bỏ lưu bài viết');
      setShowDeleteModal(false);
      setSelectedPostId(null);
    } catch (error) {
      console.error('Failed to unsave post:', error);
      toast.error('Không thể bỏ lưu bài viết');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <p>Đã có lỗi xảy ra khi tải bài viết đã lưu.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Bookmark size={24} className="text-content dark:text-white" />
            <div>
              <h1 className="text-lg font-bold text-content dark:text-white">
                Saved Posts
              </h1>
              <p className="text-sm text-neutral-500">
                {posts.length} saved items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-neutral-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <Bookmark size={48} className="mb-4 text-neutral-300" />
          <h2 className="text-lg font-semibold text-content dark:text-white mb-2">
            No saved posts
          </h2>
          <p className="text-sm">Posts you save will appear here</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {posts.map(post => {
            const actualPost = post.postId || post;
            return (
              <div key={actualPost._id} className="relative group">
                <Post data={actualPost} />
                <button
                  onClick={() => handleUnsave(actualPost._id)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-neutral-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1">
          {posts.map(post => {
            const actualPost = post.postId || post;
            return (
              <div
                key={actualPost._id}
                className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 group cursor-pointer overflow-hidden"
              >
                {actualPost.media?.[0]?.url ? (
                  <img
                    src={actualPost.media[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <p className="text-xs text-neutral-500 line-clamp-3 text-center">
                      {actualPost.caption}
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleUnsave(actualPost._id)}
                    className="p-2 rounded-full bg-white/20 hover:bg-red-500 transition-colors"
                  >
                    <Trash2 size={20} className="text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-content dark:text-white">
                Remove from saved?
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>
            <p className="text-neutral-500 mb-6">
              This post will be removed from your saved items.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-content dark:text-white font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnsave}
                disabled={toggleSaveMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {toggleSaveMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavePosts;
