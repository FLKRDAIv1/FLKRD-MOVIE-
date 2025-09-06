import { db } from '@/db';
import { streamingWatchProgress } from '@/db/schema';

async function main() {
    const userId = 'user_2mQJ8k3L9pN4R7tS8vW1x';
    
    const sampleWatchProgress = [
        // Completed movies (3 total)
        {
            userId,
            movieId: 12,
            movieType: 'kurdish',
            progressSeconds: 6300,
            totalDurationSeconds: 6300,
            progressPercentage: 100.0,
            lastWatchedAt: new Date('2024-12-20T20:45:00Z').toISOString(),
            isCompleted: true,
            createdAt: new Date('2024-12-20T19:30:00Z').toISOString(),
            updatedAt: new Date('2024-12-20T20:45:00Z').toISOString(),
        },
        {
            userId,
            movieId: 785,
            movieType: 'tmdb',
            progressSeconds: 7800,
            totalDurationSeconds: 7800,
            progressPercentage: 100.0,
            lastWatchedAt: new Date('2024-12-18T21:20:00Z').toISOString(),
            isCompleted: true,
            createdAt: new Date('2024-12-18T19:00:00Z').toISOString(),
            updatedAt: new Date('2024-12-18T21:20:00Z').toISOString(),
        },
        {
            userId,
            movieId: 8,
            movieType: 'kurdish',
            progressSeconds: 5400,
            totalDurationSeconds: 5400,
            progressPercentage: 100.0,
            lastWatchedAt: new Date('2024-12-15T22:15:00Z').toISOString(),
            isCompleted: true,
            createdAt: new Date('2024-12-15T20:45:00Z').toISOString(),
            updatedAt: new Date('2024-12-15T22:15:00Z').toISOString(),
        },
        // In progress movies (9 total)
        {
            userId,
            movieId: 23,
            movieType: 'kurdish',
            progressSeconds: 2400,
            totalDurationSeconds: 6600,
            progressPercentage: 36.36,
            lastWatchedAt: new Date('2024-12-22T19:30:00Z').toISOString(),
            isCompleted: false,
            createdAt: new Date('2024-12-22T18:00:00Z').toISOString(),
            updatedAt: new Date('2024-12-22T19:30:00Z').toISOString(),
        },
        {
            userId,
            movieId: 642,
            movieType: 'tmdb',
            progressSeconds: 4200,
            totalDurationSeconds: 8400,
            progressPercentage: 50.0,
            lastWatchedAt: new Date('2024-12-21T20:10:00Z').toISOString(),
            isCompleted: false,
            createdAt: new Date('2024-12-21T18:45:00Z').toISOString(),
            updatedAt: new Date('2024-12-21T20:10:00Z').toISOString(),  
        },
        {
            userId,
            movieId: 17,
            movieType: 'kurdish',
            progressSeconds: 1800,
            totalDurationSeconds: 7200,
            progressPercentage: 25.0,
            lastWatchedAt: new Date('2024-12-19T21:45:00Z').toISOString(),
            isCompleted: false,
            createdAt: new Date('2024-12-19T21:15:00Z').toISOString(),
            updatedAt: new Date('2024-12-19T21:45:00Z').toISOString(),
        },
        {
            userId,
            movieId: 923,
            movieType: 'tmdb',
            progressSeconds: 5400,
            totalDurationSeconds: 9000,
            progressPercentage: 60.0,
            lastWatchedAt: new Date('2024-12-17T19:20:00Z').toISOString(),
            isCompleted: false,
            createdAt: new Date('2024-12-17T18:00:00Z').toISOString(),
            updatedAt: new Date('2024-12-17T19:20:00Z').toISOString(),
        },
        {
            userId,
            movieId: 3,
            movieType: 'kurdish',
            progressSeconds: 3600,
            totalDurationSeconds: 6000,
            progressPercentage: 60.0,
            lastWatchedAt: new Date('2024-12-16T20:30:00Z').toISOString(),
            isCompleted: false,
            createdAt: new Date('2024-12-16T19:30:00Z').toISOString(),
            updatedAt: new Date('2024-12-16T20:30:00Z').toISOString(),
        },
        {
            userId,
            movieId: 567,
            movieType: 'tmdb',
            progressSeconds: 1200,
            totalDurationSeconds: 10800,
            progressPercentage: 11.11,
            lastWatchedAt: new Date('2024-12-14T22:00:00Z').toISOString(),
            isCompleted: false,
            createdAt: new Date('2024-12-14T21:40:00Z').toISOString(),
            updatedAt: new Date('2024-12-14T22:00:00Z').toISOString(),
        },
        {
            userId,
            movieId: 21,
            movieType: 'kurdish',
            progressSeconds: 900,
            totalDurationSeconds: 5400,
            progressPercentage: 16.67,
            lastWatchedAt: new Date('2024-12-13T19:15:00Z').toISOString(),
            isCompleted: false,
            createdAt: new Date('2024-12-13T19:00:00Z').toISOString(),
            updatedAt: new Date('2024-12-13T19:15:00Z').toISOString(),
        },
        {
            userId,
            movieId: 834,
            movieType: 'tmdb',
            progressSeconds: 6300,
            totalDurationSeconds: 9900,
            progressPercentage: 63.64,
            lastWatchedAt: new Date('2024-12-12T21:30:00Z').toISOString(),
            isCompleted: false,
            createdAt: new Date('2024-12-12T19:45:00Z').toISOString(),
            updatedAt: new Date('2024-12-12T21:30:00Z').toISOString(),
        },
        {
            userId,
            movieId: 15,
            movieType: 'kurdish',
            progressSeconds: 2700,
            totalDurationSeconds: 7800,
            progressPercentage: 34.62,
            lastWatchedAt: new Date('2024-12-11T20:45:00Z').toISOString(),
            isCompleted: false,
            createdAt: new Date('2024-12-11T20:00:00Z').toISOString(),
            updatedAt: new Date('2024-12-11T20:45:00Z').toISOString(),
        }
    ];

    await db.insert(streamingWatchProgress).values(sampleWatchProgress);
    
    console.log('✅ Watch progress seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});