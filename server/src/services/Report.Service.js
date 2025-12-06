import Report from "../models/Report.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { getPaginationResponse } from "../helpers/pagination.js";

class ReportService {
  static async createReport(reporterId, data) {
    const { type, targetId, reason, additionalInfo, content } = data;

    // Validate report type
    if (!["post", "comment", "user"].includes(type)) {
      const error = new Error("Invalid report type. Must be 'post', 'comment', or 'user'.");
      error.statusCode = 400;
      throw error;
    }

    // Validate target existence
    let targetExists = false;
    let parentPostId = null;

    switch (type) {
      case "post":
        targetExists = await Post.exists({ _id: targetId });
        break;
      case "comment":
        const comment = await Comment.findById(targetId);
        if (comment) {
          targetExists = true;
          parentPostId = comment.post;
        }
        break;
      case "user":
        targetExists = await User.exists({ _id: targetId });
        break;
    }

    if (!targetExists) {
      const error = new Error(`The reported ${type} does not exist.`);
      error.statusCode = 404;
      throw error;
    }

    const newReport = new Report({
      reporter: reporterId,
      reportType: type,
      targetId,
      reason,
      additionalInfo,
      content,
      parentPostId,
      status: "pending",
      createdAt: new Date(),
    });

    await newReport.save();
    return newReport;
  }

  static async getAllReports(query, page, limit, skip) {
    const { status, type } = query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.reportType = type;

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reporter", "name email profile.avatar")
      .exec();

    const totalReports = await Report.countDocuments(filter);
    
    // Return raw data usually, but since we have a pagination helper that takes {data, total, page, limit}
    // and returns {data, pagination}, we can prepare that here or return raw and let controller format.
    // To match pattern: return { reports, totalReports }
    
    return { reports, totalReports };
  }

  static async getReportById(reportId, userId, isAdmin) {
    const report = await Report.findById(reportId)
      .populate("reporter", "name email profile.avatar")
      .populate("actions.admin", "name email profile.avatar")
      .exec();

    if (!report) {
      const error = new Error("Report not found");
      error.statusCode = 404;
      throw error;
    }

    if (!isAdmin && report.reporter._id.toString() !== userId) {
      const error = new Error("Unauthorized. You don't have permission to view this report.");
      error.statusCode = 403;
      throw error;
    }

    let additionalDetails = {};

    switch (report.reportType) {
      case "post":
        const post = await Post.findById(report.targetId)
          .populate("user", "name email profile.avatar")
          .exec();
        if (post) additionalDetails.postDetails = post;
        break;
      case "comment":
        const comment = await Comment.findById(report.targetId)
          .populate("user", "name email profile.avatar")
          .populate("post", "caption mediaUrl")
          .exec();
        if (comment) additionalDetails.commentDetails = comment;
        break;
      case "user":
        const user = await User.findById(report.targetId)
          .select("name email profile.avatar createdAt")
          .exec();
        if (user) additionalDetails.userDetails = user;
        break;
    }

    return { ...report.toObject(), ...additionalDetails };
  }

  static async getReportsByUser(userId, requesterId, isAdmin, page, limit, skip) {
    if (!isAdmin && requesterId !== userId) {
      const error = new Error("Unauthorized. You don't have permission to view these reports.");
      error.statusCode = 403;
      throw error;
    }

    const reports = await Report.find({ reporter: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalReports = await Report.countDocuments({ reporter: userId });

    return { reports, totalReports };
  }

  static async updateReportStatus(reportId, status, notes, adminId) {
    if (!["pending", "resolved", "dismissed", "escalated"].includes(status)) {
      const error = new Error("Invalid status.");
      error.statusCode = 400;
      throw error;
    }

    const report = await Report.findById(reportId);
    if (!report) {
      const error = new Error("Report not found");
      error.statusCode = 404;
      throw error;
    }

    report.status = status;
    report.actions.push({
      type: status === "resolved" ? "resolve" : status === "dismissed" ? "dismiss" : "update",
      admin: adminId,
      time: new Date(),
      comment: notes || `Report marked as ${status}`,
    });

    await report.save();
    return report;
  }

  static async addReportComment(reportId, comment, adminId) {
    if (!comment || comment.trim() === "") {
        throw new Error("Comment cannot be empty");
    }

    const report = await Report.findById(reportId);
    if (!report) {
      const error = new Error("Report not found");
      error.statusCode = 404;
      throw error;
    }

    report.actions.push({
      type: "comment",
      admin: adminId,
      time: new Date(),
      comment,
    });

    await report.save();
    return report;
  }
}

export default ReportService;
