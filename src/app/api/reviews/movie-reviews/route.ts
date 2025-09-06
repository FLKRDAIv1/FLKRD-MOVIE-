import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movieReviews, user } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single review fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const review = await db.select({
        id: movieReviews.id,
        userId: movieReviews.userId,
        movieId: movieReviews.movieId,
        movieType: movieReviews.movieType,
        title: movieReviews.title,
        content: movieReviews.content,
        rating: movieReviews.rating,
        isComingSoon: movieReviews.isComingSoon,
        helpful: movieReviews.helpful,
        spoilerWarning: movieReviews.spoilerWarning,
        createdAt: movieReviews.createdAt,
        updatedAt: movieReviews.updatedAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image
      })
      .from(movieReviews)
      .leftJoin(user, eq(movieReviews.userId, user.id))
      .where(eq(movieReviews.id, parseInt(id)))
      .limit(1);

      if (review.length === 0) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      return NextResponse.json(review[0], { status: 200 });
    }

    // List reviews with filtering
    const movieId = searchParams.get('movieId');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const spoilerWarning = searchParams.get('spoilerWarning');
    const isComingSoon = searchParams.get('isComingSoon');

    let query = db.select({
      id: movieReviews.id,
      userId: movieReviews.userId,
      movieId: movieReviews.movieId,
      movieType: movieReviews.movieType,
      title: movieReviews.title,
      content: movieReviews.content,
      rating: movieReviews.rating,
      isComingSoon: movieReviews.isComingSoon,
      helpful: movieReviews.helpful,
      spoilerWarning: movieReviews.spoilerWarning,
      createdAt: movieReviews.createdAt,
      updatedAt: movieReviews.updatedAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image
    })
    .from(movieReviews)
    .leftJoin(user, eq(movieReviews.userId, user.id));

    const conditions = [];

    // Filter by movieId
    if (movieId && !isNaN(parseInt(movieId))) {
      conditions.push(eq(movieReviews.movieId, parseInt(movieId)));
    }

    // Filter by userId
    if (userId) {
      conditions.push(eq(movieReviews.userId, userId));
    }

    // Filter by rating range
    if (minRating && !isNaN(parseInt(minRating))) {
      conditions.push(gte(movieReviews.rating, parseInt(minRating)));
    }

    if (maxRating && !isNaN(parseInt(maxRating))) {
      conditions.push(lte(movieReviews.rating, parseInt(maxRating)));
    }

    // Filter by spoiler warning
    if (spoilerWarning === 'true') {
      conditions.push(eq(movieReviews.spoilerWarning, true));
    } else if (spoilerWarning === 'false') {
      conditions.push(eq(movieReviews.spoilerWarning, false));
    }

    // Filter by coming soon
    if (isComingSoon === 'true') {
      conditions.push(eq(movieReviews.isComingSoon, true));
    } else if (isComingSoon === 'false') {
      conditions.push(eq(movieReviews.isComingSoon, false));
    }

    // Search in title and content
    if (search) {
      const searchCondition = or(
        like(movieReviews.title, `%${search}%`),
        like(movieReviews.content, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.orderBy(asc(movieReviews.createdAt));
        break;
      case 'mostHelpful':
        query = query.orderBy(desc(movieReviews.helpful));
        break;
      case 'highestRated':
        query = query.orderBy(desc(movieReviews.rating));
        break;
      case 'lowestRated':
        query = query.orderBy(asc(movieReviews.rating));
        break;
      case 'newest':
      default:
        query = query.orderBy(desc(movieReviews.createdAt));
        break;
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });

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

    // Security: Check for forbidden user identifier fields
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { movieId, movieType, title, content, rating, isComingSoon, spoilerWarning } = requestBody;

    // Validate required fields
    if (!movieId || isNaN(parseInt(movieId)) || parseInt(movieId) <= 0) {
      return NextResponse.json({ 
        error: "Valid movie ID is required",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    if (!movieType || typeof movieType !== 'string' || movieType.trim().length === 0) {
      return NextResponse.json({ 
        error: "Movie type is required",
        code: "MISSING_MOVIE_TYPE" 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ 
        error: "Content is required",
        code: "MISSING_CONTENT" 
      }, { status: 400 });
    }

    if (!rating || isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 10) {
      return NextResponse.json({ 
        error: "Rating must be between 1 and 10",
        code: "INVALID_RATING" 
      }, { status: 400 });
    }

    // Validate movieType
    const validMovieTypes = ['kurdish', 'tmdb'];
    if (!validMovieTypes.includes(movieType.toLowerCase())) {
      return NextResponse.json({ 
        error: "Movie type must be 'kurdish' or 'tmdb'",
        code: "INVALID_MOVIE_TYPE" 
      }, { status: 400 });
    }

    const newReview = await db.insert(movieReviews)
      .values({
        userId: user.id,
        movieId: parseInt(movieId),
        movieType: movieType.trim(),
        title: title.trim(),
        content: content.trim(),
        rating: parseInt(rating),
        isComingSoon: isComingSoon === true,
        spoilerWarning: spoilerWarning === true,
        helpful: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // Fetch the created review with user details
    const createdReview = await db.select({
      id: movieReviews.id,
      userId: movieReviews.userId,
      movieId: movieReviews.movieId,
      movieType: movieReviews.movieType,
      title: movieReviews.title,
      content: movieReviews.content,
      rating: movieReviews.rating,
      isComingSoon: movieReviews.isComingSoon,
      helpful: movieReviews.helpful,
      spoilerWarning: movieReviews.spoilerWarning,
      createdAt: movieReviews.createdAt,
      updatedAt: movieReviews.updatedAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image
    })
    .from(movieReviews)
    .leftJoin(user, eq(movieReviews.userId, user.id))
    .where(eq(movieReviews.id, newReview[0].id))
    .limit(1);

    return NextResponse.json(createdReview[0], { status: 201 });

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

    // Security: Check for forbidden user identifier fields
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if review exists and belongs to user
    const existingReview = await db.select()
      .from(movieReviews)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const { title, content, rating, spoilerWarning, isComingSoon } = requestBody;
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and add fields to update
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ 
          error: "Title cannot be empty",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ 
          error: "Content cannot be empty",
          code: "INVALID_CONTENT" 
        }, { status: 400 });
      }
      updates.content = content.trim();
    }

    if (rating !== undefined) {
      if (isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 10) {
        return NextResponse.json({ 
          error: "Rating must be between 1 and 10",
          code: "INVALID_RATING" 
        }, { status: 400 });
      }
      updates.rating = parseInt(rating);
    }

    if (spoilerWarning !== undefined) {
      updates.spoilerWarning = spoilerWarning === true;
    }

    if (isComingSoon !== undefined) {
      updates.isComingSoon = isComingSoon === true;
    }

    const updated = await db.update(movieReviews)
      .set(updates)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Fetch updated review with user details
    const updatedReview = await db.select({
      id: movieReviews.id,
      userId: movieReviews.userId,
      movieId: movieReviews.movieId,
      movieType: movieReviews.movieType,
      title: movieReviews.title,
      content: movieReviews.content,
      rating: movieReviews.rating,
      isComingSoon: movieReviews.isComingSoon,
      helpful: movieReviews.helpful,
      spoilerWarning: movieReviews.spoilerWarning,
      createdAt: movieReviews.createdAt,
      updatedAt: movieReviews.updatedAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image
    })
    .from(movieReviews)
    .leftJoin(user, eq(movieReviews.userId, user.id))
    .where(eq(movieReviews.id, parseInt(id)))
    .limit(1);

    return NextResponse.json(updatedReview[0], { status: 200 });

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

    // Check if review exists and belongs to user
    const existingReview = await db.select()
      .from(movieReviews)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const deleted = await db.delete(movieReviews)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Review deleted successfully',
      deletedReview: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}