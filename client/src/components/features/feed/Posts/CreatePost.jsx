import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Image, Smile, PenSquare } from 'lucide-react';
import ModelPost from './ModelPost';

const CreatePost = () => {
  const [showModal, setShowModal] = useState(false);
  const { user } = useSelector(state => state.auth);

  const avatarUrl =
    user?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${
      user?.username || 'default'
    }`;

  return (
    <>
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
        <div className="flex gap-3">
          {/* Avatar */}
          <img
            src={avatarUrl}
            alt={user?.fullName || user?.username || 'User'}
            className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700 flex-shrink-0"
          />

          {/* Input Area */}
          <div className="flex-1">
            {/* Placeholder */}
            <div
              onClick={() => setShowModal(true)}
              className="min-h-[44px] flex items-center cursor-pointer rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-4 transition-colors"
            >
              <span className="text-neutral-400 text-sm">
                What's on your mind?
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs text-neutral-500 hover:text-black dark:hover:text-white"
                >
                  <Image size={16} />
                  <span className="hidden sm:inline">Media</span>
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs text-neutral-500 hover:text-black dark:hover:text-white"
                >
                  <Smile size={16} />
                  <span className="hidden sm:inline">Feeling</span>
                </button>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                <PenSquare size={14} />
                <span>Post</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && <ModelPost closeModal={() => setShowModal(false)} />}
    </>
  );
};

export default CreatePost;
