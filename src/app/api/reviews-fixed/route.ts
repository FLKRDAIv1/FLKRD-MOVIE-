import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movieReviews, user } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (isNaN(parseInt(id))) {
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

      return NextResponse.json(review[0]);
    }

    // List with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const movieId = searchParams.get('movieId');
    const movieType = searchParams.get('movieType');
    const userId = searchParams.get('userId');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const spoilerWarning = searchParams.get('spoilerWarning');
    const isComingSoon = searchParams.get('isComingSoon');
    const sort = searchParams.get('sort') || 'newest';

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

    // Build where conditions
    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(movieReviews.title, `%${search}%`),
          like(movieReviews.content, `%${search}%`)
        )
      );
    }

    if (movieId) {
      whereConditions.push(eq(movieReviews.movieId, parseInt(movieId)));
    }

    if (movieType) {
      whereConditions.push(eq(movieReviews.movieType, movieType));
    }

    if (userId) {
      whereConditions.push(eq(movieReviews.userId, userId));
    }

    if (minRating) {
      whereConditions.push(gte(movieReviews.rating, parseInt(minRating)));
    }

    if (maxRating) {
      whereConditions.push(lte(movieReviews.rating, parseInt(maxRating)));
    }

    if (spoilerWarning !== null && spoilerWarning !== undefined) {
      whereConditions.push(eq(movieReviews.spoilerWarning, spoilerWarning === 'true' ? 1 : 0));
    }

    if (isComingSoon !== null && isComingSoon !== undefined) {
      whereConditions.push(eq(movieReviews.isComingSoon, isComingSoon === 'true' ? 1 : 0));
    }

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
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
    if ('userId' in requestBody || 'user_id' in requestBody || 'authorId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { movieId, movieType, title, content, rating, spoilerWarning, isComingSoon } = requestBody;

    // Validate required fields
    if (!movieId) {
      return NextResponse.json({ 
        error: "Movie ID is required",
        code: "MISSING_MOVIE_ID" 
      }, { status: 400 });
    }

    if (!movieType) {
      return NextResponse.json({ 
        error: "Movie type is required",
        code: "MISSING_MOVIE_TYPE" 
      }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ 
        error: "Content is required",
        code: "MISSING_CONTENT" 
      }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 10) {
      return NextResponse.json({ 
        error: "Rating must be between 1 and 10",
        code: "INVALID_RATING" 
      }, { status: 400 });
    }

    // Validate movieType
    if (!['tmdb', 'kurdish', 'coming_soon'].includes(movieType)) {
      return NextResponse.json({ 
        error: "Movie type must be 'tmdb', 'kurdish', or 'coming_soon'",
        code: "INVALID_MOVIE_TYPE" 
      }, { status: 400 });
    }

    const insertData = {
      userId: user.id,
      movieId: parseInt(movieId),
      movieType: movieType.trim(),
      title: title.trim(),
      content: content.trim(),
      rating: parseInt(rating),
      isComingSoon: isComingSoon ? 1 : 0,
      helpful: 0,
      spoilerWarning: spoilerWarning ? 1 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newReview = await db.insert(movieReviews)
      .values(insertData)
      .returning();

    // Get the created review with user details
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

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody || 'authorId' in requestBody) {
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
      return NextResponse.json({ error: 'Review not found or access denied' }, { status: 404 });
    }

    const { title, content, rating, spoilerWarning, isComingSoon } = requestBody;

    // Build update object only with provided fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json({ 
          error: "Title cannot be empty",
          code: "EMPTY_TITLE" 
        }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return NextResponse.json({ 
          error: "Content cannot be empty",
          code: "EMPTY_CONTENT" 
        }, { status: 400 });
      }
      updates.content = content.trim();
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 10) {
        return NextResponse.json({ 
          error: "Rating must be between 1 and 10",
          code: "INVALID_RATING" 
        }, { status: 400 });
      }
      updates.rating = parseInt(rating);
    }

    if (spoilerWarning !== undefined) {
      updates.spoilerWarning = spoilerWarning ? 1 : 0;
    }

    if (isComingSoon !== undefined) {
      updates.isComingSoon = isComingSoon ? 1 : 0;
    }

    const updated = await db.update(movieReviews)
      .set(updates)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Review not found or access denied' }, { status: 404 });
    }

    // Get updated review with user details
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

    // Check if record exists and belongs to user
    const existingReview = await db.select()
      .from(movieReviews)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found or access denied' }, { status: 404 });
    }

    const deleted = await db.delete(movieReviews)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Review not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Review deleted successfully',
      deletedReview: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}