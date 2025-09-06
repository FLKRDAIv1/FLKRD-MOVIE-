import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movieReviews, user } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single review by ID - no authentication required
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

    // List reviews with pagination and filters - no authentication required
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const movieId = searchParams.get('movieId');
    const movieType = searchParams.get('movieType');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const spoilerWarning = searchParams.get('spoilerWarning');
    const isComingSoon = searchParams.get('isComingSoon');
    const sort = searchParams.get('sort') || 'newest';
    const order = searchParams.get('order') || 'desc';

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
      userImage: user.image
    })
    .from(movieReviews)
    .leftJoin(user, eq(movieReviews.userId, user.id));

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(movieReviews.title, `%${search}%`),
          like(movieReviews.content, `%${search}%`)
        )
      );
    }

    if (movieId) {
      conditions.push(eq(movieReviews.movieId, parseInt(movieId)));
    }

    if (movieType) {
      conditions.push(eq(movieReviews.movieType, movieType));
    }

    if (minRating) {
      conditions.push(gte(movieReviews.rating, parseInt(minRating)));
    }

    if (maxRating) {
      conditions.push(lte(movieReviews.rating, parseInt(maxRating)));
    }

    if (spoilerWarning !== null && spoilerWarning !== undefined) {
      conditions.push(eq(movieReviews.spoilerWarning, spoilerWarning === 'true'));
    }

    if (isComingSoon !== null && isComingSoon !== undefined) {
      conditions.push(eq(movieReviews.isComingSoon, isComingSoon === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    let orderBy;
    switch (sort) {
      case 'oldest':
        orderBy = order === 'desc' ? desc(movieReviews.createdAt) : asc(movieReviews.createdAt);
        break;
      case 'mostHelpful':
        orderBy = order === 'desc' ? desc(movieReviews.helpful) : asc(movieReviews.helpful);
        break;
      case 'highestRated':
        orderBy = order === 'desc' ? desc(movieReviews.rating) : asc(movieReviews.rating);
        break;
      case 'lowestRated':
        orderBy = order === 'desc' ? asc(movieReviews.rating) : desc(movieReviews.rating);
        break;
      case 'newest':
      default:
        orderBy = order === 'desc' ? desc(movieReviews.createdAt) : asc(movieReviews.createdAt);
        break;
    }

    query = query.orderBy(orderBy);

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

    const { 
      movieId, 
      movieType, 
      title, 
      content, 
      rating, 
      isComingSoon, 
      spoilerWarning 
    } = requestBody;

    // Validate required fields
    if (!movieId || !movieType || !title || !content || rating === undefined) {
      return NextResponse.json({ 
        error: "Missing required fields: movieId, movieType, title, content, rating",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    // Validate movieId is positive integer
    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json({ 
        error: "movieId must be a positive integer",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    // Validate movieType
    const validMovieTypes = ['tmdb', 'kurdish', 'coming_soon'];
    if (!validMovieTypes.includes(movieType)) {
      return NextResponse.json({ 
        error: "movieType must be 'tmdb', 'kurdish', or 'coming_soon'",
        code: "INVALID_MOVIE_TYPE" 
      }, { status: 400 });
    }

    // Validate title is non-empty string
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return NextResponse.json({ 
        error: "Title cannot be empty",
        code: "EMPTY_TITLE" 
      }, { status: 400 });
    }

    // Validate content is non-empty string
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return NextResponse.json({ 
        error: "Content cannot be empty",
        code: "EMPTY_CONTENT" 
      }, { status: 400 });
    }

    // Validate rating is integer 1-10
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      return NextResponse.json({ 
        error: "Rating must be an integer between 1 and 10",
        code: "INVALID_RATING" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const newReview = await db.insert(movieReviews)
      .values({
        userId: user.id,
        movieId,
        movieType,
        title: trimmedTitle,
        content: trimmedContent,
        rating,
        isComingSoon: isComingSoon || false,
        helpful: 0,
        spoilerWarning: spoilerWarning || false,
        createdAt: now,
        updatedAt: now
      })
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
    if ('userId' in requestBody || 'user_id' in requestBody || 'authorId' in requestBody) {
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
      return NextResponse.json({ error: 'Review not found or access denied' }, { status: 404 });
    }

    const { 
      movieId, 
      movieType, 
      title, 
      content, 
      rating, 
      isComingSoon, 
      spoilerWarning 
    } = requestBody;

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

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
      const validMovieTypes = ['tmdb', 'kurdish', 'coming_soon'];
      if (!validMovieTypes.includes(movieType)) {
        return NextResponse.json({ 
          error: "movieType must be 'tmdb', 'kurdish', or 'coming_soon'",
          code: "INVALID_MOVIE_TYPE" 
        }, { status: 400 });
      }
      updates.movieType = movieType;
    }

    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        return NextResponse.json({ 
          error: "Title cannot be empty",
          code: "EMPTY_TITLE" 
        }, { status: 400 });
      }
      updates.title = trimmedTitle;
    }

    if (content !== undefined) {
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return NextResponse.json({ 
          error: "Content cannot be empty",
          code: "EMPTY_CONTENT" 
        }, { status: 400 });
      }
      updates.content = trimmedContent;
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
      updates.isComingSoon = Boolean(isComingSoon);
    }

    if (spoilerWarning !== undefined) {
      updates.spoilerWarning = Boolean(spoilerWarning);
    }

    const updated = await db.update(movieReviews)
      .set(updates)
      .where(and(eq(movieReviews.id, parseInt(id)), eq(movieReviews.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Review not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);

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

    // Check if review exists and belongs to user before deleting
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