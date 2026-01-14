import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Hash, TrendingUp, Loader2 } from 'lucide-react';
import { useGetPostsByHashtag } from '@/hooks/usePostsQuery';
import Post from '@/components/features/feed/Posts/Post';

const HashtagPosts = () => {
  const { hashtag } = useParams();
  const { data, isLoading: loading } = useGetPostsByHashtag(hashtag);
  const hashtagPosts = data?.posts || [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link
            to="/explore"
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft
              size={20}
              className="text-neutral-700 dark:text-neutral-300"
            />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Hash size={20} className="text-blue-500" />
              <h1 className="text-xl font-bold text-black dark:text-white">
                {hashtag}
              </h1>
            </div>
            <p className="text-sm text-neutral-500">
              {hashtagPosts?.length || 0} bài viết
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : hashtagPosts?.length > 0 ? (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {hashtagPosts.map(post => (
              <Post key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <TrendingUp size={32} className="text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Không tìm thấy bài viết
            </h2>
            <p className="text-neutral-500 max-w-sm">
              Chưa có bài viết nào với hashtag #{hashtag}. Hãy là người đầu tiên
              đăng bài!
            </p>
            <Link
              to="/explore"
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
            >
              Khám phá thêm
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagPosts;
