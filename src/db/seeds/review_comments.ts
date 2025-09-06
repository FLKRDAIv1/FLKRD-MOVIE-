import { db } from '@/db';
import { reviewComments } from '@/db/schema';

async function main() {
    const sampleComments = [
        {
            reviewId: 1,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I completely agree with your take on the cinematography! The way Scorsese captures the tension in those quiet moments really elevates the entire film. Did you notice how he uses close-ups during the restaurant scenes to build that claustrophobic feeling?',
            createdAt: new Date('2024-10-16').toISOString(),
            updatedAt: new Date('2024-10-16').toISOString(),
        },
        {
            reviewId: 2,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Interesting perspective, though I have to respectfully disagree about the pacing. I found the slower moments necessary for character development. The film really needed those beats to let the emotional weight sink in. What did you think about the ending specifically?',
            createdAt: new Date('2024-10-18').toISOString(),
            updatedAt: new Date('2024-10-18').toISOString(),
        },
        {
            reviewId: 3,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Thanks for the spoiler warning! I actually watched this last week and your analysis of the plot twist is spot on. The way they set it up throughout the first act is masterful - there are so many subtle hints that only make sense on a second viewing.',
            createdAt: new Date('2024-10-20').toISOString(),
            updatedAt: new Date('2024-10-20').toISOString(),
        },
        {
            reviewId: 4,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Excellent review! You mentioned the sound design - did you catch how they use silence as effectively as the score? That scene in the library where you can hear every footstep and page turn creates incredible tension without any music at all.',
            createdAt: new Date('2024-10-22').toISOString(),
            updatedAt: new Date('2024-10-22').toISOString(),
        },
        {
            reviewId: 5,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'A 10/10 rating feels right for this one! The performance you highlighted really anchors the entire film. I\'m curious about your thoughts on the supporting cast though - did anyone else stand out to you, or was it really a one-person show?',
            createdAt: new Date('2024-10-25').toISOString(),
            updatedAt: new Date('2024-10-25').toISOString(),
        },
        {
            reviewId: 6,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I have to push back on the 3/10 rating here. While I agree the script has issues, the technical aspects alone deserve more credit. The production design and costume work are phenomenal, and they really transport you to that time period. Sometimes craft can elevate weaker material.',
            createdAt: new Date('2024-10-27').toISOString(),
            updatedAt: new Date('2024-10-27').toISOString(),
        },
        {
            reviewId: 7,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your Kurdish film reviews are always so insightful! I appreciate how you contextualize these films within Kurdish cinema history. This particular film sounds fascinating - is it available with English subtitles anywhere? I\'d love to watch it after reading your analysis.',
            createdAt: new Date('2024-10-29').toISOString(),
            updatedAt: new Date('2024-10-29').toISOString(),
        },
        {
            reviewId: 8,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Great point about the cultural significance! I watched this film without understanding that context and definitely missed some layers. Your review makes me want to revisit it with fresh eyes. Do you have any recommendations for other Kurdish films that explore similar themes?',
            createdAt: new Date('2024-11-01').toISOString(),
            updatedAt: new Date('2024-11-01').toISOString(),
        },
        {
            reviewId: 9,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'The way you describe the coming-of-age elements really resonates with me. Even though this is a coming soon film, your anticipation is infectious! Based on the trailer and your analysis, this could be a real sleeper hit. Do you know when the wide release is planned?',
            createdAt: new Date('2024-11-03').toISOString(),
            updatedAt: new Date('2024-11-03').toISOString(),
        },
        {
            reviewId: 10,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I\'m intrigued by your mixed feelings about this one. A 6/10 suggests it\'s watchable but flawed - what would you say is the biggest issue holding it back? The concept sounds solid, so I\'m wondering if it\'s execution or something more fundamental.',
            createdAt: new Date('2024-11-05').toISOString(),
            updatedAt: new Date('2024-11-05').toISOString(),
        },
        {
            reviewId: 11,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Wow, another 10/10! You\'ve been finding some real gems lately. Your enthusiasm for this film is contagious - I\'ve added it to my watchlist immediately. The way you describe the emotional journey makes it sound like essential viewing.',
            createdAt: new Date('2024-11-07').toISOString(),
            updatedAt: new Date('2024-11-07').toISOString(),
        },
        {
            reviewId: 12,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your review perfectly captures why this film frustrated me too. The potential was clearly there, and you can see glimpses of what it could have been. It\'s almost worse than a completely bad film because you can see the missed opportunities.',
            createdAt: new Date('2024-11-09').toISOString(),
            updatedAt: new Date('2024-11-09').toISOString(),
        },
        {
            reviewId: 13,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'This sounds like the perfect film for someone looking to explore Kurdish cinema! Your description of how it balances tradition with modernity is compelling. I love films that work on multiple levels like this - entertaining on the surface but with deeper themes underneath.',
            createdAt: new Date('2024-11-11').toISOString(),
            updatedAt: new Date('2024-11-11').toISOString(),
        },
        {
            reviewId: 14,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I\'m really looking forward to this one based on your preview! The director\'s previous work was solid, so high expectations make sense. Do you think this could be an awards contender, or is it more of a festival circuit film?',
            createdAt: new Date('2024-11-13').toISOString(),
            updatedAt: new Date('2024-11-13').toISOString(),
        },
        {
            reviewId: 15,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'A solid 7/10 - that\'s usually the sweet spot for a really enjoyable watch without being groundbreaking. Your review makes it sound like the kind of film that\'s perfect for a weekend evening. Sometimes you just want good storytelling without having to think too hard.',
            createdAt: new Date('2024-11-15').toISOString(),
            updatedAt: new Date('2024-11-15').toISOString(),
        },
        {
            reviewId: 16,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your analysis of the visual storytelling is brilliant! I completely missed those symbolic elements you mentioned on my first viewing. This is why I love reading reviews after watching - they often reveal layers I didn\'t catch. Time for a rewatch!',
            createdAt: new Date('2024-11-17').toISOString(),
            updatedAt: new Date('2024-11-17').toISOString(),
        },
        {
            reviewId: 17,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I have to admit, your 2/10 rating made me curious enough to watch this disaster myself. You weren\'t kidding about the editing issues - some of those cuts are genuinely jarring. Did you make it through the whole thing, or did you tap out early?',
            createdAt: new Date('2024-11-19').toISOString(),
            updatedAt: new Date('2024-11-19').toISOString(),
        },
        {
            reviewId: 18,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Thank you for highlighting the cultural context again - it really adds depth to the viewing experience. I\'m starting to develop a genuine appreciation for Kurdish cinema through your reviews. Are there any film festivals that showcase this work regularly?',
            createdAt: new Date('2024-11-21').toISOString(),
            updatedAt: new Date('2024-11-21').toISOString(),
        },
        {
            reviewId: 19,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'This upcoming film sounds incredibly ambitious! Your preview has me excited for what could be a really unique cinematic experience. I love when filmmakers take risks like this, even if they don\'t always pay off. When does it hit theaters?',
            createdAt: new Date('2024-11-23').toISOString(),
            updatedAt: new Date('2024-11-23').toISOString(),
        },
        {
            reviewId: 20,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your 8/10 feels right on the money for this one. It\'s clearly well-crafted but maybe plays things a bit safe? I enjoyed it thoroughly while watching, but I\'m not sure how much it\'ll stick with me long-term. What did you think about the ending?',
            createdAt: new Date('2024-11-25').toISOString(),
            updatedAt: new Date('2024-11-25').toISOString(),
        },
        {
            reviewId: 21,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Another excellent Kurdish film recommendation! Your passion for this cinema really comes through in your writing. I\'ve been keeping a list of all the films you\'ve reviewed, and I\'m slowly working my way through them. This one just moved to the top of the queue.',
            createdAt: new Date('2024-11-27').toISOString(),
            updatedAt: new Date('2024-11-27').toISOString(),
        },
        {
            reviewId: 22,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I\'m cautiously optimistic about this one based on your preview. The concept is intriguing, but you\'re right to temper expectations given the track record. Sometimes the most interesting films come from unexpected places though. I\'ll definitely give it a chance.',
            createdAt: new Date('2024-11-29').toISOString(),
            updatedAt: new Date('2024-11-29').toISOString(),
        },
        {
            reviewId: 23,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'A perfect 10/10 to end on! Your review makes this sound like a truly special viewing experience. I love how you describe the emotional impact - those are the films that remind you why cinema is such a powerful art form. Can\'t wait to experience this myself.',
            createdAt: new Date('2024-12-01').toISOString(),
            updatedAt: new Date('2024-12-01').toISOString(),
        },
        {
            reviewId: 1,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Actually, now that I think about it more, there\'s something about the lighting in this film that deserves special mention. The way natural light is used in the outdoor scenes creates this almost documentary feel that contrasts beautifully with the more stylized interior shots.',
            createdAt: new Date('2024-10-17').toISOString(),
            updatedAt: new Date('2024-10-17').toISOString(),
        },
        {
            reviewId: 5,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I keep coming back to your review because it perfectly articulates what made this film so special. The emotional authenticity you mention is exactly what elevated it above similar films in the genre. It never felt manipulative or forced.',
            createdAt: new Date('2024-10-26').toISOString(),
            updatedAt: new Date('2024-10-26').toISOString(),
        },
        {
            reviewId: 11,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Just finished watching this based on your recommendation - absolutely blown away! Your review prepared me for something special, but the actual experience exceeded even those high expectations. The final act is devastating in the best possible way.',
            createdAt: new Date('2024-11-08').toISOString(),
            updatedAt: new Date('2024-11-08').toISOString(),
        },
        {
            reviewId: 7,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I finally found a copy with subtitles and watched this over the weekend. Your review was the perfect companion piece - I kept thinking about your observations throughout. The film works on so many levels, but your cultural insights really helped me appreciate the deeper themes.',
            createdAt: new Date('2024-11-02').toISOString(),
            updatedAt: new Date('2024-11-02').toISOString(),
        },
        {
            reviewId: 13,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'The more I think about this film, the more I appreciate your analysis. It\'s rare to find movies that respect their audience\'s intelligence while still being emotionally accessible. The themes you highlighted about identity and belonging are so relevant right now.',
            createdAt: new Date('2024-11-14').toISOString(),
            updatedAt: new Date('2024-11-14').toISOString(),
        },
        {
            reviewId: 16,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your point about the cinematography being a character in itself is so insightful. On second viewing, I noticed how the camera movements mirror the protagonist\'s emotional state throughout the journey. It\'s incredibly subtle but effective storytelling.',
            createdAt: new Date('2024-11-18').toISOString(),
            updatedAt: new Date('2024-11-18').toISOString(),
        },
        {
            reviewId: 3,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Question about the ending - do you think it was always planned to be that ambiguous, or was it a result of studio interference? I\'ve been reading about the production and there seem to have been some creative differences along the way.',
            createdAt: new Date('2024-10-23').toISOString(),
            updatedAt: new Date('2024-10-23').toISOString(),
        },
        {
            reviewId: 18,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your mention of the film\'s connection to Kurdish oral traditions got me researching the background. It\'s fascinating how the director weaves these elements into a contemporary narrative. Do you know if there are any interviews where they discuss this approach?',
            createdAt: new Date('2024-11-24').toISOString(),
            updatedAt: new Date('2024-11-24').toISOString(),
        },
        {
            reviewId: 9,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Update: I saw this at an early screening last night! Your anticipation was completely justified - this is going to be one of the year\'s best films. I can\'t wait to read your full review once it officially releases.',
            createdAt: new Date('2024-11-06').toISOString(),
            updatedAt: new Date('2024-11-06').toISOString(),
        },
        {
            reviewId: 19,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'I love how you break down what makes a good trailer in your coming soon reviews. So many trailers give away too much, but this one seems to trust the audience. That\'s usually a good sign for the film\'s overall approach to storytelling.',
            createdAt: new Date('2024-11-26').toISOString(),
            updatedAt: new Date('2024-11-26').toISOString(),
        },
        {
            reviewId: 21,
            userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
            content: 'Your reviews have completely changed how I approach Kurdish cinema. I used to shy away from films I thought might be too culturally specific, but you\'ve shown me how universal themes can be explored through specific cultural lenses. Thank you for that perspective!',
            createdAt: new Date('2024-11-30').toISOString(),
            updatedAt: new Date('2024-11-30').toISOString(),
        }
    ];

    await db.insert(reviewComments).values(sampleComments);
    
    console.log('✅ Review comments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});