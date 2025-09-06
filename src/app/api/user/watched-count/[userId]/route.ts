import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userStats } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: {
    userId: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authentication required
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }

    const { userId } = context.params;

    // Validate userId parameter
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ 
        error: 'Valid user ID is required',
        code: 'INVALID_USER_ID' 
      }, { status: 400 });
    }

    // Security: Only allow users to access their own watched count
    if (userId !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied: You can only view your own statistics',
        code: 'ACCESS_DENIED' 
      }, { status: 403 });
    }

    // Query user_stats table
    const stats = await db.select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    // If user_stats record doesn't exist, return default values
    if (stats.length === 0) {
      return NextResponse.json({
        userId: userId,
        totalMoviesWatched: 0,
        totalWatchTime: 0,
        favoriteGenre: null,
        lastUpdated: new Date().toISOString()
      }, { status: 200 });
    }

    const userStat = stats[0];

    // Return stats with all requested fields
    return NextResponse.json({
      userId: userId,
      totalMoviesWatched: userStat.totalMoviesWatched || 0,
      totalWatchTime: userStat.totalWatchTime || 0,
      favoriteGenre: userStat.favoriteGenre || null,
      lastUpdated: userStat.updatedAt
    }, { status: 200 });

  } catch (error) {
    console.error('GET user stats error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR' 
    }, { status: 500 });
  }
}