import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { watchedMovies, userStats } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    const requestBody = await request.json();
    const { movieId, movieTitle, moviePoster, rating } = requestBody;

    // Security: Check if userId provided in request body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!movieId) {
      return NextResponse.json({ 
        error: "movieId is required",
        code: "MISSING_MOVIE_ID" 
      }, { status: 400 });
    }

    if (!movieTitle) {
      return NextResponse.json({ 
        error: "movieTitle is required",
        code: "MISSING_MOVIE_TITLE" 
      }, { status: 400 });
    }

    // Validate movieId is positive integer
    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json({ 
        error: "movieId must be a positive integer",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
        return NextResponse.json({ 
          error: "rating must be an integer between 1 and 10",
          code: "INVALID_RATING" 
        }, { status: 400 });
      }
    }

    // Database transaction
    const result = await db.transaction(async (tx) => {
      // Insert into watched_movies
      const watchedMovie = await tx.insert(watchedMovies).values({
        userId: user.id,
        movieId,
        movieTitle: movieTitle.trim(),
        moviePoster: moviePoster?.trim() || null,
        watchedAt: new Date().toISOString(),
        rating: rating || null,
      }).returning();

      // Check if user_stats exists
      const existingStats = await tx.select()
        .from(userStats)
        .where(eq(userStats.userId, user.id))
        .limit(1);

      let updatedStats;
      
      if (existingStats.length === 0) {
        // Create new user_stats record
        updatedStats = await tx.insert(userStats).values({
          userId: user.id,
          totalMoviesWatched: 1,
          totalWatchTime: 0,
          favoriteGenre: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).returning();
      } else {
        // Update existing user_stats
        updatedStats = await tx.update(userStats)
          .set({
            totalMoviesWatched: (existingStats[0].totalMoviesWatched || 0) + 1,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userStats.userId, user.id))
          .returning();
      }

      return {
        watchedMovie: watchedMovie[0],
        userStats: updatedStats[0],
      };
    });

    return NextResponse.json({
      watchedMovie: result.watchedMovie,
      userStats: result.userStats,
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}