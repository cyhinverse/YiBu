import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hashtag from './src/models/Hashtag.js';

dotenv.config({ path: '.env.development' });

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/yibu';

const INITIAL_HASHTAGS = [
  { name: 'technology', category: 'technology', baseUsage: 1200 },
  { name: 'coding', category: 'technology', baseUsage: 850 },
  { name: 'fitness', category: 'health', baseUsage: 700 },
  { name: 'travel', category: 'travel', baseUsage: 950 },
  { name: 'foodie', category: 'food', baseUsage: 600 },
  { name: 'music', category: 'music', baseUsage: 1100 },
  { name: 'gaming', category: 'gaming', baseUsage: 1300 },
  { name: 'art', category: 'art', baseUsage: 500 },
  { name: 'ai', category: 'technology', baseUsage: 2000 },
  { name: 'nature', category: 'travel', baseUsage: 450 },
];

const simulate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    // 1. Seed initial hashtags if they don't exist
    for (const data of INITIAL_HASHTAGS) {
      const existing = await Hashtag.findOne({ name: data.name });
      if (!existing) {
        console.log(`Seeding #${data.name}...`);
        await Hashtag.create({
          name: data.name,
          category: data.category,
          totalUsage: data.baseUsage,
          recentUsage: {
            lastHour: Math.floor(data.baseUsage / 24),
            last24Hours: data.baseUsage,
            last7Days: data.baseUsage * 7,
            updatedAt: new Date(),
          },
          trendingScore: data.baseUsage,
        });
      }
    }

    console.log('Simulation started. Press Ctrl+C to stop.');

    // 2. Continuous simulation loop
    while (true) {
      const delay = 3000 + Math.random() * 4000; // Random delay between 3-7s
      await new Promise(resolve => setTimeout(resolve, delay));

      // Randomly pick 1-3 hashtags to "boost"
      const count = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...INITIAL_HASHTAGS].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);

      for (const item of selected) {
        const increment = Math.floor(Math.random() * 50) + 10;

        await Hashtag.findOneAndUpdate(
          { name: item.name },
          {
            $inc: {
              totalUsage: increment,
              'recentUsage.lastHour': increment,
              'recentUsage.last24Hours': increment,
            },
            $set: { 'recentUsage.updatedAt': new Date() },
          },
          { new: true }
        ).then(h => {
          if (h) {
            h.calculateTrendingScore();
            h.save();
            console.log(
              `[${new Date().toLocaleTimeString()}] Updated #${
                h.name
              }: +${increment} posts (Total: ${h.totalUsage}, Score: ${
                h.trendingScore
              })`
            );
          }
        });
      }
    }
  } catch (error) {
    console.error('Simulation error:', error);
    process.exit(1);
  }
};

simulate();
