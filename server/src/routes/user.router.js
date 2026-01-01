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

/* GET /search - Search users */
router.get(
  '/search',
  validateQuery(searchUsersQuery),
  UserController.searchUsers
);
/* GET /suggestions - Get recommended users */
router.get(
  '/suggestions',
  validateQuery(suggestionsQuery),
  UserController.getRecommendedUsers
);

/* GET /profile/:id - Get profile by user ID or username */
router.get(
  '/profile/:id',
  validateParams(profileIdParam),
  UserController.GET_PROFILE_BY_ID
);
/* PUT /profile - Update user profile settings */
router.put(
  '/profile',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  validateBody(updateProfileBody),
  UserController.updateProfileSettings
);

/* GET /check-follow/:targetUserId - Check follow status */
router.get(
  '/check-follow/:targetUserId',
  validateParams(targetUserIdParam),
  UserController.checkFollowStatus
);
/* POST /follow - Follow a user */
router.post('/follow', validateBody(followBody), UserController.followUser);
/* POST /unfollow - Unfollow a user */
router.post(
  '/unfollow',
  validateBody(unfollowBody),
  UserController.unfollowUser
);
/* GET /followers/:userId - Get followers list */
router.get(
  '/followers/:userId',
  validateParams(userIdParam),
  validateQuery(followListQuery),
  UserController.getFollowers
);
/* GET /following/:userId - Get following list */
router.get(
  '/following/:userId',
  validateParams(userIdParam),
  validateQuery(followListQuery),
  UserController.getFollowing
);

/* GET /follow-requests - Get pending follow requests */
router.get('/follow-requests', UserController.getPendingFollowRequests);
/* POST /follow-requests/:requestId/accept - Accept a follow request */
router.post(
  '/follow-requests/:requestId/accept',
  validateParams(requestIdParam),
  UserController.acceptFollowRequest
);
/* POST /follow-requests/:requestId/reject - Reject a follow request */
router.post(
  '/follow-requests/:requestId/reject',
  validateParams(requestIdParam),
  UserController.rejectFollowRequest
);

/* GET /blocked - Get list of blocked users */
router.get('/blocked', UserController.getBlockList);
/* POST /block/:userId - Block a user */
router.post(
  '/block/:userId',
  validateParams(blockMuteUserIdParam),
  UserController.blockUser
);
/* DELETE /block/:userId - Unblock a user */
router.delete(
  '/block/:userId',
  validateParams(blockMuteUserIdParam),
  UserController.unblockUser
);

/* GET /muted - Get list of muted users */
router.get('/muted', UserController.getMuteList);
/* POST /mute/:userId - Mute a user */
router.post(
  '/mute/:userId',
  validateParams(blockMuteUserIdParam),
  UserController.muteUser
);
/* DELETE /mute/:userId - Unmute a user */
router.delete(
  '/mute/:userId',
  validateParams(blockMuteUserIdParam),
  UserController.unmuteUser
);

/* GET /:id - Get user by ID */
router.get(
  '/:id',
  validateParams(getUserByIdParam),
  UserController.Get_User_By_Id
);

export default router;
