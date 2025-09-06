import { db } from '@/db';
import { userFavorites } from '@/db/schema';

async function main() {
    const sampleFavorites = [
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 15,
            movieType: 'kurdish',
            createdAt: new Date('2024-10-05T14:30:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 678,
            movieType: 'tmdb',
            createdAt: new Date('2024-10-12T09:15:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 3,
            movieType: 'kurdish',
            createdAt: new Date('2024-10-18T20:45:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 823,
            movieType: 'tmdb',
            createdAt: new Date('2024-10-25T16:20:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 21,
            movieType: 'kurdish',
            createdAt: new Date('2024-11-03T11:10:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 567,
            movieType: 'tmdb',
            createdAt: new Date('2024-11-09T19:35:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 8,
            movieType: 'kurdish',
            createdAt: new Date('2024-11-15T13:25:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 745,
            movieType: 'tmdb',
            createdAt: new Date('2024-11-22T10:50:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 12,
            movieType: 'kurdish',
            createdAt: new Date('2024-11-28T15:40:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 892,
            movieType: 'tmdb',
            createdAt: new Date('2024-12-04T18:15:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 7,
            movieType: 'kurdish',
            createdAt: new Date('2024-12-11T12:30:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 634,
            movieType: 'tmdb',
            createdAt: new Date('2024-12-18T21:05:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 19,
            movieType: 'kurdish',
            createdAt: new Date('2024-12-24T17:20:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 711,
            movieType: 'tmdb',
            createdAt: new Date('2025-01-02T14:45:00Z').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 25,
            movieType: 'kurdish',
            createdAt: new Date('2025-01-08T16:10:00Z').toISOString(),
        }
    ];

    await db.insert(userFavorites).values(sampleFavorites);
    
    console.log('✅ User favorites seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});