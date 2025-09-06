import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { streamingUserStats } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const existingStats = await db.select()
      .from(streamingUserStats)
      .where(eq(streamingUserStats.userId, user.id))
      .limit(1);

    if (existingStats.length === 0) {
      // Create default record if doesn't exist
      const defaultStats = {
        userId: user.id,
        totalMoviesWatched: 0,
        totalWatchTimeMinutes: 0,
        favoriteGenre: null,
        kurdishMoviesWatched: 0,
        internationalMoviesWatched: 0,
        streakDays: 0,
        lastActivityDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newStats = await db.insert(streamingUserStats)
        .values(defaultStats)
        .returning();

      return NextResponse.json(newStats[0]);
    }

    return NextResponse.json(existingStats[0]);
  } catch (error) {
    console.error('GET error:', error);
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

    const {
      totalMoviesWatched,
      totalWatchTimeMinutes,
      favoriteGenre,
      kurdishMoviesWatched,
      internationalMoviesWatched,
      streakDays,
      lastActivityDate
    } = requestBody;

    // Validation
    if (totalMoviesWatched !== undefined && (typeof totalMoviesWatched !== 'number' || totalMoviesWatched < 0)) {
      return NextResponse.json({ 
        error: "totalMoviesWatched must be a non-negative integer",
        code: "INVALID_TOTAL_MOVIES" 
      }, { status: 400 });
    }

    if (totalWatchTimeMinutes !== undefined && (typeof totalWatchTimeMinutes !== 'number' || totalWatchTimeMinutes < 0)) {
      return NextResponse.json({ 
        error: "totalWatchTimeMinutes must be a non-negative integer",
        code: "INVALID_WATCH_TIME" 
      }, { status: 400 });
    }

    if (kurdishMoviesWatched !== undefined && (typeof kurdishMoviesWatched !== 'number' || kurdishMoviesWatched < 0)) {
      return NextResponse.json({ 
        error: "kurdishMoviesWatched must be a non-negative integer",
        code: "INVALID_KURDISH_MOVIES" 
      }, { status: 400 });
    }

    if (internationalMoviesWatched !== undefined && (typeof internationalMoviesWatched !== 'number' || internationalMoviesWatched < 0)) {
      return NextResponse.json({ 
        error: "internationalMoviesWatched must be a non-negative integer",
        code: "INVALID_INTERNATIONAL_MOVIES" 
      }, { status: 400 });
    }

    if (streakDays !== undefined && (typeof streakDays !== 'number' || streakDays < 0)) {
      return NextResponse.json({ 
        error: "streakDays must be a non-negative integer",
        code: "INVALID_STREAK_DAYS" 
      }, { status: 400 });
    }

    // Check if record exists
    const existingStats = await db.select()
      .from(streamingUserStats)
      .where(eq(streamingUserStats.userId, user.id))
      .limit(1);

    if (existingStats.length === 0) {
      return NextResponse.json({ 
        error: 'User statistics not found',
        code: 'STATS_NOT_FOUND' 
      }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (totalMoviesWatched !== undefined) updateData.totalMoviesWatched = totalMoviesWatched;
    if (totalWatchTimeMinutes !== undefined) updateData.totalWatchTimeMinutes = totalWatchTimeMinutes;
    if (favoriteGenre !== undefined) updateData.favoriteGenre = favoriteGenre;
    if (kurdishMoviesWatched !== undefined) updateData.kurdishMoviesWatched = kurdishMoviesWatched;
    if (internationalMoviesWatched !== undefined) updateData.internationalMoviesWatched = internationalMoviesWatched;
    if (streakDays !== undefined) updateData.streakDays = streakDays;
    if (lastActivityDate !== undefined) updateData.lastActivityDate = lastActivityDate;

    const updated = await db.update(streamingUserStats)
      .set(updateData)
      .where(eq(streamingUserStats.userId, user.id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
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

    const { action, movie_type, watch_time_minutes, genre, streak_days } = requestBody;

    if (!action) {
      return NextResponse.json({ 
        error: "Action is required",
        code: "MISSING_ACTION" 
      }, { status: 400 });
    }

    // Get current stats or create default
    let currentStats = await db.select()
      .from(streamingUserStats)
      .where(eq(streamingUserStats.userId, user.id))
      .limit(1);

    if (currentStats.length === 0) {
      const defaultStats = {
        userId: user.id,
        totalMoviesWatched: 0,
        totalWatchTimeMinutes: 0,
        favoriteGenre: null,
        kurdishMoviesWatched: 0,
        internationalMoviesWatched: 0,
        streakDays: 0,
        lastActivityDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      currentStats = await db.insert(streamingUserStats)
        .values(defaultStats)
        .returning();
    }

    const stats = currentStats[0];
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    switch (action) {
      case 'movie_watched':
        if (!movie_type || (movie_type !== 'kurdish' && movie_type !== 'international')) {
          return NextResponse.json({ 
            error: "movie_type must be 'kurdish' or 'international'",
            code: "INVALID_MOVIE_TYPE" 
          }, { status: 400 });
        }

        updateData.totalMoviesWatched = stats.totalMoviesWatched + 1;
        
        if (movie_type === 'kurdish') {
          updateData.kurdishMoviesWatched = stats.kurdishMoviesWatched + 1;
        } else {
          updateData.internationalMoviesWatched = stats.internationalMoviesWatched + 1;
        }

        updateData.lastActivityDate = new Date().toISOString();
        break;

      case 'watch_time':
        if (typeof watch_time_minutes !== 'number' || watch_time_minutes < 0) {
          return NextResponse.json({ 
            error: "watch_time_minutes must be a non-negative number",
            code: "INVALID_WATCH_TIME" 
          }, { status: 400 });
        }

        updateData.totalWatchTimeMinutes = stats.totalWatchTimeMinutes + watch_time_minutes;
        updateData.lastActivityDate = new Date().toISOString();
        break;

      case 'update_genre':
        if (!genre || typeof genre !== 'string') {
          return NextResponse.json({ 
            error: "genre must be a non-empty string",
            code: "INVALID_GENRE" 
          }, { status: 400 });
        }

        updateData.favoriteGenre = genre.trim();
        break;

      case 'update_streak':
        if (typeof streak_days !== 'number' || streak_days < 0) {
          return NextResponse.json({ 
            error: "streak_days must be a non-negative number",
            code: "INVALID_STREAK_DAYS" 
          }, { status: 400 });
        }

        updateData.streakDays = streak_days;
        updateData.lastActivityDate = new Date().toISOString();
        break;

      default:
        return NextResponse.json({ 
          error: "Invalid action. Supported actions: movie_watched, watch_time, update_genre, update_streak",
          code: "INVALID_ACTION" 
        }, { status: 400 });
    }

    const updated = await db.update(streamingUserStats)
      .set(updateData)
      .where(eq(streamingUserStats.userId, user.id))
      .returning();

    return NextResponse.json({
      message: `Successfully processed ${action} action`,
      stats: updated[0]
    });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}