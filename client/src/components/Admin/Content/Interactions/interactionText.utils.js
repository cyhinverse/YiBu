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
