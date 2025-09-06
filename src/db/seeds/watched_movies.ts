import { db } from '@/db';
import { watchedMovies } from '@/db/schema';

async function main() {
    const sampleWatchedMovies = [
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 155,
            movieTitle: 'The Dark Knight',
            moviePoster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
            watchedAt: new Date('2024-12-15T20:30:00Z').toISOString(),
            rating: 9,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 27205,
            movieTitle: 'Inception',
            moviePoster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
            watchedAt: new Date('2024-12-08T19:15:00Z').toISOString(),
            rating: 8,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 299534,
            movieTitle: 'Avengers: Endgame',
            moviePoster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
            watchedAt: new Date('2024-12-01T21:00:00Z').toISOString(),
            rating: 10,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 603,
            movieTitle: 'The Matrix',
            moviePoster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
            watchedAt: new Date('2024-11-28T18:45:00Z').toISOString(),
            rating: 8,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 680,
            movieTitle: 'Pulp Fiction',
            moviePoster: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
            watchedAt: new Date('2024-11-22T22:30:00Z').toISOString(),
            rating: 9,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 278,
            movieTitle: 'The Shawshank Redemption',
            moviePoster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
            watchedAt: new Date('2024-11-18T20:00:00Z').toISOString(),
            rating: 10,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 157336,
            movieTitle: 'Interstellar',
            moviePoster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
            watchedAt: new Date('2024-11-12T19:30:00Z').toISOString(),
            rating: 9,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 238,
            movieTitle: 'The Godfather',
            moviePoster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
            watchedAt: new Date('2024-11-05T21:15:00Z').toISOString(),
            rating: 9,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 550,
            movieTitle: 'Fight Club',
            moviePoster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
            watchedAt: new Date('2024-10-30T23:00:00Z').toISOString(),
            rating: 8,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 13,
            movieTitle: 'Forrest Gump',
            moviePoster: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
            watchedAt: new Date('2024-10-25T18:00:00Z').toISOString(),
            rating: 8,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 98,
            movieTitle: 'Gladiator',
            moviePoster: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
            watchedAt: new Date('2024-10-20T20:45:00Z').toISOString(),
            rating: 7,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 120,
            movieTitle: 'The Lord of the Rings: The Fellowship of the Ring',
            moviePoster: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',
            watchedAt: new Date('2024-10-15T17:30:00Z').toISOString(),
            rating: 9,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 634649,
            movieTitle: 'Spider-Man: No Way Home',
            moviePoster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
            watchedAt: new Date('2024-12-20T19:00:00Z').toISOString(),
            rating: 8,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 361743,
            movieTitle: 'Top Gun: Maverick',
            moviePoster: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
            watchedAt: new Date('2024-12-25T16:30:00Z').toISOString(),
            rating: 7,
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 19995,
            movieTitle: 'Avatar',
            moviePoster: 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg',
            watchedAt: new Date('2024-12-30T21:45:00Z').toISOString(),
            rating: 7,
        },
    ];

    await db.insert(watchedMovies).values(sampleWatchedMovies);
    
    console.log('✅ Watched movies seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});