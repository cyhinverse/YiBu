import { useState, useRef } from 'react';
import CreatePost from '../Posts/CreatePost';
import PostLists from '../Posts/PostLists';
import TrendingTopics from '../TrendingTopics/TrendingTopics';
import TopUser from '../../user/TopUser/TopUser';
import {
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Crown,
  Flame,
  Zap,
} from 'lucide-react';
import { useTrendingHashtags } from '../../../../hooks/usePostsQuery';
import { useSuggestions } from '../../../../hooks/useUserQuery';
import { useSearchUsers } from '../../../../hooks/useSearchQuery';
import { useDebounce } from '@/hooks/useDebounce';

const Contents = () => {
  const [activeTab, setActiveTab] = useState('forYou');
  const [searchQuery, setSearchQuery] = useState('');
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
  ];

  // Format trending hashtags for component - handle both array and object with data property
  const hashtagsArray = Array.isArray(trendingHashtags)
    ? trendingHashtags
    : trendingHashtags?.data || [];
  const formattedTrending = hashtagsArray.map(tag => ({
    name: `#${tag.name || tag.tag}`,
    posts: tag.count
      ? `${tag.count > 1000 ? (tag.count / 1000).toFixed(1) + 'K' : tag.count}`
      : '0',
    category: tag.category || 'Trending',
  }));

  // Use suggestions or search results
  const displayUsers = debouncedSearch.trim() ? searchResults : suggestions;

  return (
    <div className="w-full flex gap-6 min-h-screen max-w-7xl mx-auto px-4 lg:px-6">
      {/* Main Feed */}
      <div className="flex-1 max-w-2xl mx-auto lg:mx-0 h-screen flex flex-col">
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
      <div className="hidden lg:flex flex-col w-80 xl:w-96 h-screen sticky top-0 py-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search YiBu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 rounded-full text-sm text-black dark:text-white placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Scrollable Sidebar */}
        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4">
          {/* Premium Card */}
          <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className="bg-primary p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 dark:bg-black/20 rounded-full flex items-center justify-center">
                  <Crown size={18} className="text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-foreground">
                    YiBu Premium
                  </h3>
                  <p className="text-primary-foreground/60 text-xs">
                    Unlock exclusive features
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-neutral-900">
              <ul className="space-y-2 mb-4 text-xs text-secondary">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  Ad-free experience
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-neutral-400" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-neutral-300" />
                  Exclusive badges
                </li>
              </ul>
              <button className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity">
                Upgrade Now
              </button>
            </div>
          </div>

          {/* Trending */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-neutral-500" />
                <h2 className="font-medium text-sm text-black dark:text-white">
                  Trending Now
                </h2>
              </div>
              <button className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                See all
              </button>
            </div>
            <TrendingTopics
              trendingTopics={
                formattedTrending.length > 0
                  ? formattedTrending
                  : [{ name: '#Trending', posts: '0', category: 'Loading...' }]
              }
            />
          </div>

          {/* Suggested Users */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-neutral-500" />
                <h2 className="font-medium text-sm text-black dark:text-white">
                  {debouncedSearch.trim() ? 'Search Results' : 'Suggested'}
                </h2>
              </div>
              <button className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                See all
              </button>
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
