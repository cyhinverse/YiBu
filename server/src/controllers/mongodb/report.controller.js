import Report from "../../models/mongodb/Reports.js";
import User from "../../models/mongodb/Users.js";
import Comment from "../../models/mongodb/Comments.js";
import Post from "../../models/mongodb/Posts.js";

export const createReport = async (req, res) => {
  try {
    const { type, targetId, reason, additionalInfo, content } = req.body;
    const reporterId = req.user.id;

    // Validate report type
    if (!["post", "comment", "user"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report type. Must be 'post', 'comment', or 'user'.",
      });
    }

    // Validate that the target exists
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
      return res.status(404).json({
        success: false,
        message: `The reported ${type} does not exist.`,
      });
    }

    // Create report
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

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      report: newReport,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create report.",
      error: error.message,
    });
  }
};

export const getAllReports = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Admin access required.",
      });
    }

    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (type) query.reportType = type;

    // Get reports with pagination
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("reporter", "name email profile.avatar")
      .exec();

    // Get total count for pagination
    const totalReports = await Report.countDocuments(query);

    return res.status(200).json({
      success: true,
      reports,
      pagination: {
        totalReports,
        totalPages: Math.ceil(totalReports / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch reports.",
      error: error.message,
    });
  }
};

export const getReportById = async (req, res) => {
  try {
    const reportId = req.params.reportId;

    const report = await Report.findById(reportId)
      .populate("reporter", "name email profile.avatar")
      .populate("actions.admin", "name email profile.avatar")
      .exec();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Check if user is admin or the report creator
    if (
      !req.user.isAdmin &&
      report.reporter._id.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You don't have permission to view this report.",
      });
    }

    // Get additional details based on report type
    let additionalDetails = {};

    switch (report.reportType) {
      case "post":
        const post = await Post.findById(report.targetId)
          .populate("user", "name email profile.avatar")
          .exec();

        if (post) {
          additionalDetails = {
            postDetails: {
              caption: post.caption,
              mediaUrl: post.mediaUrl,
              user: post.user,
              createdAt: post.createdAt,
            },
          };
        }
        break;

      case "comment":
        const comment = await Comment.findById(report.targetId)
          .populate("user", "name email profile.avatar")
          .populate("post", "caption mediaUrl")
          .exec();

        if (comment) {
          additionalDetails = {
            commentDetails: {
              content: comment.content,
              user: comment.user,
              createdAt: comment.createdAt,
              post: comment.post,
            },
          };
        }
        break;

      case "user":
        const user = await User.findById(report.targetId)
          .select("name email profile.avatar createdAt")
          .exec();

        if (user) {
          additionalDetails = {
            userDetails: user,
          };
        }
        break;
    }

    return res.status(200).json({
      success: true,
      report: {
        ...report.toObject(),
        ...additionalDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch report details.",
      error: error.message,
    });
  }
};

export const getReportsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is admin or the user themselves
    if (!req.user.isAdmin && req.user.id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized. You don't have permission to view these reports.",
      });
    }

    // Get reports submitted by the user
    const reports = await Report.find({ reporter: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Get total count for pagination
    const totalReports = await Report.countDocuments({ reporter: userId });

    return res.status(200).json({
      success: true,
      reports,
      pagination: {
        totalReports,
        totalPages: Math.ceil(totalReports / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch user reports.",
      error: error.message,
    });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Admin access required.",
      });
    }

    const reportId = req.params.reportId;
    const { status, notes } = req.body;

    // Validate status
    if (!["pending", "resolved", "dismissed", "escalated"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be 'pending', 'resolved', 'dismissed', or 'escalated'.",
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Update report status
    report.status = status;

    // Add action to history
    report.actions.push({
      type:
        status === "resolved"
          ? "resolve"
          : status === "dismissed"
          ? "dismiss"
          : "update",
      admin: req.user.id,
      time: new Date(),
      comment: notes || `Report marked as ${status}`,
    });

    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report status updated to ${status}`,
      report,
    });
  } catch (error) {
    console.error("Error updating report status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update report status.",
      error: error.message,
    });
  }
};

export const addReportComment = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Admin access required.",
      });
    }

    const reportId = req.params.reportId;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty",
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Add comment to actions history
    report.actions.push({
      type: "comment",
      admin: req.user.id,
      time: new Date(),
      comment,
    });

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Comment added to report",
      report,
    });
  } catch (error) {
    console.error("Error adding comment to report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not add comment to report.",
      error: error.message,
    });
  }
};
