import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { watchProgress, userStats } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { movieId, currentTime, totalDuration } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validation
    if (!movieId || !Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json({ 
        error: "Valid movieId is required (positive integer)",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    if (currentTime === undefined || currentTime === null || !Number.isInteger(currentTime) || currentTime < 0) {
      return NextResponse.json({ 
        error: "Valid currentTime is required (non-negative integer)",
        code: "INVALID_CURRENT_TIME" 
      }, { status: 400 });
    }

    if (!totalDuration || !Number.isInteger(totalDuration) || totalDuration <= 0) {
      return NextResponse.json({ 
        error: "Valid totalDuration is required (positive integer)",
        code: "INVALID_TOTAL_DURATION" 
      }, { status: 400 });
    }

    if (currentTime > totalDuration) {
      return NextResponse.json({ 
        error: "currentTime cannot exceed totalDuration",
        code: "INVALID_TIME_RANGE" 
      }, { status: 400 });
    }

    // Calculate progress percentage and completed status
    const progressPercentage = Math.min((currentTime / totalDuration) * 100, 100);
    const completed = progressPercentage >= 95;
    const lastWatchedAt = new Date().toISOString();

    // Check if watch progress already exists for this user+movieId combination
    const existingProgress = await db.select()
      .from(watchProgress)
      .where(and(eq(watchProgress.userId, user.id), eq(watchProgress.movieId, movieId)))
      .limit(1);

    let result;
    let wasJustCompleted = false;

    if (existingProgress.length > 0) {
      // Update existing record
      const wasAlreadyCompleted = existingProgress[0].completed;
      wasJustCompleted = !wasAlreadyCompleted && completed;

      result = await db.update(watchProgress)
        .set({
          currentTime,
          totalDuration,
          progressPercentage,
          lastWatchedAt,
          completed
        })
        .where(and(eq(watchProgress.userId, user.id), eq(watchProgress.movieId, movieId)))
        .returning();
    } else {
      // Insert new record
      wasJustCompleted = completed;

      result = await db.insert(watchProgress)
        .values({
          userId: user.id,
          movieId,
          currentTime,
          totalDuration,
          progressPercentage,
          lastWatchedAt,
          completed
        })
        .returning();
    }

    // Update user stats if movie was just completed
    if (wasJustCompleted) {
      // Check if user stats record exists
      const existingStats = await db.select()
        .from(userStats)
        .where(eq(userStats.userId, user.id))
        .limit(1);

      if (existingStats.length > 0) {
        // Update existing stats
        await db.update(userStats)
          .set({
            totalWatchTime: existingStats[0].totalWatchTime + totalDuration,
            updatedAt: new Date().toISOString()
          })
          .where(eq(userStats.userId, user.id));
      } else {
        // Create new stats record
        await db.insert(userStats)
          .values({
            userId: user.id,
            totalMoviesWatched: 0,
            totalWatchTime: totalDuration,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
      }
    }

    return NextResponse.json(result[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}