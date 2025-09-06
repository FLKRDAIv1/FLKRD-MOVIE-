import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userAchievements, movieReviews, reviewComments, reviewHelpful } from '@/db/schema';
import { eq, like, and, or, desc, asc, count, sum } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// Achievement definitions with metadata
const ACHIEVEMENT_DEFINITIONS = {
  first_review: {
    name: "First Review",
    description: "Posted your first movie review",
    target: 1,
    points: 10,
    iconUrl: "/icons/first-review.svg"
  },
  movie_critic_10: {
    name: "Movie Critic",
    description: "Posted 10 movie reviews",
    target: 10,
    points: 50,
    iconUrl: "/icons/movie-critic.svg"
  },
  movie_critic_25: {
    name: "Seasoned Critic",
    description: "Posted 25 movie reviews",
    target: 25,
    points: 100,
    iconUrl: "/icons/seasoned-critic.svg"
  },
  movie_critic_50: {
    name: "Expert Critic",
    description: "Posted 50 movie reviews",
    target: 50,
    points: 200,
    iconUrl: "/icons/expert-critic.svg"
  },
  movie_critic_100: {
    name: "Master Critic",
    description: "Posted 100 movie reviews",
    target: 100,
    points: 500,
    iconUrl: "/icons/master-critic.svg"
  },
  popular_reviewer_10: {
    name: "Helpful Voice",
    description: "Received 10 helpful votes on reviews",
    target: 10,
    points: 25,
    iconUrl: "/icons/helpful-voice.svg"
  },
  popular_reviewer_50: {
    name: "Popular Reviewer",
    description: "Received 50 helpful votes on reviews",
    target: 50,
    points: 100,
    iconUrl: "/icons/popular-reviewer.svg"
  },
  popular_reviewer_100: {
    name: "Community Favorite",
    description: "Received 100 helpful votes on reviews",
    target: 100,
    points: 250,
    iconUrl: "/icons/community-favorite.svg"
  },
  popular_reviewer_500: {
    name: "Review Legend",
    description: "Received 500 helpful votes on reviews",
    target: 500,
    points: 1000,
    iconUrl: "/icons/review-legend.svg"
  },
  prolific_commenter_25: {
    name: "Active Commenter",
    description: "Posted 25 comments on reviews",
    target: 25,
    points: 30,
    iconUrl: "/icons/active-commenter.svg"
  },
  prolific_commenter_100: {
    name: "Discussion Leader",
    description: "Posted 100 comments on reviews",
    target: 100,
    points: 100,
    iconUrl: "/icons/discussion-leader.svg"
  },
  prolific_commenter_500: {
    name: "Community Pillar",
    description: "Posted 500 comments on reviews",
    target: 500,
    points: 300,
    iconUrl: "/icons/community-pillar.svg"
  },
  helpful_reviewer_5: {
    name: "Helpful Critic",
    description: "Had 5 reviews marked as helpful",
    target: 5,
    points: 25,
    iconUrl: "/icons/helpful-critic.svg"
  },
  helpful_reviewer_20: {
    name: "Trusted Reviewer",
    description: "Had 20 reviews marked as helpful",
    target: 20,
    points: 75,
    iconUrl: "/icons/trusted-reviewer.svg"
  },
  helpful_reviewer_100: {
    name: "Review Authority",
    description: "Had 100 reviews marked as helpful",
    target: 100,
    points: 300,
    iconUrl: "/icons/review-authority.svg"
  },
  early_adopter_5: {
    name: "Early Bird",
    description: "Reviewed 5 upcoming/new movies",
    target: 5,
    points: 40,
    iconUrl: "/icons/early-bird.svg"
  },
  early_adopter_20: {
    name: "Trend Setter",
    description: "Reviewed 20 upcoming/new movies",
    target: 20,
    points: 150,
    iconUrl: "/icons/trend-setter.svg"
  }
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const completed = searchParams.get('completed');
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'newest';

    let query = db.select().from(userAchievements).where(eq(userAchievements.userId, user.id));

    // Apply filters
    const conditions = [eq(userAchievements.userId, user.id)];

    if (completed !== null) {
      conditions.push(eq(userAchievements.isCompleted, completed === 'true'));
    }

    if (type) {
      conditions.push(eq(userAchievements.achievementType, type));
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.orderBy(asc(userAchievements.createdAt));
        break;
      case 'progress':
        query = query.orderBy(desc(userAchievements.progress));
        break;
      case 'newest':
      default:
        query = query.orderBy(desc(userAchievements.createdAt));
        break;
    }

    const achievements = await query.limit(limit).offset(offset);

    // Add progress percentage to each achievement
    const achievementsWithProgress = achievements.map(achievement => ({
      ...achievement,
      progressPercentage: achievement.target > 0 ? Math.round((achievement.progress / achievement.target) * 100) : 0
    }));

    return NextResponse.json(achievementsWithProgress);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { action, metadata } = requestBody;

    if (!action) {
      return NextResponse.json({ 
        error: "Action is required",
        code: "MISSING_ACTION" 
      }, { status: 400 });
    }

    const validActions = ['review_created', 'comment_posted', 'helpful_vote', 'review_helpful'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: "Invalid action type",
        code: "INVALID_ACTION" 
      }, { status: 400 });
    }

    const newlyAwarded = [];

    switch (action) {
      case 'review_created':
        await handleReviewCreated(user.id, metadata, newlyAwarded);
        break;
      case 'comment_posted':
        await handleCommentPosted(user.id, newlyAwarded);
        break;
      case 'helpful_vote':
        await handleHelpfulVote(user.id, newlyAwarded);
        break;
      case 'review_helpful':
        await handleReviewHelpful(user.id, newlyAwarded);
        break;
    }

    return NextResponse.json({
      newAchievements: newlyAwarded,
      message: `Processed ${action} action`,
      totalAwarded: newlyAwarded.length
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { achievementType, progress } = requestBody;

    if (!achievementType) {
      return NextResponse.json({ 
        error: "Achievement type is required",
        code: "MISSING_ACHIEVEMENT_TYPE" 
      }, { status: 400 });
    }

    if (progress === undefined || progress < 0) {
      return NextResponse.json({ 
        error: "Valid progress value is required",
        code: "INVALID_PROGRESS" 
      }, { status: 400 });
    }

    // Find existing achievement
    const existingAchievement = await db.select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, user.id),
        eq(userAchievements.achievementType, achievementType)
      ))
      .limit(1);

    if (existingAchievement.length === 0) {
      return NextResponse.json({ 
        error: "Achievement not found",
        code: "ACHIEVEMENT_NOT_FOUND" 
      }, { status: 404 });
    }

    const achievement = existingAchievement[0];
    const isCompleted = progress >= achievement.target;
    const completedAt = isCompleted && !achievement.isCompleted ? new Date().toISOString() : achievement.completedAt;

    const updated = await db.update(userAchievements)
      .set({
        progress,
        isCompleted,
        completedAt,
        updatedAt: new Date().toISOString()
      })
      .where(and(
        eq(userAchievements.userId, user.id),
        eq(userAchievements.achievementType, achievementType)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: "Failed to update achievement",
        code: "UPDATE_FAILED" 
      }, { status: 404 });
    }

    const updatedAchievement = {
      ...updated[0],
      progressPercentage: Math.round((updated[0].progress / updated[0].target) * 100)
    };

    return NextResponse.json(updatedAchievement);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const deleted = await db.delete(userAchievements)
      .where(and(
        eq(userAchievements.id, parseInt(id)),
        eq(userAchievements.userId, user.id)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: "Achievement not found",
        code: "ACHIEVEMENT_NOT_FOUND" 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Achievement deleted successfully",
      deletedAchievement: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// Helper functions for achievement logic
async function handleReviewCreated(userId: string, metadata: any, newlyAwarded: any[]) {
  // Get current review count
  const [reviewCount] = await db.select({ count: count() })
    .from(movieReviews)
    .where(eq(movieReviews.userId, userId));

  const totalReviews = reviewCount.count;

  // Check first review achievement
  await checkAndAwardAchievement(userId, 'first_review', totalReviews, newlyAwarded);

  // Check movie critic achievements
  const criticLevels = [10, 25, 50, 100];
  for (const level of criticLevels) {
    await checkAndAwardAchievement(userId, `movie_critic_${level}`, totalReviews, newlyAwarded);
  }

  // Check early adopter if review is for coming soon movie
  if (metadata?.isComingSoon) {
    const [comingSoonCount] = await db.select({ count: count() })
      .from(movieReviews)
      .where(and(
        eq(movieReviews.userId, userId),
        eq(movieReviews.isComingSoon, true)
      ));

    const earlyAdopterLevels = [5, 20];
    for (const level of earlyAdopterLevels) {
      await checkAndAwardAchievement(userId, `early_adopter_${level}`, comingSoonCount.count, newlyAwarded);
    }
  }
}

async function handleCommentPosted(userId: string, newlyAwarded: any[]) {
  const [commentCount] = await db.select({ count: count() })
    .from(reviewComments)
    .where(eq(reviewComments.userId, userId));

  const totalComments = commentCount.count;
  const commenterLevels = [25, 100, 500];
  
  for (const level of commenterLevels) {
    await checkAndAwardAchievement(userId, `prolific_commenter_${level}`, totalComments, newlyAwarded);
  }
}

async function handleHelpfulVote(userId: string, newlyAwarded: any[]) {
  // Get total helpful votes received on user's reviews
  const [helpfulVotes] = await db.select({ total: sum(movieReviews.helpful) })
    .from(movieReviews)
    .where(eq(movieReviews.userId, userId));

  const totalHelpfulVotes = helpfulVotes.total || 0;
  const popularLevels = [10, 50, 100, 500];
  
  for (const level of popularLevels) {
    await checkAndAwardAchievement(userId, `popular_reviewer_${level}`, totalHelpfulVotes, newlyAwarded);
  }
}

async function handleReviewHelpful(userId: string, newlyAwarded: any[]) {
  // Count how many of user's reviews have been marked as helpful
  const helpfulReviews = await db.select({ reviewId: movieReviews.id })
    .from(movieReviews)
    .innerJoin(reviewHelpful, eq(movieReviews.id, reviewHelpful.reviewId))
    .where(and(
      eq(movieReviews.userId, userId),
      eq(reviewHelpful.isHelpful, true)
    ));

  const uniqueHelpfulReviews = new Set(helpfulReviews.map(r => r.reviewId)).size;
  const helpfulLevels = [5, 20, 100];
  
  for (const level of helpfulLevels) {
    await checkAndAwardAchievement(userId, `helpful_reviewer_${level}`, uniqueHelpfulReviews, newlyAwarded);
  }
}

async function checkAndAwardAchievement(userId: string, achievementType: string, currentProgress: number, newlyAwarded: any[]) {
  const definition = ACHIEVEMENT_DEFINITIONS[achievementType];
  if (!definition) return;

  // Check if achievement already exists
  const existing = await db.select()
    .from(userAchievements)
    .where(and(
      eq(userAchievements.userId, userId),
      eq(userAchievements.achievementType, achievementType)
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update progress if not completed
    if (!existing[0].isCompleted && currentProgress >= definition.target) {
      const updated = await db.update(userAchievements)
        .set({
          progress: currentProgress,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(userAchievements.id, existing[0].id))
        .returning();

      if (updated.length > 0) {
        newlyAwarded.push({
          ...updated[0],
          progressPercentage: 100
        });
      }
    } else if (!existing[0].isCompleted) {
      await db.update(userAchievements)
        .set({
          progress: currentProgress,
          updatedAt: new Date().toISOString()
        })
        .where(eq(userAchievements.id, existing[0].id));
    }
  } else {
    // Create new achievement
    const isCompleted = currentProgress >= definition.target;
    const newAchievement = await db.insert(userAchievements)
      .values({
        userId,
        achievementType,
        achievementName: definition.name,
        achievementDescription: definition.description,
        progress: currentProgress,
        target: definition.target,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
        iconUrl: definition.iconUrl,
        points: definition.points,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    if (newAchievement.length > 0) {
      const achievement = {
        ...newAchievement[0],
        progressPercentage: Math.round((currentProgress / definition.target) * 100)
      };

      if (isCompleted) {
        newlyAwarded.push(achievement);
      }
    }
  }
}