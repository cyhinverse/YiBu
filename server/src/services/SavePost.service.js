import SavePost from "../models/mongodb/SavePosts.js";
import Post from "../models/mongodb/Posts.js";
import Notification from "../models/mongodb/Notifications.js";

class SavePostService {
  async savePost(userId, postId) {
    // Kiểm tra post có tồn tại không
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Bài viết không tồn tại");
    }

    // Kiểm tra đã save chưa
    const existingSave = await SavePost.findOne({
      user: userId,
      post: postId,
    });

    if (existingSave) {
      throw new Error("Bài viết đã được lưu trước đó");
    }

    // Lưu bài viết
    const savedPost = await SavePost.create({ user: userId, post: postId });
    await savedPost.populate({
      path: "post",
      populate: {
        path: "user",
        select: "name avatar",
      },
    });

    return { post, savedPost };
  }

  async createSaveNotification(recipientId, senderId, postId, username) {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type: "save",
      content: "đã lưu bài viết của bạn",
      post: postId,
    });

    // Gửi thông báo realtime
    await notification.populate({
      path: "sender",
      select: "username name avatar",
    });

    // Gửi thông báo đã được populate đầy đủ thông tin
    await notification.populate({
      path: "post",
      select: "caption media",
    });

    // Tạo object thông báo đầy đủ thông tin để gửi qua socket
    const notificationPayload = {
      ...notification.toObject(),
      content: `${username || "Một người dùng"} đã lưu bài viết của bạn`,
    };

    return { notification, notificationPayload };
  }

  async unsavePost(userId, postId) {
    const result = await SavePost.findOneAndDelete({
      user: userId,
      post: postId,
    });

    if (!result) {
      throw new Error("Bài viết chưa được lưu");
    }

    return result;
  }

  async getSavedPosts(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const totalSavedPosts = await SavePost.countDocuments({ user: userId });

    const savedPosts = await SavePost.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "post",
        populate: {
          path: "user",
          select: "name avatar",
        },
      });

    // Lọc ra những bài post không null
    const validPosts = savedPosts
      .map((sp) => sp.post)
      .filter((post) => post !== null);

    return {
      validPosts,
      pagination: {
        page,
        limit,
        totalSavedPosts,
        totalPages: Math.ceil(totalSavedPosts / limit),
        hasMore: page < Math.ceil(totalSavedPosts / limit),
      },
    };
  }

  async checkSavedStatus(userId, postId) {
    const savedPost = await SavePost.findOne({
      user: userId,
      post: postId,
    });

    return !!savedPost;
  }
}

export default new SavePostService();
