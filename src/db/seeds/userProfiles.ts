import { db } from '@/db';
import { userProfiles } from '@/db/schema';

async function main() {
    const sampleUserProfiles = [
        {
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            bio: 'Passionate movie enthusiast with a love for Kurdish cinema and international films. I enjoy exploring different genres and sharing thoughtful reviews about storytelling, cinematography, and cultural representation in film.',
            favoriteMovies: JSON.stringify([634649, 550, 13, 680, 155, 27205, 238, 389, 129, 578]),
            movieGenrePreferences: JSON.stringify(['Drama', 'Science Fiction', 'Crime', 'Thriller', 'Documentary', 'Action', 'Romance']),
            reviewCount: 25,
            averageRating: 8.5,
            joinedAt: new Date('2024-01-15').toISOString(),
            lastActiveAt: new Date('2024-12-15').toISOString(),
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-12-15').toISOString(),
        }
    ];

    await db.insert(userProfiles).values(sampleUserProfiles);
    
    console.log('✅ User profiles seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});