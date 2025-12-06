import express from "express";
import * as ReportController from "../controllers/report.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", ReportController.createReport);
router.get("/", ReportController.getAllReports);

router.get("/:reportId", ReportController.getReportById);
router.put("/:reportId/status", ReportController.updateReportStatus);
router.post("/:reportId/comment", ReportController.addReportComment);

router.get("/user/:userId", ReportController.getReportsByUser);

export default router;
