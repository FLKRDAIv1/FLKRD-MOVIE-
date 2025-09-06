import { db } from '@/db';
import { reviewComments } from '@/db/schema';

async function main() {
    const sampleComments = [
        {
            reviewId: 1,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Great review! I totally agree with your analysis of the character development.',
            createdAt: new Date('2024-10-15T14:30:00Z').toISOString(),
            updatedAt: new Date('2024-10-15T14:30:00Z').toISOString(),
        },
        {
            reviewId: 1,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Thanks for the spoiler warning! Really helped me decide to watch it.',
            createdAt: new Date('2024-10-16T09:15:00Z').toISOString(),
            updatedAt: new Date('2024-10-16T09:15:00Z').toISOString(),
        },
        {
            reviewId: 2,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I have to disagree with your rating. I think the movie deserved at least an 8/10.',
            createdAt: new Date('2024-10-17T16:45:00Z').toISOString(),
            updatedAt: new Date('2024-10-17T16:45:00Z').toISOString(),
        },
        {
            reviewId: 3,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Excellent breakdown of the cinematography! Did you notice the color symbolism in the final act?',
            createdAt: new Date('2024-10-18T11:20:00Z').toISOString(),
            updatedAt: new Date('2024-10-18T11:20:00Z').toISOString(),
        },
        {
            reviewId: 4,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'This review convinced me to add it to my watchlist. Sounds like my kind of movie!',
            createdAt: new Date('2024-10-19T20:10:00Z').toISOString(),
            updatedAt: new Date('2024-10-19T20:10:00Z').toISOString(),
        },
        {
            reviewId: 5,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Really thoughtful review. The Kurdish dubbing quality analysis was particularly helpful.',
            createdAt: new Date('2024-10-20T13:25:00Z').toISOString(),
            updatedAt: new Date('2024-10-20T13:25:00Z').toISOString(),
        },
        {
            reviewId: 6,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I watched this based on your recommendation and loved it! Thank you for the detailed review.',
            createdAt: new Date('2024-10-21T08:40:00Z').toISOString(),
            updatedAt: new Date('2024-10-21T08:40:00Z').toISOString(),
        },
        {
            reviewId: 7,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Interesting perspective on the plot twist. I didn\'t see it that way during my first watch.',
            createdAt: new Date('2024-10-22T15:55:00Z').toISOString(),
            updatedAt: new Date('2024-10-22T15:55:00Z').toISOString(),
        },
        {
            reviewId: 8,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Could you elaborate on why you felt the pacing was off? I found it quite engaging throughout.',
            createdAt: new Date('2024-10-23T12:05:00Z').toISOString(),
            updatedAt: new Date('2024-10-23T12:05:00Z').toISOString(),
        },
        {
            reviewId: 9,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Spot on about the soundtrack! It really elevated the emotional moments.',
            createdAt: new Date('2024-10-24T18:30:00Z').toISOString(),
            updatedAt: new Date('2024-10-24T18:30:00Z').toISOString(),
        },
        {
            reviewId: 10,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'This is exactly the kind of detailed analysis I was looking for. Keep up the great work!',
            createdAt: new Date('2024-10-25T10:15:00Z').toISOString(),
            updatedAt: new Date('2024-10-25T10:15:00Z').toISOString(),
        },
        {
            reviewId: 12,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I\'m curious about your thoughts on the director\'s previous work. Any recommendations?',
            createdAt: new Date('2024-10-26T14:20:00Z').toISOString(),
            updatedAt: new Date('2024-10-26T14:20:00Z').toISOString(),
        },
        {
            reviewId: 13,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'The acting performances were indeed stellar. Great eye for detail in your review!',
            createdAt: new Date('2024-10-27T16:45:00Z').toISOString(),
            updatedAt: new Date('2024-10-27T16:45:00Z').toISOString(),
        },
        {
            reviewId: 14,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I respectfully disagree about the ending. I thought it was perfectly ambiguous and thought-provoking.',
            createdAt: new Date('2024-10-28T09:30:00Z').toISOString(),
            updatedAt: new Date('2024-10-28T09:30:00Z').toISOString(),
        },
        {
            reviewId: 15,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your comparison to similar films in the genre was really insightful. Well done!',
            createdAt: new Date('2024-10-29T11:50:00Z').toISOString(),
            updatedAt: new Date('2024-10-29T11:50:00Z').toISOString(),
        },
        {
            reviewId: 16,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Thanks for mentioning the cultural context. It added so much depth to my understanding.',
            createdAt: new Date('2024-10-30T13:15:00Z').toISOString(),
            updatedAt: new Date('2024-10-30T13:15:00Z').toISOString(),
        },
        {
            reviewId: 17,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Have you considered doing video reviews? Your analysis style would work great in that format.',
            createdAt: new Date('2024-11-01T15:40:00Z').toISOString(),
            updatedAt: new Date('2024-11-01T15:40:00Z').toISOString(),
        },
        {
            reviewId: 18,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I appreciate how you balanced criticism with praise. Very fair and constructive review.',
            createdAt: new Date('2024-11-02T17:25:00Z').toISOString(),
            updatedAt: new Date('2024-11-02T17:25:00Z').toISOString(),
        },
        {
            reviewId: 19,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'The technical aspects you mentioned really enhanced my appreciation of the film.',
            createdAt: new Date('2024-11-03T19:10:00Z').toISOString(),
            updatedAt: new Date('2024-11-03T19:10:00Z').toISOString(),
        },
        {
            reviewId: 20,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Brilliant point about the themes! I completely missed that symbolism on my first viewing.',
            createdAt: new Date('2024-11-04T12:35:00Z').toISOString(),
            updatedAt: new Date('2024-11-04T12:35:00Z').toISOString(),
        },
        {
            reviewId: 21,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Do you think the sequel will live up to this one? Based on what we know so far.',
            createdAt: new Date('2024-11-05T14:50:00Z').toISOString(),
            updatedAt: new Date('2024-11-05T14:50:00Z').toISOString(),
        },
        {
            reviewId: 22,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your review helped me understand why I felt conflicted about certain scenes. Thank you!',
            createdAt: new Date('2024-11-06T16:20:00Z').toISOString(),
            updatedAt: new Date('2024-11-06T16:20:00Z').toISOString(),
        },
        {
            reviewId: 23,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I\'d love to see more Kurdish cinema reviews from you. This was incredibly thorough.',
            createdAt: new Date('2024-11-07T18:05:00Z').toISOString(),
            updatedAt: new Date('2024-11-07T18:05:00Z').toISOString(),
        },
        {
            reviewId: 24,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'The way you broke down the character arcs was masterful. Really helped me appreciate the writing.',
            createdAt: new Date('2024-11-08T20:40:00Z').toISOString(),
            updatedAt: new Date('2024-11-08T20:40:00Z').toISOString(),
        },
        {
            reviewId: 25,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Mixed feelings about your rating, but I respect your reasoning. Great detailed analysis overall.',
            createdAt: new Date('2024-11-09T22:15:00Z').toISOString(),
            updatedAt: new Date('2024-11-09T22:15:00Z').toISOString(),
        },
        {
            reviewId: 3,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Just rewatched this after reading your review. You\'re absolutely right about the color grading!',
            createdAt: new Date('2024-11-10T10:25:00Z').toISOString(),
            updatedAt: new Date('2024-11-10T10:25:00Z').toISOString(),
        },
        {
            reviewId: 7,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your analysis made me want to discuss this movie with friends. Sparked great conversations!',
            createdAt: new Date('2024-11-11T13:45:00Z').toISOString(),
            updatedAt: new Date('2024-11-11T13:45:00Z').toISOString(),
        },
        {
            reviewId: 11,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Finally someone who appreciates the subtlety in the performances! Excellent review.',
            createdAt: new Date('2024-11-12T15:30:00Z').toISOString(),
            updatedAt: new Date('2024-11-12T15:30:00Z').toISOString(),
        },
        {
            reviewId: 14,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I might need to give this another watch. Your perspective opened my eyes to things I missed.',
            createdAt: new Date('2024-11-13T17:55:00Z').toISOString(),
            updatedAt: new Date('2024-11-13T17:55:00Z').toISOString(),
        },
        {
            reviewId: 18,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'The production value discussion was fascinating. More technical reviews like this please!',
            createdAt: new Date('2024-11-14T19:20:00Z').toISOString(),
            updatedAt: new Date('2024-11-14T19:20:00Z').toISOString(),
        },
        {
            reviewId: 25,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Looking forward to your next review! Your writing style is engaging and informative.',
            createdAt: new Date('2024-11-15T21:10:00Z').toISOString(),
            updatedAt: new Date('2024-11-15T21:10:00Z').toISOString(),
        }
    ];

    await db.insert(reviewComments).values(sampleComments);
    
    console.log('✅ Review comments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});