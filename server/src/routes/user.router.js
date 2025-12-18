import express from 'express';
import UserController from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multerUpload.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware.js';
import {
  searchUsersQuery,
  suggestionsQuery,
  profileIdParam,
  updateProfileBody,
  targetUserIdParam,
  followBody,
  unfollowBody,
  userIdParam,
  followListQuery,
  requestIdParam,
  blockMuteUserIdParam,
  updatePrivacyBody,
  updateNotificationBody,
  updateSecurityBody,
  updateContentBody,
  updateThemeBody,
  addDeviceBody,
  deviceIdParam,
  getUserByIdParam,
} from '../validations/user.validation.js';

const router = express.Router();

router.use(verifyToken);

// ======================================
// Search & Discovery
// ======================================
router.get(
  '/search',
  validateQuery(searchUsersQuery),
  UserController.searchUsers
);
router.get(
  '/suggestions',
  validateQuery(suggestionsQuery),
  UserController.getRecommendedUsers
);

// ======================================
// User Profile
// ======================================
router.get(
  '/profile/:id',
  validateParams(profileIdParam),
  UserController.GET_PROFILE_BY_ID
);
router.put(
  '/profile',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  validateBody(updateProfileBody),
  UserController.updateProfileSettings
);

// ======================================
// Follow System
// ======================================
router.get(
  '/check-follow/:targetUserId',
  validateParams(targetUserIdParam),
  UserController.checkFollowStatus
);
router.post('/follow', validateBody(followBody), UserController.followUser);
router.post(
  '/unfollow',
  validateBody(unfollowBody),
  UserController.unfollowUser
);
router.get(
  '/followers/:userId',
  validateParams(userIdParam),
  validateQuery(followListQuery),
  UserController.getFollowers
);
router.get(
  '/following/:userId',
  validateParams(userIdParam),
  validateQuery(followListQuery),
  UserController.getFollowing
);

// Follow Requests (for private accounts)
router.get('/follow-requests', UserController.getPendingFollowRequests);
router.post(
  '/follow-requests/:requestId/accept',
  validateParams(requestIdParam),
  UserController.acceptFollowRequest
);
router.post(
  '/follow-requests/:requestId/reject',
  validateParams(requestIdParam),
  UserController.rejectFollowRequest
);

// ======================================
// Block & Mute
// ======================================
router.get('/blocked', UserController.getBlockList);
router.post(
  '/block/:userId',
  validateParams(blockMuteUserIdParam),
  UserController.blockUser
);
router.delete(
  '/block/:userId',
  validateParams(blockMuteUserIdParam),
  UserController.unblockUser
);

router.get('/muted', UserController.getMuteList);
router.post(
  '/mute/:userId',
  validateParams(blockMuteUserIdParam),
  UserController.muteUser
);
router.delete(
  '/mute/:userId',
  validateParams(blockMuteUserIdParam),
  UserController.unmuteUser
);

// ======================================
// User Settings
// ======================================
// User Settings & Devices moved to separate router (/api/settings)

// ======================================
// User Detail (keep last)
// ======================================
router.get(
  '/:id',
  validateParams(getUserByIdParam),
  UserController.Get_User_By_Id
);

export default router;
