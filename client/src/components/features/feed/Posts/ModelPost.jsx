import { useState, useRef, lazy, Suspense } from 'react';
const EmojiPicker = lazy(() => import('emoji-picker-react'));
import { useSelector } from 'react-redux';
import { Image, X, Smile, Sparkles, Send, Video, Hash } from 'lucide-react';
import {
  useCreatePost,
  useUpdatePost,
  useTrendingHashtags,
} from '@/hooks/usePostsQuery';
import { PRIVACY_OPTIONS } from '@/constants/privacy';

const ModelPost = ({ closeModal, editPost = null }) => {
  const { user: authUser } = useSelector(state => state.auth);
  const currentUser = authUser?.user || authUser;

  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();

  const createLoading =
    createPostMutation.isPending || updatePostMutation.isPending;

  const [caption, setCaption] = useState(editPost?.caption || '');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState(editPost?.media || []);
  const [selectedImage, setSelectedImage] = useState(null);
  const [privacy, setPrivacy] = useState(editPost?.privacy || 'public');
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const onEmojiClick = emojiObject => {
    setCaption(prev => prev + emojiObject.emoji);
  };

  const avatarUrl =
    currentUser?.avatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${
      currentUser?.username || 'default'
    }`;
  const currentPrivacy = PRIVACY_OPTIONS.find(p => p.value === privacy);

  const handleMediaChange = event => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Store actual files for upload
    setMediaFiles(prev => [...prev, ...files]);
    event.target.value = '';
  };

  const removeMedia = (index, isExisting) => {
    if (isExisting) {
      setExistingMedia(prev => prev.filter((_, i) => i !== index));
    } else {
      setMediaFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handlePost = async () => {
    if (!caption.trim() && mediaFiles.length === 0) return;

    const formData = new FormData();
    formData.append('caption', caption.trim());
    formData.append('visibility', privacy);

    // Append existing media as JSON string
    formData.append('existingMedia', JSON.stringify(existingMedia));

    // Append all media files - use 'files' to match multer config
    mediaFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      if (editPost) {
        await updatePostMutation.mutateAsync({
          postId: editPost._id,
          data: formData,
        });
      } else {
        await createPostMutation.mutateAsync(formData);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const canPost =
    caption.trim() || mediaFiles.length > 0 || existingMedia.length > 0;

  // Combine media for preview
  const allMedia = [
    ...existingMedia.map(m => ({ ...m, isExisting: true })),
    ...mediaFiles.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
      isExisting: false,
      file: f,
    })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[8vh] px-4 overflow-y-auto"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={closeModal}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} className="text-neutral-400" />
          </button>
          <h2 className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
            <Sparkles size={14} className="text-neutral-500" />
            {editPost ? 'Edit Post' : 'Create Post'}
          </h2>
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* Avatar */}
            <img
              src={avatarUrl}
              alt={currentUser?.fullName || currentUser?.username || 'User'}
              className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700 flex-shrink-0"
            />

            {/* Editor */}
            <div className="flex-1 min-w-0">
              {/* User info */}
              <div className="mb-2">
                <p className="font-semibold text-black dark:text-white text-sm">
                  {currentUser?.fullName || currentUser?.username || 'User'}
                </p>
                {/* Privacy selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                    className="flex items-center gap-1.5 px-2.5 py-1 mt-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {currentPrivacy && <currentPrivacy.icon size={12} />}
                    <span>{currentPrivacy?.label}</span>
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                      <path d="M3.543 8.96l1.414-1.42L12 14.59l7.043-7.05 1.414 1.42L12 17.41 3.543 8.96z" />
                    </svg>
                  </button>

                  {/* Privacy dropdown */}
                  {showPrivacyMenu && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10 py-1">
                      {PRIVACY_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setPrivacy(option.value);
                            setShowPrivacyMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                            privacy === option.value
                              ? 'bg-neutral-100 dark:bg-neutral-700'
                              : ''
                          }`}
                        >
                          <option.icon size={16} className="text-neutral-500" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-black dark:text-white">
                              {option.label}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {option.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Text area */}
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 bg-transparent text-content dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none outline-none text-base"
                autoFocus
              />

              {/* Hashtag suggestions */}
              <HashtagSuggestions caption={caption} setCaption={setCaption} />

              {/* Media previews */}
              {allMedia.length > 0 && (
                <div
                  className={`mt-3 rounded-xl overflow-hidden ${
                    allMedia.length > 1 ? 'grid gap-1' : ''
                  } ${allMedia.length === 2 ? 'grid-cols-2' : ''} ${
                    allMedia.length >= 3 ? 'grid-cols-2' : ''
                  }`}
                >
                  {allMedia.map((preview, index) => (
                    <div
                      key={index}
                      className={`relative ${
                        allMedia.length === 1
                          ? 'max-h-[350px]'
                          : 'aspect-square'
                      } ${
                        allMedia.length === 3 && index === 0 ? 'row-span-2' : ''
                      }`}
                    >
                      <button
                        onClick={() =>
                          removeMedia(
                            preview.isExisting
                              ? index
                              : index - existingMedia.length,
                            preview.isExisting
                          )
                        }
                        className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-lg hover:bg-black/80 transition-colors"
                      >
                        <X size={14} />
                      </button>
                      {preview.type === 'video' ? (
                        <video
                          src={preview.url}
                          className={`w-full h-full object-cover rounded-xl ${
                            allMedia.length === 1 ? 'max-h-[350px]' : ''
                          }`}
                          controls
                        />
                      ) : (
                        <img
                          src={preview.url || preview}
                          alt="Preview"
                          className={`w-full h-full object-cover cursor-pointer rounded-xl ${
                            allMedia.length === 1 ? 'max-h-[350px]' : ''
                          }`}
                          onClick={() =>
                            setSelectedImage(preview.url || preview)
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-200 dark:bg-neutral-800 mx-4" />

        {/* Action bar */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Media icons */}
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleMediaChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
            >
              <Image
                size={18}
                className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
              />
            </button>
            <button
              onClick={() => {
                fileInputRef.current.accept = 'video/*';
                fileInputRef.current?.click();
              }}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
            >
              <Video
                size={18}
                className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
              />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
              >
                <Smile
                  size={18}
                  className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
                />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-20">
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <div className="relative z-20 shadow-2xl rounded-xl">
                    <Suspense
                      fallback={
                        <div className="w-[300px] h-[400px] bg-white dark:bg-neutral-800 animate-pulse rounded-xl" />
                      }
                    >
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        theme={
                          localStorage.getItem('theme') === 'dark'
                            ? 'dark'
                            : 'light'
                        }
                        lazyLoadEmojis={true}
                        width={300}
                        height={400}
                      />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Character count & Post button */}
          <div className="flex items-center gap-3">
            {caption.length > 0 && (
              <span
                className={`text-xs ${
                  caption.length > 280 ? 'text-red-500' : 'text-neutral-400'
                }`}
              >
                {caption.length}/280
              </span>
            )}
            <button
              onClick={handlePost}
              disabled={createLoading || !canPost}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                canPost && !createLoading
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {createLoading ? (
                <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={14} />
                  <span>{editPost ? 'Update' : 'Post'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full image preview modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full Preview"
            className="max-w-[90vw] max-h-[90vh] rounded-xl"
          />
          <button
            className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white p-2.5 rounded-xl hover:bg-white/20 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

const HashtagSuggestions = ({ caption, setCaption }) => {
  const { data: trendingHashtags } = useTrendingHashtags();

  const hashtags = Array.isArray(trendingHashtags)
    ? trendingHashtags
    : trendingHashtags?.data || [];

  const handleHashtagClick = tag => {
    const hashtag = `#${tag} `;
    if (!caption.includes(hashtag)) {
      setCaption(prev => prev.trim() + (prev.trim() ? ' ' : '') + hashtag);
    }
  };

  if (!hashtags || hashtags.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-neutral-400">
        <Hash size={12} />
        <span>Trending now</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {hashtags.slice(0, 6).map(tag => (
          <button
            key={tag._id}
            onClick={() => handleHashtagClick(tag.name)}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
          >
            #{tag.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelPost;
