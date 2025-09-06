import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movieReviews } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const review = await db.select()
        .from(movieReviews)
        .where(eq(movieReviews.id, parseInt(id)))
        .limit(1);

      if (review.length === 0) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      return NextResponse.json(review[0]);
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const movieId = searchParams.get('movieId');
    const movieType = searchParams.get('movieType');
    const rating = searchParams.get('rating');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select().from(movieReviews);
    let conditions = [];

    // Search functionality
    if (search) {
      conditions.push(
        or(
          like(movieReviews.title, `%${search}%`),
          like(movieReviews.content, `%${search}%`)
        )
      );
    }

    // Filter by movieId
    if (movieId && !isNaN(parseInt(movieId))) {
      conditions.push(eq(movieReviews.movieId, parseInt(movieId)));
    }

    // Filter by movieType
    if (movieType && ['tmdb', 'kurdish', 'coming_soon'].includes(movieType)) {
      conditions.push(eq(movieReviews.movieType, movieType));
    }

    // Filter by rating
    if (rating && !isNaN(parseInt(rating))) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 10) {
        conditions.push(eq(movieReviews.rating, ratingNum));
      }
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = sort === 'rating' ? movieReviews.rating : 
                     sort === 'helpful' ? movieReviews.helpful :
                     sort === 'updatedAt' ? movieReviews.updatedAt :
                     movieReviews.createdAt;

    query = query.orderBy(order === 'asc' ? asc(sortField) : desc(sortField));

    // Apply pagination
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

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { movieId, movieType, title, content, rating, isComingSoon, helpful, spoilerWarning } = requestBody;

    // Validate required fields
    if (!movieId || !Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json({ 
        error: "movieId must be a positive integer",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    if (!movieType || !['tmdb', 'kurdish', 'coming_soon'].includes(movieType)) {
      return NextResponse.json({ 
        error: "movieType must be 'tmdb', 'kurdish', or 'coming_soon'",
        code: "INVALID_MOVIE_TYPE" 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ 
        error: "Title is required and must be a non-empty string",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ 
        error: "Content is required and must be a non-empty string",
        code: "MISSING_CONTENT" 
      }, { status: 400 });
    }

    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 10) {
      return NextResponse.json({ 
        error: "Rating must be an integer between 1 and 10",
        code: "INVALID_RATING" 
      }, { status: 400 });
    }

    // Prepare insert data with defaults and sanitization
    const insertData = {
      userId: user.id,
      movieId: movieId,
      movieType: movieType,
      title: title.trim(),
      content: content.trim(),
      rating: rating,
      isComingSoon: isComingSoon === true ? 1 : 0,
      helpful: helpful && Number.isInteger(helpful) ? helpful : 0,
      spoilerWarning: spoilerWarning === true ? 1 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newReview = await db.insert(movieReviews)
      .values(insertData)
      .returning();

    return NextResponse.json(newReview[0], { status: 201 });

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

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user
    const existingReview = await db.select()
      .from(movieReviews)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const { movieId, movieType, title, content, rating, isComingSoon, helpful, spoilerWarning } = requestBody;
    let updates: any = {};

    // Validate and update fields if provided
    if (movieId !== undefined) {
      if (!Number.isInteger(movieId) || movieId <= 0) {
        return NextResponse.json({ 
          error: "movieId must be a positive integer",
          code: "INVALID_MOVIE_ID" 
        }, { status: 400 });
      }
      updates.movieId = movieId;
    }

    if (movieType !== undefined) {
      if (!['tmdb', 'kurdish', 'coming_soon'].includes(movieType)) {
        return NextResponse.json({ 
          error: "movieType must be 'tmdb', 'kurdish', or 'coming_soon'",
          code: "INVALID_MOVIE_TYPE" 
        }, { status: 400 });
      }
      updates.movieType = movieType;
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ 
          error: "Title must be a non-empty string",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ 
          error: "Content must be a non-empty string",
          code: "INVALID_CONTENT" 
        }, { status: 400 });
      }
      updates.content = content.trim();
    }

    if (rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
        return NextResponse.json({ 
          error: "Rating must be an integer between 1 and 10",
          code: "INVALID_RATING" 
        }, { status: 400 });
      }
      updates.rating = rating;
    }

    if (isComingSoon !== undefined) {
      updates.isComingSoon = isComingSoon === true ? 1 : 0;
    }

    if (helpful !== undefined) {
      if (Number.isInteger(helpful)) {
        updates.helpful = helpful;
      }
    }

    if (spoilerWarning !== undefined) {
      updates.spoilerWarning = spoilerWarning === true ? 1 : 0;
    }

    // Always update timestamp
    updates.updatedAt = new Date().toISOString();

    const updatedReview = await db.update(movieReviews)
      .set(updates)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .returning();

    if (updatedReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(updatedReview[0]);

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

    // Check if record exists and belongs to user before deleting
    const existingReview = await db.select()
      .from(movieReviews)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const deletedReview = await db.delete(movieReviews)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .returning();

    if (deletedReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Review deleted successfully',
      deletedReview: deletedReview[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}