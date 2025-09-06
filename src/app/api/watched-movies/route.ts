import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { watchedMovies } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'watchedAt';
    const order = searchParams.get('order') || 'desc';

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(watchedMovies)
        .where(and(eq(watchedMovies.id, parseInt(id)), eq(watchedMovies.userId, user.id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Watched movie not found' }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }

    // List with filters
    let query = db.select().from(watchedMovies).where(eq(watchedMovies.userId, user.id));

    if (search) {
      query = query.where(and(
        eq(watchedMovies.userId, user.id),
        like(watchedMovies.movieTitle, `%${search}%`)
      ));
    }

    // Apply sorting
    const orderFn = order === 'asc' ? asc : desc;
    if (sort === 'movieTitle') {
      query = query.orderBy(orderFn(watchedMovies.movieTitle));
    } else if (sort === 'rating') {
      query = query.orderBy(orderFn(watchedMovies.rating));
    } else {
      query = query.orderBy(orderFn(watchedMovies.watchedAt));
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
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const requestBody = await request.json();
    const { movieId, movieTitle, moviePoster, rating } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!movieId || typeof movieId !== 'number') {
      return NextResponse.json({ 
        error: "Movie ID is required and must be a number",
        code: "MISSING_MOVIE_ID" 
      }, { status: 400 });
    }

    if (!movieTitle || typeof movieTitle !== 'string' || movieTitle.trim().length === 0) {
      return NextResponse.json({ 
        error: "Movie title is required and must be non-empty text",
        code: "MISSING_MOVIE_TITLE" 
      }, { status: 400 });
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      if (typeof rating !== 'number' || rating < 1 || rating > 10 || !Number.isInteger(rating)) {
        return NextResponse.json({ 
          error: "Rating must be an integer between 1 and 10",
          code: "INVALID_RATING" 
        }, { status: 400 });
      }
    }

    const insertData = {
      userId: user.id,
      movieId: movieId,
      movieTitle: movieTitle.trim(),
      moviePoster: moviePoster?.trim() || null,
      watchedAt: new Date().toISOString(),
      rating: rating || null
    };

    const newRecord = await db.insert(watchedMovies)
      .values(insertData)
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });

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
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { rating, watchedAt } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user
    const existingRecord = await db.select()
      .from(watchedMovies)
      .where(and(eq(watchedMovies.id, parseInt(id)), eq(watchedMovies.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Watched movie not found' }, { status: 404 });
    }

    const updateData: any = {};

    // Validate and set rating if provided
    if (rating !== undefined) {
      if (rating !== null) {
        if (typeof rating !== 'number' || rating < 1 || rating > 10 || !Number.isInteger(rating)) {
          return NextResponse.json({ 
            error: "Rating must be an integer between 1 and 10",
            code: "INVALID_RATING" 
          }, { status: 400 });
        }
      }
      updateData.rating = rating;
    }

    // Validate and set watchedAt if provided
    if (watchedAt !== undefined) {
      if (typeof watchedAt !== 'string' || watchedAt.trim().length === 0) {
        return NextResponse.json({ 
          error: "Watched at must be a valid timestamp string",
          code: "INVALID_WATCHED_AT" 
        }, { status: 400 });
      }
      updateData.watchedAt = watchedAt.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATE_FIELDS" 
      }, { status: 400 });
    }

    const updated = await db.update(watchedMovies)
      .set(updateData)
      .where(and(eq(watchedMovies.id, parseInt(id)), eq(watchedMovies.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Watched movie not found' }, { status: 404 });
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
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user
    const existingRecord = await db.select()
      .from(watchedMovies)
      .where(and(eq(watchedMovies.id, parseInt(id)), eq(watchedMovies.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Watched movie not found' }, { status: 404 });
    }

    const deleted = await db.delete(watchedMovies)
      .where(and(eq(watchedMovies.id, parseInt(id)), eq(watchedMovies.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Watched movie not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Watched movie deleted successfully',
      deletedRecord: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}