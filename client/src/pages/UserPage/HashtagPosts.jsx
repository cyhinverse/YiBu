import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Hash,
  TrendingUp,
  Loader2,
  Users,
  Flame,
  Grid3X3,
  List,
  Heart,
  Share2,
} from 'lucide-react';
import { useGetPostsByHashtag, useTrendingHashtags } from '@/hooks/usePostsQuery';
import Post from '@/components/features/feed/Posts/Post';
import { formatNumber } from '@/utils/numberUtils';

const HashtagPosts = () => {
  const { hashtag } = useParams();
  const [viewMode, setViewMode] = useState('list'); 
  const { data, isLoading: loading } = useGetPostsByHashtag(hashtag);
  const { data: trendingHashtags } = useTrendingHashtags(5);
  
  const hashtagPosts = data?.posts || [];
  const hashtagStats = data?.stats || {};
  const relatedHashtags = trendingHashtags?.slice(0, 5) || [];

  // Calculate stats
  const totalLikes = hashtagPosts.reduce((sum, post) => sum + (post.likesCount || post.likeCount || 0), 0);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3">
          {/* Back & Title */}
          <div className="flex items-center gap-3 mb-4">
            <Link
              to="/explore"
              className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft size={20} className="text-neutral-700 dark:text-neutral-300" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center">
                  <Hash size={20} className="text-primary dark:text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black dark:text-white">
                    {hashtag}
                  </h1>
                  <p className="text-sm text-neutral-500">
                    {formatNumber(hashtagPosts.length)} posts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-neutral-500 mb-1">
                <Grid3X3 size={14} />
              </div>
              <p className="text-lg font-bold text-black dark:text-white">
                {formatNumber(hashtagPosts.length)}
              </p>
              <p className="text-xs text-neutral-500">Posts</p>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                <Heart size={14} />
              </div>
              <p className="text-lg font-bold text-black dark:text-white">
                {formatNumber(totalLikes)}
              </p>
              <p className="text-xs text-neutral-500">Likes</p>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                <Users size={14} />
              </div>
              <p className="text-lg font-bold text-black dark:text-white">
                {formatNumber(hashtagStats.contributors || hashtagPosts.length)}
              </p>
              <p className="text-xs text-neutral-500">Contributors</p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <List size={16} />
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <Grid3X3 size={16} />
                Grid
              </button>
            </div>
            
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <Share2 size={14} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Related Hashtags */}
        {relatedHashtags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-500 mb-3">Related Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {relatedHashtags
                .filter(tag => tag.tag?.replace('#', '') !== hashtag)
                .slice(0, 4)
                .map((tag, index) => (
                  <Link
                    key={tag._id || tag.tag}
                    to={`/explore/tag/${tag.tag?.replace('#', '')}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Hash size={12} className="text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {tag.tag?.replace('#', '')}
                    </span>
                    {index === 0 && <Flame size={12} className="text-orange-500" />}
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-4" />
            <p className="text-neutral-500">Loading posts...</p>
          </div>
        ) : hashtagPosts.length > 0 ? (
          <>
            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {hashtagPosts.map(post => (
                  <Post key={post._id} data={post} />
                ))}
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-3 gap-1">
                {hashtagPosts.map(post => {
                  const mediaUrl = post.media?.[0]?.url || post.images?.[0] || post.image;
                  return (
                    <Link
                      key={post._id}
                      to={`/post/${post._id}`}
                      className="relative aspect-square group overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800"
                    >
                      {mediaUrl ? (
                        <img
                          src={mediaUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          <p className="text-xs text-neutral-500 line-clamp-4 text-center">
                            {post.caption || post.content || 'No content'}
                          </p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <span className="flex items-center gap-1 text-white text-sm font-medium">
                          <Heart size={16} className="fill-current" />
                          {formatNumber(post.likesCount || post.likeCount || 0)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 mb-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <TrendingUp size={40} className="text-neutral-300 dark:text-neutral-600" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white mb-2">
              No posts yet
            </h2>
            <p className="text-neutral-500 max-w-sm mb-6">
              Be the first to post with #{hashtag} and start the conversation!
            </p>
            <Link
              to="/explore"
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Explore more
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagPosts;
