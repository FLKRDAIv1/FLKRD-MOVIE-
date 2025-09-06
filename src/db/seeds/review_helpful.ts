import { db } from '@/db';
import { reviewHelpful } from '@/db/schema';

async function main() {
    const sampleReviewHelpfulVotes = [
        // High-rated reviews (8-10 stars) - overwhelmingly helpful votes
        { reviewId: 1, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-16').toISOString() },
        { reviewId: 1, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-18').toISOString() },
        { reviewId: 1, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-22').toISOString() },
        
        { reviewId: 2, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-17').toISOString() },
        { reviewId: 2, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-19').toISOString() },
        
        { reviewId: 3, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-19').toISOString() },
        { reviewId: 3, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-21').toISOString() },
        { reviewId: 3, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-01-25').toISOString() },
        
        // Perfect 10/10 reviews - mostly helpful
        { reviewId: 4, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-21').toISOString() },
        { reviewId: 4, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-23').toISOString() },
        { reviewId: 4, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-28').toISOString() },
        { reviewId: 4, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-01').toISOString() },
        
        { reviewId: 5, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-24').toISOString() },
        { reviewId: 5, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-26').toISOString() },
        
        // Middle-rated reviews (6-7 stars) - moderate helpful percentage
        { reviewId: 6, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-26').toISOString() },
        { reviewId: 6, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-01-29').toISOString() },
        
        { reviewId: 7, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-01-28').toISOString() },
        { reviewId: 7, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-02').toISOString() },
        { reviewId: 7, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-02-05').toISOString() },
        
        // Low-rated controversial reviews (1-3 stars) - mixed votes
        { reviewId: 8, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-01-30').toISOString() },
        { reviewId: 8, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-03').toISOString() },
        { reviewId: 8, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-02-06').toISOString() },
        
        { reviewId: 9, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-02-01').toISOString() },
        { reviewId: 9, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-02-04').toISOString() },
        
        // Kurdish film reviews - moderate helpful votes
        { reviewId: 10, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-03').toISOString() },
        { reviewId: 10, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-07').toISOString() },
        
        { reviewId: 11, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-05').toISOString() },
        { reviewId: 11, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-02-10').toISOString() },
        
        // Popular detailed reviews getting more engagement
        { reviewId: 12, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-07').toISOString() },
        { reviewId: 12, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-09').toISOString() },
        { reviewId: 12, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-12').toISOString() },
        { reviewId: 12, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-02-15').toISOString() },
        
        // Coming soon reviews - fewer votes but higher helpful percentage
        { reviewId: 13, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-10').toISOString() },
        { reviewId: 13, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-13').toISOString() },
        
        { reviewId: 14, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-12').toISOString() },
        
        // More engagement on visible reviews
        { reviewId: 15, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-14').toISOString() },
        { reviewId: 15, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-16').toISOString() },
        { reviewId: 15, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-02-18').toISOString() },
        
        { reviewId: 16, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-16').toISOString() },
        { reviewId: 16, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-19').toISOString() },
        
        // Reviews with spoiler warnings getting fewer votes
        { reviewId: 17, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-18').toISOString() },
        
        { reviewId: 18, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-02-20').toISOString() },
        
        // Recent activity patterns
        { reviewId: 19, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-20').toISOString() },
        { reviewId: 19, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-22').toISOString() },
        
        { reviewId: 20, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-22').toISOString() },
        { reviewId: 20, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-02-25').toISOString() },
        
        // Latest reviews with immediate and delayed voting
        { reviewId: 21, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-24').toISOString() },
        
        { reviewId: 22, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-26').toISOString() },
        { reviewId: 22, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-28').toISOString() },
        
        { reviewId: 23, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: true, createdAt: new Date('2024-02-28').toISOString() },
        { reviewId: 23, userId: 'user_2mQJ8k3L9pN4R7tS8vW1x', isHelpful: false, createdAt: new Date('2024-03-02').toISOString() }
    ];

    await db.insert(reviewHelpful).values(sampleReviewHelpfulVotes);
    
    console.log('✅ Review helpful votes seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});