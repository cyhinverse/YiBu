require('dotenv').config();
const mongoose = require('mongoose');

// Define simplified schemas/models to avoid loading entire app context
const UserSchema = new mongoose.Schema(
  {
    username: String,
    followersCount: Number,
    followingCount: Number,
  },
  { collection: 'Users' }
);

const FollowSchema = new mongoose.Schema(
  {
    follower: mongoose.Types.ObjectId,
    following: mongoose.Types.ObjectId,
    status: String,
  },
  { collection: 'Follows' }
);

const User = mongoose.model('User', UserSchema);
const Follow = mongoose.model('Follow', FollowSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Find users with counts > 0
    const users = await User.find({
      $or: [{ followersCount: { $gt: 0 } }, { followingCount: { $gt: 0 } }],
    }).limit(5);

    console.log(`Found ${users.length} users with counts > 0`);

    for (const user of users) {
      console.log(`\nChecking User: ${user.username} (${user._id})`);
      console.log(
        `Counts: Followers=${user.followersCount}, Following=${user.followingCount}`
      );

      if (user.followersCount > 0) {
        const followers = await Follow.find({ following: user._id });
        console.log(`Actual Follower Docs found: ${followers.length}`);

        if (followers.length === 0) {
          console.error(
            '!!! MISMATCH: Followers count > 0 but no documents found'
          );
        } else {
          console.log('Sample follower doc:', followers[0]);
        }
      }

      if (user.followingCount > 0) {
        const following = await Follow.find({ follower: user._id });
        console.log(`Actual Following Docs found: ${following.length}`);

        if (following.length === 0) {
          console.error(
            '!!! MISMATCH: Following count > 0 but no documents found'
          );
        } else {
          console.log('Sample following doc:', following[0]);
        }
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
