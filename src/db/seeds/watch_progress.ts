import { db } from '@/db';
import { watchProgress } from '@/db/schema';

async function main() {
    const sampleWatchProgress = [
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 693134,
            currentTime: 2700, // 45 minutes in seconds
            totalDuration: 9900, // 165 minutes in seconds
            progressPercentage: 27.0,
            lastWatchedAt: new Date('2024-01-20T19:30:00').toISOString(),
            completed: false,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 872585,
            currentTime: 5400, // 90 minutes in seconds
            totalDuration: 10800, // 180 minutes in seconds
            progressPercentage: 50.0,
            lastWatchedAt: new Date('2024-01-18T21:15:00').toISOString(),
            completed: false,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 603692,
            currentTime: 1800, // 30 minutes in seconds
            totalDuration: 10140, // 169 minutes in seconds
            progressPercentage: 18.0,
            lastWatchedAt: new Date('2024-01-25T20:45:00').toISOString(),
            completed: false,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 385687,
            currentTime: 7200, // 120 minutes in seconds
            totalDuration: 8460, // 141 minutes in seconds
            progressPercentage: 85.0,
            lastWatchedAt: new Date('2024-01-15T22:30:00').toISOString(),
            completed: true,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 447365,
            currentTime: 4500, // 75 minutes in seconds
            totalDuration: 9000, // 150 minutes in seconds
            progressPercentage: 50.0,
            lastWatchedAt: new Date('2024-01-22T19:00:00').toISOString(),
            completed: false,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 934433,
            currentTime: 900, // 15 minutes in seconds
            totalDuration: 7380, // 123 minutes in seconds
            progressPercentage: 12.0,
            lastWatchedAt: new Date('2024-01-26T21:45:00').toISOString(),
            completed: false,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 335977,
            currentTime: 8400, // 140 minutes in seconds
            totalDuration: 9240, // 154 minutes in seconds
            progressPercentage: 91.0,
            lastWatchedAt: new Date('2024-01-12T20:15:00').toISOString(),
            completed: true,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 298618,
            currentTime: 3600, // 60 minutes in seconds
            totalDuration: 8640, // 144 minutes in seconds
            progressPercentage: 42.0,
            lastWatchedAt: new Date('2024-01-24T18:30:00').toISOString(),
            completed: false,
        },
    ];

    await db.insert(watchProgress).values(sampleWatchProgress);
    
    console.log('✅ Watch progress seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});