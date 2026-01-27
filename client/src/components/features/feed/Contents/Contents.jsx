import { useState, useRef } from 'react';
import CreatePost from '@/components/features/feed/Posts/CreatePost';
import PostLists from '@/components/features/feed/Posts/PostLists';
import TrendingTopics from '@/components/features/feed/TrendingTopics/TrendingTopics';
import TopUser from '@/components/features/user/TopUser/TopUser';
import { Sparkles, TrendingUp, Users, Flame, Zap, Hash } from 'lucide-react';
import { useTrendingHashtags } from '@/hooks/usePostsQuery';
import { useSuggestions } from '@/hooks/useUserQuery';
import { useSearchUsers } from '@/hooks/useSearchQuery';
import { useDebounce } from '@/hooks/useDebounce';

const Contents = () => {
  const [activeTab, setActiveTab] = useState('forYou');
  const [searchQuery] = useState('');
  const contentRef = useRef(null);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 300);
  // React Query hooks
  const { data: trendingHashtags = [] } = useTrendingHashtags(10);
  const { data: suggestionsData, isLoading: suggestionsLoading } =
    useSuggestions(5);
  const suggestions = suggestionsData?.data || suggestionsData || [];

  const { data: searchResultsData, isLoading: searchLoading } = useSearchUsers({
    query: debouncedSearch,
    page: 1,
    limit: 5,
  });
  const searchResults = searchResultsData?.data || searchResultsData || [];

  const loading = debouncedSearch.trim() ? searchLoading : suggestionsLoading;

  const tabs = [
    { id: 'forYou', label: 'For You', icon: Flame },
    { id: 'following', label: 'Following', icon: Users },
    { id: 'latest', label: 'Latest', icon: Zap },
    { id: 'hashtags', label: 'Hashtags', icon: Hash },
  ];

  // Format trending hashtags for component - handle both array and object with data property
  const hashtagsArray = Array.isArray(trendingHashtags)
    ? trendingHashtags
    : trendingHashtags?.data || [];
  const formattedTrending = hashtagsArray.map(tag => {
    const usage = tag.recentUsage?.last24Hours || tag.totalUsage || 0;
    return {
      name: `#${tag.name || tag.tag}`,
      posts: usage > 1000 ? (usage / 1000).toFixed(1) + 'K' : usage.toString(),
      category: tag.category || 'Trending',
    };
  });

  // Use suggestions or search results
  const displayUsers = debouncedSearch.trim() ? searchResults : suggestions;

  return (
    <div className="w-full flex gap-10 min-h-screen max-w-[1600px] mx-auto px-4 lg:px-10">
      {/* Main Feed */}
      <div className="flex-1 mx-auto lg:mx-0 h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 pt-4 pb-2 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-black dark:text-white">
                Feed
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Discover what's happening
              </p>
            </div>
            <button className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
              <Sparkles size={18} className="text-neutral-500" />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-neutral-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto hide-scrollbar pt-4 space-y-4"
        >
          <CreatePost />
          <PostLists activeTab={activeTab} />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:flex flex-col flex-1 h-screen sticky top-0 py-4 gap-4">
        {/* Scrollable Sidebar */}
        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 flex flex-col">
          {/* Trending */}
          <div className="flex-1 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-neutral-500" />
                <h2 className="font-medium text-sm text-black dark:text-white">
                  Trending Now
                </h2>
              </div>
            </div>
            <TrendingTopics
              trendingTopics={
                formattedTrending.length > 0
                  ? formattedTrending
                  : [
                      {
                        name: '#Trending',
                        posts: '0',
                        category: 'Loading...',
                      },
                    ]
              }
            />
          </div>

          {/* Suggested Users */}
          <div className="flex-1 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-neutral-500" />
                <h2 className="font-medium text-sm text-black dark:text-white">
                  {debouncedSearch.trim() ? 'Search Results' : 'Suggested'}
                </h2>
              </div>
            </div>
            <TopUser users={displayUsers} loading={loading} />
          </div>

          {/* Footer */}
          <div className="px-2 text-xs text-neutral-400 space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {['Terms', 'Privacy', 'Cookies', 'About', 'Help'].map(item => (
                <span
                  key={item}
                  className="hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer transition-colors"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="flex items-center gap-1">
              <Sparkles size={10} />© 2025 YiBu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contents;
