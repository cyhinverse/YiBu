/**
 * Get interaction text based on type
 * @param {string} type - Interaction type ('like' | 'comment' | 'share' | 'follow' | 'save')
 * @returns {string} Interaction text in Vietnamese
 */
export const getInteractionText = type => {
  switch (type) {
    case 'like':
      return 'đã thích';
    case 'comment':
      return 'đã bình luận';
    case 'share':
      return 'đã chia sẻ';
    case 'follow':
      return 'đã theo dõi';
    case 'save':
      return 'đã lưu';
    default:
      return 'tương tác';
  }
};
