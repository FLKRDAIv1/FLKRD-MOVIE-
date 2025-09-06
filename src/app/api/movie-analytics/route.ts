import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movieAnalytics, movieReviews } from '@/db/schema';
import { eq, like, and, or, desc, asc, avg, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const movieId = searchParams.get('movieId');
    const movieType = searchParams.get('movieType');

    // Single analytics record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const analytics = await db.select()
        .from(movieAnalytics)
        .where(eq(movieAnalytics.id, parseInt(id)))
        .limit(1);

      if (analytics.length === 0) {
        return NextResponse.json({ 
          error: 'Movie analytics not found',
          code: 'ANALYTICS_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(analytics[0]);
    }

    // Single analytics by movieId and type
    if (movieId) {
      if (isNaN(parseInt(movieId))) {
        return NextResponse.json({ 
          error: "Valid movieId is required",
          code: "INVALID_MOVIE_ID" 
        }, { status: 400 });
      }

      if (!movieType || (movieType !== 'tmdb' && movieType !== 'kurdish')) {
        return NextResponse.json({ 
          error: "movieType must be 'tmdb' or 'kurdish'",
          code: "INVALID_MOVIE_TYPE" 
        }, { status: 400 });
      }

      const analytics = await db.select()
        .from(movieAnalytics)
        .where(and(
          eq(movieAnalytics.movieId, parseInt(movieId)),
          eq(movieAnalytics.movieType, movieType)
        ))
        .limit(1);

      if (analytics.length === 0) {
        return NextResponse.json({ 
          error: 'Movie analytics not found',
          code: 'ANALYTICS_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(analytics[0]);
    }

    // List analytics with pagination, filtering, and sorting
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'popularity';
    const order = searchParams.get('order') || 'desc';
    const typeFilter = searchParams.get('type');

    let query = db.select().from(movieAnalytics);

    // Apply filters
    const conditions = [];
    
    if (typeFilter && (typeFilter === 'tmdb' || typeFilter === 'kurdish')) {
      conditions.push(eq(movieAnalytics.movieType, typeFilter));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderFn = order === 'asc' ? asc : desc;
    
    switch (sort) {
      case 'trending':
        query = query.orderBy(orderFn(movieAnalytics.trendingScore));
        break;
      case 'rating':
        query = query.orderBy(orderFn(movieAnalytics.averageRating));
        break;
      case 'reviews':
        query = query.orderBy(orderFn(movieAnalytics.totalReviews));
        break;
      case 'views':
        query = query.orderBy(orderFn(movieAnalytics.totalViews));
        break;
      case 'favorites':
        query = query.orderBy(orderFn(movieAnalytics.totalFavorites));
        break;
      case 'popularity':
      default:
        query = query.orderBy(orderFn(movieAnalytics.popularityScore));
        break;
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);
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
    const { movieId, movieType, action, value } = requestBody;

    // Validate required fields
    if (!movieId) {
      return NextResponse.json({ 
        error: "movieId is required",
        code: "MISSING_MOVIE_ID" 
      }, { status: 400 });
    }

    if (!movieType) {
      return NextResponse.json({ 
        error: "movieType is required",
        code: "MISSING_MOVIE_TYPE" 
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ 
        error: "action is required",
        code: "MISSING_ACTION" 
      }, { status: 400 });
    }

    // Validate movieId and movieType
    if (isNaN(parseInt(movieId)) || parseInt(movieId) <= 0) {
      return NextResponse.json({ 
        error: "movieId must be a positive integer",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    if (movieType !== 'tmdb' && movieType !== 'kurdish') {
      return NextResponse.json({ 
        error: "movieType must be 'tmdb' or 'kurdish'",
        code: "INVALID_MOVIE_TYPE" 
      }, { status: 400 });
    }

    // Validate action
    const validActions = ['view', 'review', 'favorite', 'watch', 'unfavorite', 'remove_review'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: "Invalid action type",
        code: "INVALID_ACTION" 
      }, { status: 400 });
    }

    // Find existing analytics or create new
    let analytics = await db.select()
      .from(movieAnalytics)
      .where(and(
        eq(movieAnalytics.movieId, parseInt(movieId)),
        eq(movieAnalytics.movieType, movieType)
      ))
      .limit(1);

    let result;

    if (analytics.length === 0) {
      // Create new analytics record
      const initialData = {
        movieId: parseInt(movieId),
        movieType,
        totalViews: action === 'view' ? 1 : 0,
        totalReviews: action === 'review' ? 1 : 0,
        averageRating: 0,
        totalFavorites: action === 'favorite' ? 1 : 0,
        totalWatchTime: action === 'watch' ? (value || 0) : 0,
        popularityScore: 0,
        trendingScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      result = await db.insert(movieAnalytics)
        .values(initialData)
        .returning();
    } else {
      // Update existing analytics
      const current = analytics[0];
      const updates: any = { updatedAt: new Date().toISOString() };

      switch (action) {
        case 'view':
          updates.totalViews = current.totalViews + 1;
          break;
        case 'review':
          updates.totalReviews = current.totalReviews + 1;
          break;
        case 'favorite':
          updates.totalFavorites = current.totalFavorites + 1;
          break;
        case 'watch':
          updates.totalWatchTime = current.totalWatchTime + (value || 0);
          break;
        case 'unfavorite':
          updates.totalFavorites = Math.max(0, current.totalFavorites - 1);
          break;
        case 'remove_review':
          updates.totalReviews = Math.max(0, current.totalReviews - 1);
          break;
      }

      result = await db.update(movieAnalytics)
        .set(updates)
        .where(eq(movieAnalytics.id, current.id))
        .returning();
    }

    // Recalculate derived scores
    const updated = await updateDerivedScores(parseInt(movieId), movieType);

    return NextResponse.json(updated || result[0], { status: result.length > 0 ? 201 : 200 });

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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { totalViews, totalReviews, averageRating, totalFavorites, totalWatchTime } = requestBody;

    // Check if analytics exists
    const existing = await db.select()
      .from(movieAnalytics)
      .where(eq(movieAnalytics.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Movie analytics not found',
        code: 'ANALYTICS_NOT_FOUND' 
      }, { status: 404 });
    }

    // Build updates object
    const updates: any = { updatedAt: new Date().toISOString() };

    if (totalViews !== undefined) {
      if (totalViews < 0) {
        return NextResponse.json({ 
          error: "totalViews must be non-negative",
          code: "INVALID_TOTAL_VIEWS" 
        }, { status: 400 });
      }
      updates.totalViews = totalViews;
    }

    if (totalReviews !== undefined) {
      if (totalReviews < 0) {
        return NextResponse.json({ 
          error: "totalReviews must be non-negative",
          code: "INVALID_TOTAL_REVIEWS" 
        }, { status: 400 });
      }
      updates.totalReviews = totalReviews;
    }

    if (averageRating !== undefined) {
      if (averageRating < 0 || averageRating > 10) {
        return NextResponse.json({ 
          error: "averageRating must be between 0 and 10",
          code: "INVALID_AVERAGE_RATING" 
        }, { status: 400 });
      }
      updates.averageRating = averageRating;
    }

    if (totalFavorites !== undefined) {
      if (totalFavorites < 0) {
        return NextResponse.json({ 
          error: "totalFavorites must be non-negative",
          code: "INVALID_TOTAL_FAVORITES" 
        }, { status: 400 });
      }
      updates.totalFavorites = totalFavorites;
    }

    if (totalWatchTime !== undefined) {
      if (totalWatchTime < 0) {
        return NextResponse.json({ 
          error: "totalWatchTime must be non-negative",
          code: "INVALID_TOTAL_WATCH_TIME" 
        }, { status: 400 });
      }
      updates.totalWatchTime = totalWatchTime;
    }

    const result = await db.update(movieAnalytics)
      .set(updates)
      .where(eq(movieAnalytics.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Movie analytics not found',
        code: 'ANALYTICS_NOT_FOUND' 
      }, { status: 404 });
    }

    // Recalculate derived scores
    const updated = await updateDerivedScores(result[0].movieId, result[0].movieType);

    return NextResponse.json(updated || result[0]);

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

    const existing = await db.select()
      .from(movieAnalytics)
      .where(eq(movieAnalytics.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Movie analytics not found',
        code: 'ANALYTICS_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(movieAnalytics)
      .where(eq(movieAnalytics.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: "Movie analytics deleted successfully",
      deletedAnalytics: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// Helper function to update derived scores
async function updateDerivedScores(movieId: number, movieType: string) {
  try {
    // Get current analytics
    const analytics = await db.select()
      .from(movieAnalytics)
      .where(and(
        eq(movieAnalytics.movieId, movieId),
        eq(movieAnalytics.movieType, movieType)
      ))
      .limit(1);

    if (analytics.length === 0) return null;

    const current = analytics[0];

    // Recalculate average rating from actual reviews
    const reviewStats = await db.select({
      avgRating: avg(movieReviews.rating),
      count: count(movieReviews.id)
    })
      .from(movieReviews)
      .where(and(
        eq(movieReviews.movieId, movieId),
        eq(movieReviews.movieType, movieType)
      ));

    const averageRating = reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating.toFixed(1)) : 0;

    // Calculate popularity score (weighted formula)
    const popularityScore = (
      (current.totalViews * 1) +
      (current.totalReviews * 5) +
      (current.totalFavorites * 3) +
      (averageRating * current.totalReviews * 2)
    ) / 100;

    // Calculate trending score (time-weighted, recent activity gets higher weight)
    const daysSinceUpdate = Math.max(1, Math.floor((Date.now() - new Date(current.updatedAt).getTime()) / (1000 * 60 * 60 * 24)));
    const recencyWeight = Math.max(0.1, 1 / daysSinceUpdate);
    const trendingScore = popularityScore * recencyWeight;

    // Update the analytics record
    const updated = await db.update(movieAnalytics)
      .set({
        averageRating,
        popularityScore: Math.round(popularityScore * 100) / 100,
        trendingScore: Math.round(trendingScore * 100) / 100,
        updatedAt: new Date().toISOString()
      })
      .where(eq(movieAnalytics.id, current.id))
      .returning();

    return updated[0];
  } catch (error) {
    console.error('Error updating derived scores:', error);
    return null;
  }
}