import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

import UserService from "./User.Service.js";
import PostService from "./Post.Service.js";

class AdminService {
  // --- Dashboard & Analytics ---
  static async getDashboardStats(timeRange = "week") {
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case "day": startDate = new Date(now.setDate(now.getDate() - 1)); break;
      case "week": startDate = new Date(now.setDate(now.getDate() - 7)); break;
      case "month": startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
      case "year": startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
      default: startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const [
      totalUsers, totalPosts, totalComments,
      newUsers, newPosts, newComments, bannedUsers
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Post.countDocuments({ createdAt: { $gte: startDate } }),
      Comment.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ "moderation.isBanned": true }),
    ]);

    return {
      users: { total: totalUsers, new: newUsers, active: totalUsers - bannedUsers, banned: bannedUsers },
      content: { posts: totalPosts, newPosts: newPosts, comments: totalComments, newComments: newComments },
    };
  }

  static async getRecentActivities(limit = 10) {
    const [recentUsers, recentPosts, recentComments] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(limit).select("-password"),
      Post.find().sort({ createdAt: -1 }).limit(limit).populate("user", "username name avatar"),
      Comment.find().sort({ createdAt: -1 }).limit(limit).populate("user", "username name avatar"),
    ]);

    const allActivities = [
      ...recentUsers.map(u => ({ type: "user", data: u, createdAt: u.createdAt })),
      ...recentPosts.map(p => ({ type: "post", data: p, createdAt: p.createdAt })),
      ...recentComments.map(c => ({ type: "comment", data: c, createdAt: c.createdAt })),
    ];
    
    return allActivities.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  static async getInteractionStats(timeRange = "week") {
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case "day": startDate = new Date(now.setDate(now.getDate() - 1)); break;
      case "week": startDate = new Date(now.setDate(now.getDate() - 7)); break;
      case "month": startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
      default: startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const [commentsCount, totalPosts] = await Promise.all([
      Comment.countDocuments({ createdAt: { $gte: startDate } }),
      Post.countDocuments({ createdAt: { $gte: startDate } }),
    ]);

    return {
      comments: commentsCount,
      posts: totalPosts,
      estimatedViews: totalPosts * 10,
      estimatedLikes: Math.floor(totalPosts * 4.5),
      timeRange,
    };
  }
  // --- Interaction Management ---
  static async getInteractionTimeline(timeRange = "week") {
    // Mock/Aggregation for timeline
    const now = new Date();
    const timeline = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        timeline.push({
            date: date.toISOString().split('T')[0],
            likes: Math.floor(Math.random() * 50),
            comments: Math.floor(Math.random() * 20),
            posts: Math.floor(Math.random() * 5)
        });
    }
    return timeline.reverse();
  }

  static async getUserInteractions(query, skip, limit) {
      // Return users sorted by activity (mock or reuse getAllUsers logic with sort)
      // For now, reuse basic user fetch but implied sorting by interactions could be added later
     return this.getAllUsers(query, skip, limit);
  }

  static async removeInteraction(interactionId) {
     // Generic removal? Probably Comment or Post. 
     // For now check Comment first then Post? Or Log?
     // Since this is ambiguous, valid strategy is to return true if ID format valid.
     const comment = await Comment.findByIdAndDelete(interactionId);
     if (comment) return { type: 'comment', id: interactionId };
     
     const post = await Post.findByIdAndDelete(interactionId);
     if (post) return { type: 'post', id: interactionId };

     throw new Error("Interaction not found");
  }

  static async getInteractionTypes() {
      return ["like", "comment", "post", "share", "save"];
  }

  // --- User Management ---
  static async getAllUsers(query, skip, limit) {
    const filter = {};
    if (query.search) {
      filter.$or = [
        { username: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
        { name: { $regex: query.search, $options: "i" } },
      ];
    }
    if (query.isBanned === "true") filter["moderation.isBanned"] = true;
    if (query.isBanned === "false") filter["moderation.isBanned"] = false;

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);
    return { users, total };
  }

  static async getUserDetails(userId) {
    const user = await User.findById(userId).select("-password").populate("profile");
    if (!user) throw new Error("User not found");
    return user;
  }

  static async updateUser(userId, updates) {
    delete updates.password;
    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select("-password");
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  // --- Ban & Flag Management ---
  static async banUser(userId, reason, duration, adminId) {
    let banExpiration = null;
    if (duration && duration > 0) {
      banExpiration = new Date();
      banExpiration.setDate(banExpiration.getDate() + parseInt(duration));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        "moderation.isBanned": true,
        "moderation.banReason": reason || "Violated community guidelines",
        "moderation.banExpiration": banExpiration,
        $push: { "moderation.banHistory": { action: "ban", reason: reason || "Violated community guidelines", duration: duration || null, performedBy: adminId } }
      },
      { new: true }
    ).select("-password");

    if (!user) throw new Error("User not found");
    return user;
  }

  static async unbanUser(userId, adminId) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        "moderation.isBanned": false,
        "moderation.banReason": "",
        "moderation.banExpiration": null,
        $push: { "moderation.banHistory": { action: "unban", performedBy: adminId } }
      },
      { new: true }
    ).select("-password");
    if (!user) throw new Error("User not found");
    return user;
  }

  static async getBannedAccounts(skip, limit) {
    const [users, total] = await Promise.all([
      User.find({ "moderation.isBanned": true }).select("-password").skip(skip).limit(limit).sort({ updatedAt: -1 }),
      User.countDocuments({ "moderation.isBanned": true }),
    ]);
    return { users, total };
  }

  static async getBanHistory(userId) {
    const user = await User.findById(userId).select("moderation.banHistory username");
    if (!user) throw new Error("User not found");
    return user.moderation.banHistory;
  }

  static async extendBan(userId, duration, adminId) {
    const user = await User.findById(userId);
    if (!user || (!user.moderation || !user.moderation.isBanned)) {
      throw new Error("User not found or not banned");
    }

    let newExpiration = new Date(user.moderation.banExpiration || Date.now());
    newExpiration.setDate(newExpiration.getDate() + parseInt(duration));

    user.moderation.banExpiration = newExpiration;
    user.moderation.banHistory.push({ action: "extend", duration, performedBy: adminId });
    await user.save();
    return newExpiration;
  }

  static async temporaryUnban(userId, duration, reason, adminId) {
    const user = await User.findById(userId);
    if (!user || (!user.moderation || !user.moderation.isBanned)) {
      throw new Error("User not found or not banned");
    }

    const tempUnbanExpiration = new Date();
    tempUnbanExpiration.setDate(tempUnbanExpiration.getDate() + parseInt(duration));

    user.moderation.previousBanState = {
        isBanned: user.moderation.isBanned,
        banReason: user.moderation.banReason,
        banExpiration: user.moderation.banExpiration,
    };
    
    user.moderation.isBanned = false;
    user.moderation.tempUnbanExpiration = tempUnbanExpiration;
    user.moderation.tempUnbanReason = reason;
    user.moderation.tempUnbanBy = adminId;
    user.moderation.banHistory.push({ action: "tempUnban", duration, reason, performedBy: adminId });

    await user.save();
    return { tempUnbanExpiration, isBanned: user.moderation.isBanned };
  }

  static async getSpamAccounts(skip, limit) {
     const aggregationPipeline = [
      { $lookup: { from: "Comments", localField: "_id", foreignField: "user", as: "comments" } },
      { $lookup: { from: "Posts", localField: "_id", foreignField: "user", as: "posts" } },
      {
        $addFields: {
          commentCount: { $size: "$comments" },
          postCount: { $size: "$posts" },
          riskScore: {
             $add: [
                { $cond: [{ $gt: [{ $divide: [{ $size: "$comments" }, { $add: [{ $size: "$posts" }, 1] }] }, 10] }, 50, 0] },
                { $cond: [{ $and: [{ $gt: [{ $add: [{ $size: "$comments" }, { $size: "$posts" }] }, 20] }, { $lt: [{ $subtract: [new Date(), "$createdAt"] }, 7 * 24 * 60 * 60 * 1000] }] }, 30, 0] }
             ]
          },
        },
      },
      { $match: { $or: [{ riskScore: { $gt: 30 } }, { "moderation.isBanned": true }] } },
      { $sort: { riskScore: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          id: { $toString: "$_id" },
          username: 1, email: 1, avatar: 1,
          isFlagged: { $cond: ["$moderation.isBanned", true, false] },
          riskLevel: { $cond: [{ $gt: ["$riskScore", 60] }, "high", { $cond: [{ $gt: ["$riskScore", 30] }, "medium", "low"] }] },
          suspiciousActivity: { $cond: [{ $gt: [{ $divide: [{ $size: "$comments" }, { $add: [{ $size: "$posts" }, 1] }] }, 10] }, "Excessive commenting", "Unusual pattern"] },
          detectedAt: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$updatedAt" } },
          commentCount: 1, postCount: 1,
        },
      },
    ];

    const suspiciousUsers = await User.aggregate(aggregationPipeline);
    const totalSuspicious = suspiciousUsers.length; // Approximate
    return { accounts: suspiciousUsers, total: totalSuspicious };
  }

  static async flagAccount(userId, reason, adminId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.moderation.isFlagged = true;
    user.moderation.flagReason = reason || "Suspicious activity detected";
    user.moderation.flaggedAt = new Date();
    user.moderation.flaggedBy = adminId;
    await user.save();
    return user;
  }

  // --- Post Management ---
  static async getAllPosts(query, skip, limit) {
    const filter = {};
    if (query.search) filter.caption = { $regex: query.search, $options: "i" };
    if (query.userId) filter.user = query.userId;

    const [posts, total] = await Promise.all([
      Post.find(filter).populate("user", "username name avatar").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);
    return { posts, total };
  }

  static async getPostDetails(postId) {
    const post = await Post.findById(postId)
      .populate("user", "username name avatar")
      .populate({ path: "comments", populate: { path: "user", select: "username name avatar" } });
    if (!post) throw new Error("Post not found");
    return post;
  }

  static async approvePost(postId) {
    const post = await Post.findByIdAndUpdate(postId, { approved: true }, { new: true }).populate("user", "username name avatar");
    if (!post) throw new Error("Post not found");
    return post;
  }

  // --- Comment Management ---
  static async getAllComments(query, skip, limit) {
    const filter = {};
    if (query.search) filter.content = { $regex: query.search, $options: "i" };
    if (query.postId) filter.post = query.postId;

    const [comments, total] = await Promise.all([
      Comment.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate("user", "username name avatar").populate("post", "content"),
      Comment.countDocuments(filter),
    ]);
    return { comments, total };
  }
  
  static async deleteComment(commentId) {
      // Logic could be in CommentService but convenient here. Or call CommentService (if it had deleteById)
      const comment = await Comment.findByIdAndDelete(commentId);
      if (!comment) throw new Error("Comment not found");
      return true;
  }


}

export default AdminService;
