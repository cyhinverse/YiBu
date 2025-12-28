import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Users,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import {
  useProfile,
  useFollowUser,
  useUnfollowUser,
  useCheckFollow,
} from '@/hooks/useUserQuery';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const UserProfilePreview = ({ userId, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);
  const authUser = useSelector(state => state.auth.user);
  const isMe = authUser?._id === userId;

  // Fetch full user details when hovered
  const { data: user, isLoading } = useProfile(isOpen ? userId : null);

  // Follow status
  const { data: followStatus } = useCheckFollow(userId, !!userId && !isMe);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      // Calculate position (try to center it relative to trigger)
      setPosition({
        top: rect.bottom + scrollTop + 8,
        left: rect.left + scrollLeft,
      });
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 400); // Delay closing
  };

  const handleFollow = async e => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (followStatus?.isFollowing) {
        await unfollowMutation.mutateAsync(userId);
      } else {
        await followMutation.mutateAsync(userId);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={triggerRef}
    >
      {children}

      {isOpen &&
        createPortal(
          <div
            className="absolute z-[10000]"
            style={{
              top: position.top,
              left: position.left,
              transform: 'translateX(-5%)',
            }}
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }}
            onMouseLeave={() => setIsOpen(false)}
          >
            <style>
              {`
              @keyframes fadeInSlide {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .minimal-preview-card {
                animation: fadeInSlide 0.2s ease-out forwards;
              }
            `}
            </style>

            <div className="minimal-preview-card flex w-[500px] bg-white dark:bg-[#121212] rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {/* Sidebar */}
              <div className="w-[140px] bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 flex flex-col items-center pt-6 p-4">
                <div className="relative mb-4">
                  <img
                    src={user?.avatar || '/images/default-avatar.png'}
                    alt=""
                    className="w-20 h-20 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover bg-white"
                  />
                  {user?.isOnline && (
                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full" />
                  )}
                </div>

                {!isMe && (
                  <button
                    onClick={handleFollow}
                    disabled={
                      followMutation.isPending || unfollowMutation.isPending
                    }
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      followStatus?.isFollowing
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {followStatus?.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Main Content */}
              <div className="flex-1 p-5 flex flex-col min-w-0">
                {isLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4" />
                    <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded w-full" />
                  </div>
                ) : user ? (
                  <>
                    <div className="mb-4">
                      <Link
                        to={`/profile/${userId}`}
                        onClick={() => setIsOpen(false)}
                        className="hover:underline decoration-neutral-400"
                      >
                        <h4 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                          {user.name}
                          {user.verified && (
                            <span className="ml-1 text-blue-500 text-sm">
                              ●
                            </span>
                          )}
                        </h4>
                      </Link>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        @{user.username}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 mb-4">
                      <div className="text-center">
                        <span className="block text-sm font-bold text-neutral-900 dark:text-white">
                          {user.postsCount || 0}
                        </span>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-tight">
                          Posts
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-bold text-neutral-900 dark:text-white">
                          {user.followersCount || 0}
                        </span>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-tight">
                          Followers
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-bold text-neutral-900 dark:text-white">
                          {user.followingCount || 0}
                        </span>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-tight">
                          Following
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-normal line-clamp-2">
                        {user.bio || "This user hasn't added a bio yet."}
                      </p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-2">
                      {user.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{user.location}</span>
                        </div>
                      )}
                      {user.website && (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                          <LinkIcon size={12} className="shrink-0" />
                          <a
                            href={
                              user.website.startsWith('http')
                                ? user.website
                                : `https://${user.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:text-indigo-600"
                          >
                            {user.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <Calendar size={12} className="shrink-0" />
                        <span>
                          Joined{' '}
                          {new Date(user.createdAt).toLocaleDateString(
                            undefined,
                            { month: 'short', year: 'numeric' }
                          )}
                        </span>
                      </div>
                      {user.gender && (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 capitalize">
                          <Users size={12} className="shrink-0" />
                          <span>{user.gender}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 italic">
                    User not found
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default UserProfilePreview;
