import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userStats, watchedMovies, watchProgress } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    // Security: Ensure user can only access their own stats
    if (userId !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED' 
      }, { status: 403 });
    }

    // Get user basic stats
    const userBasicStats = await db.select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    if (userBasicStats.length === 0) {
      return NextResponse.json({ 
        error: 'User statistics not found',
        code: 'STATS_NOT_FOUND' 
      }, { status: 404 });
    }

    const stats = userBasicStats[0];

    // Get recently watched movies (last 10)
    const recentMovies = await db.select({
      movieId: watchedMovies.movieId,
      movieTitle: watchedMovies.movieTitle,
      moviePoster: watchedMovies.moviePoster,
      watchedAt: watchedMovies.watchedAt,
      rating: watchedMovies.rating
    })
      .from(watchedMovies)
      .where(eq(watchedMovies.userId, userId))
      .orderBy(desc(watchedMovies.watchedAt))
      .limit(10);

    // Get movies currently in progress (not completed)
    const moviesInProgress = await db.select({
      movieId: watchProgress.movieId,
      currentTime: watchProgress.currentTime,
      totalDuration: watchProgress.totalDuration,
      progressPercentage: watchProgress.progressPercentage,
      lastWatchedAt: watchProgress.lastWatchedAt
    })
      .from(watchProgress)
      .where(and(
        eq(watchProgress.userId, userId),
        eq(watchProgress.completed, false)
      ))
      .orderBy(desc(watchProgress.lastWatchedAt))
      .limit(10);

    // Calculate average rating from watched movies
    const ratedMovies = recentMovies.filter(movie => movie.rating !== null);
    const averageRating = ratedMovies.length > 0 
      ? ratedMovies.reduce((sum, movie) => sum + (movie.rating || 0), 0) / ratedMovies.length 
      : null;

    // Format watch time into human readable format
    const formatWatchTime = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    // Calculate genre statistics from recent movies (simplified)
    const genreCount: { [key: string]: number } = {};
    // Note: This would typically require movie genre data, using favorite genre as primary
    const mostWatchedGenres = stats.favoriteGenre ? [stats.favoriteGenre] : [];

    // Format progress movies with additional info
    const formattedProgressMovies = moviesInProgress.map(movie => ({
      ...movie,
      remainingTime: formatWatchTime(movie.totalDuration - movie.currentTime),
      watchedTime: formatWatchTime(movie.currentTime)
    }));

    // Calculate completion rate
    const totalMoviesStarted = await db.select()
      .from(watchProgress)
      .where(eq(watchProgress.userId, userId));
    
    const completedMovies = totalMoviesStarted.filter(movie => movie.completed);
    const completionRate = totalMoviesStarted.length > 0 
      ? (completedMovies.length / totalMoviesStarted.length) * 100 
      : 0;

    const response = {
      basicStats: {
        totalMoviesWatched: stats.totalMoviesWatched,
        totalWatchTime: stats.totalWatchTime,
        totalWatchTimeFormatted: formatWatchTime(stats.totalWatchTime),
        favoriteGenre: stats.favoriteGenre,
        averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
        completionRate: Math.round(completionRate * 10) / 10
      },
      recentMovies: recentMovies.map(movie => ({
        ...movie,
        watchedAt: new Date(movie.watchedAt).toLocaleDateString()
      })),
      moviesInProgress: formattedProgressMovies,
      watchTimeStats: {
        totalSeconds: stats.totalWatchTime,
        formatted: formatWatchTime(stats.totalWatchTime),
        averagePerMovie: stats.totalMoviesWatched > 0 
          ? formatWatchTime(Math.floor(stats.totalWatchTime / stats.totalMoviesWatched))
          : '0m'
      },
      genreStats: {
        favoriteGenre: stats.favoriteGenre,
        mostWatchedGenres: mostWatchedGenres
      },
      activitySummary: {
        moviesWatched: stats.totalMoviesWatched,
        moviesInProgress: moviesInProgress.length,
        recentMovieCount: recentMovies.length,
        hasActivity: stats.totalMoviesWatched > 0 || moviesInProgress.length > 0
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET user stats error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}