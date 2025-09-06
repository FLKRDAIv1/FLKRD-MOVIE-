import { db } from '@/db';
import { userStats } from '@/db/schema';

async function main() {
    const sampleUserStats = [
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            totalMoviesWatched: 15,
            totalWatchTime: 82800, // 23 hours in seconds
            favoriteGenre: 'Action',
            createdAt: new Date('2024-01-15T10:30:00.000Z').toISOString(),
            updatedAt: new Date('2024-01-15T10:30:00.000Z').toISOString(),
        }
    ];

    await db.insert(userStats).values(sampleUserStats);
    
    console.log('✅ User stats seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});