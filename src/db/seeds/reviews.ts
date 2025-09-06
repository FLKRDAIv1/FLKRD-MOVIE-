import { db } from '@/db';
import { reviews } from '@/db/schema';

async function main() {
    const sampleReviews = [
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 550,
            movieType: 'tmdb',
            title: 'A Masterpiece of Modern Cinema',
            content: 'Fight Club is an absolute tour de force that challenges societal norms and consumerist culture. The film\'s exploration of masculinity and identity remains relevant decades after its release.',
            rating: 9,
            isComingSoon: false,
            helpful: 23,
            spoilerWarning: true,
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 155,
            movieType: 'tmdb',
            title: 'Gotham\'s Dark Knight Returns',
            content: 'The Dark Knight elevates superhero cinema to new heights with Heath Ledger\'s haunting Joker performance. Christopher Nolan\'s direction creates a gritty, realistic take on the Batman universe.',
            rating: 8,
            isComingSoon: false,
            helpful: 19,
            spoilerWarning: false,
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 27205,
            movieType: 'tmdb',
            title: 'Inception: A Mind-Bending Experience',
            content: 'Inception is pure cinematic brilliance that challenges viewers to question reality itself. The layered narrative and stunning visual effects create an unforgettable journey through dreams within dreams.',
            rating: 10,
            isComingSoon: false,
            helpful: 25,
            spoilerWarning: true,
            createdAt: new Date('2024-01-25').toISOString(),
            updatedAt: new Date('2024-01-25').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 1,
            movieType: 'kurdish',
            title: 'A Beautiful Cultural Journey',
            content: 'This Kurdish film beautifully captures the essence of Kurdish culture and traditions. The storytelling is authentic and the cinematography showcases the stunning landscapes of Kurdistan.',
            rating: 7,
            isComingSoon: false,
            helpful: 16,
            spoilerWarning: false,
            createdAt: new Date('2024-02-01').toISOString(),
            updatedAt: new Date('2024-02-01').toISOString(),
        },
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            movieId: 2,
            movieType: 'kurdish',
            title: 'Heartfelt Kurdish Storytelling',
            content: 'An emotionally powerful Kurdish film that tells an important story about family and heritage. The performances are genuine and the dialogue feels natural and authentic.',
            rating: 8,
            isComingSoon: false,
            helpful: 18,
            spoilerWarning: true,
            createdAt: new Date('2024-02-05').toISOString(),
            updatedAt: new Date('2024-02-05').toISOString(),
        }
    ];

    await db.insert(reviews).values(sampleReviews);
    
    console.log('✅ Reviews seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});