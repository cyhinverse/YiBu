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

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!\n');

    const users = await mongoose.connection.db
      .collection('users')
      .find({})
      .limit(20)
      .toArray();

    console.log('Users in database:');
    console.log('='.repeat(80));
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}`);
      console.log(`   ID: ${u._id}`);
      console.log(`   isAdmin: ${u.isAdmin || false}`);
      console.log('');
    });

    // Nếu muốn set một user thành admin, uncomment và thay email
    // const email = 'your-email@example.com';
    // const result = await mongoose.connection.db.collection('users').updateOne(
    //   { email },
    //   { $set: { isAdmin: true } }
    // );
    // console.log(`Updated ${result.modifiedCount} user(s)`);

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
