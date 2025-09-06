import { db } from '@/db';
import { streamingUserStats } from '@/db/schema';

async function main() {
    const today = new Date();
    const threeMonthsAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));

    const sampleUserStats = [
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            totalMoviesWatched: 25,
            totalWatchTimeMinutes: 2400,
            favoriteGenre: 'Action',
            kurdishMoviesWatched: 12,
            internationalMoviesWatched: 13,
            streakDays: 7,
            lastActivityDate: today.toISOString().split('T')[0],
            createdAt: threeMonthsAgo.toISOString(),
            updatedAt: today.toISOString(),
        }
    ];

    await db.insert(streamingUserStats).values(sampleUserStats);
    
    console.log('✅ Streaming user stats seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});