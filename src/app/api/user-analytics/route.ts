import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movieReviews, watchedMovies, streamingWatchProgress, userAchievements, streamingUserStats, userProfiles } from '@/db/schema';
import { eq, sql, desc, asc, and, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const period = searchParams.get('period') || 'all';

    // Users can only access their own analytics
    if (userId !== user.id) {
      return NextResponse.json({ 
        error: 'You can only access your own analytics',
        code: 'ACCESS_DENIED'
      }, { status: 403 });
    }

    // Calculate date range based on period
    let dateFilter = '';
    const now = new Date();
    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFilter = monthAgo.toISOString();
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFilter = yearAgo.toISOString();
        break;
      default:
        dateFilter = '';
    }

    // Get review statistics
    const reviewStatsQuery = dateFilter 
      ? db.select({
          count: sql<number>`count(*)`,
          avgRating: sql<number>`avg(${movieReviews.rating})`,
          maxDate: sql<string>`max(${movieReviews.createdAt})`
        })
        .from(movieReviews)
        .where(and(eq(movieReviews.userId, userId), gte(movieReviews.createdAt, dateFilter)))
      : db.select({
          count: sql<number>`count(*)`,
          avgRating: sql<number>`avg(${movieReviews.rating})`,
          maxDate: sql<string>`max(${movieReviews.createdAt})`
        })
        .from(movieReviews)
        .where(eq(movieReviews.userId, userId));

    const reviewStats = await reviewStatsQuery;
    const totalReviews = reviewStats[0]?.count || 0;
    const averageRating = reviewStats[0]?.avgRating || 0;
    const mostRecentReview = reviewStats[0]?.maxDate || null;

    // Get rating distribution
    const ratingDistributionQuery = dateFilter
      ? db.select({
          rating: movieReviews.rating,
          count: sql<number>`count(*)`
        })
        .from(movieReviews)
        .where(and(eq(movieReviews.userId, userId), gte(movieReviews.createdAt, dateFilter)))
        .groupBy(movieReviews.rating)
      : db.select({
          rating: movieReviews.rating,
          count: sql<number>`count(*)`
        })
        .from(movieReviews)
        .where(eq(movieReviews.userId, userId))
        .groupBy(movieReviews.rating);

    const ratingData = await ratingDistributionQuery;
    const ratingDistribution = Array(10).fill(0);
    ratingData.forEach(item => {
      if (item.rating >= 1 && item.rating <= 10) {
        ratingDistribution[item.rating - 1] = item.count;
      }
    });

    // Get watching statistics from streaming watch progress
    const watchingStatsQuery = dateFilter
      ? db.select({
          totalMovies: sql<number>`count(distinct ${streamingWatchProgress.movieId})`,
          totalWatchTime: sql<number>`sum(${streamingWatchProgress.progressSeconds})`,
          completedCount: sql<number>`sum(case when ${streamingWatchProgress.isCompleted} = 1 then 1 else 0 end)`,
          totalProgress: sql<number>`count(*)`
        })
        .from(streamingWatchProgress)
        .where(and(eq(streamingWatchProgress.userId, userId), gte(streamingWatchProgress.lastWatchedAt, dateFilter)))
      : db.select({
          totalMovies: sql<number>`count(distinct ${streamingWatchProgress.movieId})`,
          totalWatchTime: sql<number>`sum(${streamingWatchProgress.progressSeconds})`,
          completedCount: sql<number>`sum(case when ${streamingWatchProgress.isCompleted} = 1 then 1 else 0 end)`,
          totalProgress: sql<number>`count(*)`
        })
        .from(streamingWatchProgress)
        .where(eq(streamingWatchProgress.userId, userId));

    const watchingData = await watchingStatsQuery;
    const totalMoviesWatched = watchingData[0]?.totalMovies || 0;
    const totalWatchTimeSeconds = watchingData[0]?.totalWatchTime || 0;
    const completedMovies = watchingData[0]?.completedCount || 0;
    const totalProgressEntries = watchingData[0]?.totalProgress || 0;
    const completionRate = totalProgressEntries > 0 ? (completedMovies / totalProgressEntries) * 100 : 0;
    const totalWatchTimeHours = totalWatchTimeSeconds / 3600;
    const averageWatchTime = totalMoviesWatched > 0 ? totalWatchTimeHours / totalMoviesWatched : 0;

    // Get activity statistics
    const currentMonth = now.toISOString().substr(0, 7);
    const currentYear = now.getFullYear().toString();

    const monthlyReviews = await db.select({
      count: sql<number>`count(*)`
    })
    .from(movieReviews)
    .where(and(
      eq(movieReviews.userId, userId),
      gte(movieReviews.createdAt, currentMonth)
    ));

    const yearlyReviews = await db.select({
      count: sql<number>`count(*)`
    })
    .from(movieReviews)
    .where(and(
      eq(movieReviews.userId, userId),
      gte(movieReviews.createdAt, currentYear)
    ));

    // Get most active month
    const mostActiveMonthQuery = await db.select({
      month: sql<string>`substr(${movieReviews.createdAt}, 1, 7)`,
      count: sql<number>`count(*)`
    })
    .from(movieReviews)
    .where(eq(movieReviews.userId, userId))
    .groupBy(sql`substr(${movieReviews.createdAt}, 1, 7)`)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

    const mostActiveMonth = mostActiveMonthQuery[0]?.month || null;

    // Get streak days (simplified - consecutive days with activity)
    const recentActivity = await db.select({
      date: sql<string>`date(${movieReviews.createdAt})`
    })
    .from(movieReviews)
    .where(eq(movieReviews.userId, userId))
    .orderBy(desc(movieReviews.createdAt))
    .limit(30);

    let streakDays = 0;
    const today = new Date().toISOString().substr(0, 10);
    const activityDates = [...new Set(recentActivity.map(a => a.date))].sort().reverse();
    
    for (let i = 0; i < activityDates.length; i++) {
      const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().substr(0, 10);
      if (activityDates[i] === expectedDate) {
        streakDays++;
      } else {
        break;
      }
    }

    // Get achievements
    const achievements = await db.select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.completedAt));

    // Define standard achievements if none exist
    const standardAchievements = [
      { name: "First Review", target: 1, type: "first_review" },
      { name: "Movie Buff", target: 25, type: "movie_buff" },
      { name: "Critic", target: 50, type: "critic" },
      { name: "Marathon Watcher", target: 100, type: "marathon_watcher" },
      { name: "Genre Explorer", target: 5, type: "genre_explorer" },
      { name: "Completion Master", target: 90, type: "completion_master" }
    ];

    const achievementsFormatted = standardAchievements.map(stdAch => {
      const userAch = achievements.find(a => a.achievementType === stdAch.type);
      let progress = 0;
      let earned = false;

      switch (stdAch.type) {
        case "first_review":
        case "movie_buff":
        case "critic":
          progress = totalReviews;
          earned = totalReviews >= stdAch.target;
          break;
        case "marathon_watcher":
          progress = totalMoviesWatched;
          earned = totalMoviesWatched >= stdAch.target;
          break;
        case "completion_master":
          progress = Math.round(completionRate);
          earned = completionRate >= stdAch.target;
          break;
        case "genre_explorer":
          // This would need genre analysis - simplified for now
          progress = Math.min(totalReviews, stdAch.target);
          earned = totalReviews >= stdAch.target;
          break;
      }

      return {
        name: stdAch.name,
        earned,
        progress: earned ? `${stdAch.target}/${stdAch.target}` : `${progress}/${stdAch.target}`
      };
    });

    // Get genre preferences (simplified - would need actual genre data from movies)
    // This is a placeholder since we don't have direct genre mapping in reviews
    const genrePreferences = [
      { genre: "Drama", count: Math.floor(totalReviews * 0.3), percentage: 30 },
      { genre: "Action", count: Math.floor(totalReviews * 0.25), percentage: 25 },
      { genre: "Comedy", count: Math.floor(totalReviews * 0.2), percentage: 20 },
      { genre: "Thriller", count: Math.floor(totalReviews * 0.15), percentage: 15 },
      { genre: "Sci-Fi", count: Math.floor(totalReviews * 0.1), percentage: 10 }
    ].filter(g => g.count > 0);

    const analytics = {
      userId,
      reviewStats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        mostRecentReview
      },
      watchingStats: {
        totalMoviesWatched,
        totalWatchTimeHours: Math.round(totalWatchTimeHours * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        averageWatchTime: Math.round(averageWatchTime * 100) / 100
      },
      activityStats: {
        reviewsThisMonth: monthlyReviews[0]?.count || 0,
        reviewsThisYear: yearlyReviews[0]?.count || 0,
        mostActiveMonth,
        streakDays
      },
      achievements: achievementsFormatted,
      genrePreferences
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('GET user analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}