import express from 'express';
import UserController from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multerUpload.js';
import {
  validateBody,
  validateParams,
} from '../middlewares/validation.middleware.js';
import {
  profileIdParam,
  updateProfileBody,
} from '../validations/profile.validation.js';

const router = express.Router();

router.use(verifyToken);

/* GET /:id - Get profile by user ID or username */
router.get(
  '/:id',
  validateParams(profileIdParam),
  UserController.GET_PROFILE_BY_ID
);
/* PUT / - Update user profile settings */
router.put(
  '/',
  upload.fields([{ name: 'avatar', maxCount: 1 }]),
  validateBody(updateProfileBody),
  UserController.updateProfileSettings
);

export default router;
