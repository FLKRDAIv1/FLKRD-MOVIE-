import { db } from '@/db';
import { movieAnalytics } from '@/db/schema';

async function main() {
    const sampleAnalytics = [
        // The Dark Knight (TMDB 155)
        {
            movieId: 155,
            movieType: 'tmdb',
            totalViews: 25000,
            totalReviews: 450,
            averageRating: 8.8,
            totalFavorites: 3200,
            totalWatchTime: 3750000, // 152 min * 25000 views = seconds
            popularityScore: 92.5,
            trendingScore: 78.2,
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-11-15').toISOString(),
        },
        // Inception (TMDB 27205)
        {
            movieId: 27205,
            movieType: 'tmdb',
            totalViews: 22000,
            totalReviews: 380,
            averageRating: 8.4,
            totalFavorites: 2800,
            totalWatchTime: 3168000, // 148 min * 22000 views = seconds
            popularityScore: 88.7,
            trendingScore: 82.1,
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-11-18').toISOString(),
        },
        // Avengers Endgame (TMDB 299534)
        {
            movieId: 299534,
            movieType: 'tmdb',
            totalViews: 35000,
            totalReviews: 620,
            averageRating: 8.2,
            totalFavorites: 4100,
            totalWatchTime: 6300000, // 181 min * 35000 views = seconds
            popularityScore: 95.8,
            trendingScore: 89.4,
            createdAt: new Date('2024-01-25').toISOString(),
            updatedAt: new Date('2024-11-20').toISOString(),
        },
        // The Matrix (TMDB 603)
        {
            movieId: 603,
            movieType: 'tmdb',
            totalViews: 18000,
            totalReviews: 320,
            averageRating: 8.6,
            totalFavorites: 2400,
            totalWatchTime: 2484000, // 136 min * 18000 views = seconds
            popularityScore: 85.3,
            trendingScore: 71.8,
            createdAt: new Date('2024-02-01').toISOString(),
            updatedAt: new Date('2024-11-10').toISOString(),
        },
        // Pulp Fiction (TMDB 680)
        {
            movieId: 680,
            movieType: 'tmdb',
            totalViews: 20000,
            totalReviews: 410,
            averageRating: 8.3,
            totalFavorites: 2600,
            totalWatchTime: 3080000, // 154 min * 20000 views = seconds
            popularityScore: 87.1,
            trendingScore: 74.6,
            createdAt: new Date('2024-02-05').toISOString(),
            updatedAt: new Date('2024-11-12').toISOString(),
        },
        // The Shawshank Redemption (TMDB 278)
        {
            movieId: 278,
            movieType: 'tmdb',
            totalViews: 28000,
            totalReviews: 520,
            averageRating: 9.1,
            totalFavorites: 3800,
            totalWatchTime: 4032000, // 142 min * 28000 views = seconds
            popularityScore: 96.2,
            trendingScore: 80.5,
            createdAt: new Date('2024-02-10').toISOString(),
            updatedAt: new Date('2024-11-14').toISOString(),
        },
        // Interstellar (TMDB 157336)
        {
            movieId: 157336,
            movieType: 'tmdb',
            totalViews: 24000,
            totalReviews: 390,
            averageRating: 8.5,
            totalFavorites: 3000,
            totalWatchTime: 4080000, // 169 min * 24000 views = seconds
            popularityScore: 89.9,
            trendingScore: 85.7,
            createdAt: new Date('2024-02-15').toISOString(),
            updatedAt: new Date('2024-11-19').toISOString(),
        },
        // The Godfather (TMDB 238)
        {
            movieId: 238,
            movieType: 'tmdb',
            totalViews: 26000,
            totalReviews: 480,
            averageRating: 8.9,
            totalFavorites: 3400,
            totalWatchTime: 4524000, // 175 min * 26000 views = seconds
            popularityScore: 94.4,
            trendingScore: 76.8,
            createdAt: new Date('2024-02-20').toISOString(),
            updatedAt: new Date('2024-11-16').toISOString(),
        },
        // Kurdish Movie 1 (High rated)
        {
            movieId: 1,
            movieType: 'kurdish',
            totalViews: 4200,
            totalReviews: 68,
            averageRating: 8.1,
            totalFavorites: 320,
            totalWatchTime: 529200, // 126 min * 4200 views = seconds
            popularityScore: 72.4,
            trendingScore: 89.2,
            createdAt: new Date('2024-03-01').toISOString(),
            updatedAt: new Date('2024-11-21').toISOString(),
        },
        // Kurdish Movie 3 (High rated)
        {
            movieId: 3,
            movieType: 'kurdish',
            totalViews: 3800,
            totalReviews: 62,
            averageRating: 7.9,
            totalFavorites: 285,
            totalWatchTime: 456000, // 120 min * 3800 views = seconds
            popularityScore: 68.7,
            trendingScore: 86.1,
            createdAt: new Date('2024-03-05').toISOString(),
            updatedAt: new Date('2024-11-22').toISOString(),
        },
        // Kurdish Movie 7 (High rated)
        {
            movieId: 7,
            movieType: 'kurdish',
            totalViews: 3500,
            totalReviews: 55,
            averageRating: 8.3,
            totalFavorites: 295,
            totalWatchTime: 472500, // 135 min * 3500 views = seconds
            popularityScore: 70.8,
            trendingScore: 84.3,
            createdAt: new Date('2024-03-10').toISOString(),
            updatedAt: new Date('2024-11-20').toISOString(),
        },
        // Kurdish Movie 2 (Mid-range)
        {
            movieId: 2,
            movieType: 'kurdish',
            totalViews: 2200,
            totalReviews: 38,
            averageRating: 7.2,
            totalFavorites: 180,
            totalWatchTime: 277200, // 126 min * 2200 views = seconds
            popularityScore: 58.4,
            trendingScore: 71.6,
            createdAt: new Date('2024-03-15').toISOString(),
            updatedAt: new Date('2024-11-18').toISOString(),
        },
        // Kurdish Movie 5 (Mid-range)
        {
            movieId: 5,
            movieType: 'kurdish',
            totalViews: 1800,
            totalReviews: 29,
            averageRating: 7.0,
            totalFavorites: 145,
            totalWatchTime: 216000, // 120 min * 1800 views = seconds
            popularityScore: 54.2,
            trendingScore: 68.9,
            createdAt: new Date('2024-04-01').toISOString(),
            updatedAt: new Date('2024-11-15').toISOString(),
        },
        // Kurdish Movie 14 (Lower rated)
        {
            movieId: 14,
            movieType: 'kurdish',
            totalViews: 950,
            totalReviews: 18,
            averageRating: 6.2,
            totalFavorites: 68,
            totalWatchTime: 114000, // 120 min * 950 views = seconds
            popularityScore: 42.1,
            trendingScore: 35.8,
            createdAt: new Date('2024-04-15').toISOString(),
            updatedAt: new Date('2024-11-10').toISOString(),
        },
        // Kurdish Movie 15 (Lower rated)
        {
            movieId: 15,
            movieType: 'kurdish',
            totalViews: 720,
            totalReviews: 12,
            averageRating: 5.8,
            totalFavorites: 45,
            totalWatchTime: 86400, // 120 min * 720 views = seconds
            popularityScore: 38.6,
            trendingScore: 28.4,
            createdAt: new Date('2024-05-01').toISOString(),
            updatedAt: new Date('2024-11-08').toISOString(),
        }
    ];

    await db.insert(movieAnalytics).values(sampleAnalytics);
    
    console.log('✅ Movie analytics seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});