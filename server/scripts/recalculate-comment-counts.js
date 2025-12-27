import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env.development') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function recalculateCommentCounts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!\n');

    const postsCollection = mongoose.connection.db.collection('Posts');
    const commentsCollection = mongoose.connection.db.collection('Comments');

    console.log('Fetching all posts...');
    const posts = await postsCollection.find({ isDeleted: false }).toArray();
    console.log(
      `Found ${posts.length} active posts. Starting recalculation...`
    );

    let updatedCount = 0;

    for (const post of posts) {
      // Count non-deleted and approved comments for this post
      const actualCommentCount = await commentsCollection.countDocuments({
        post: post._id,
        isDeleted: false,
        'moderation.status': 'approved',
      });

      if (post.commentsCount !== actualCommentCount) {
        process.stdout.write(
          `Fixing Post ${post._id}: ${post.commentsCount} -> ${actualCommentCount}\n`
        );
        await postsCollection.updateOne(
          { _id: post._id },
          { $set: { commentsCount: actualCommentCount } }
        );
        updatedCount++;
      } else {
        process.stdout.write('.');
      }
    }

    console.log(`\n\nRecalculation complete!`);
    console.log(`Total posts processed: ${posts.length}`);
    console.log(`Posts updated with new counts: ${updatedCount}`);

    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Error during recalculation:', error);
    process.exit(1);
  }
}

recalculateCommentCounts();
