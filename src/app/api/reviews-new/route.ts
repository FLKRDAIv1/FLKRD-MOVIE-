import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviews } from '@/db/schema';
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

      const record = await db.select()
        .from(reviews)
        .where(eq(reviews.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const movieType = searchParams.get('movieType');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select().from(reviews);
    
    const conditions = [];

    if (search) {
      conditions.push(or(
        like(reviews.title, `%${search}%`),
        like(reviews.content, `%${search}%`)
      ));
    }

    if (movieType) {
      conditions.push(eq(reviews.movieType, movieType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortOrder = order === 'asc' ? asc : desc;
    if (sort === 'title') {
      query = query.orderBy(sortOrder(reviews.title));
    } else if (sort === 'rating') {
      query = query.orderBy(sortOrder(reviews.rating));
    } else if (sort === 'helpful') {
      query = query.orderBy(sortOrder(reviews.helpful));
    } else {
      query = query.orderBy(sortOrder(reviews.createdAt));
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
    const { movieId, movieType, title, content, rating, isComingSoon, spoilerWarning } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

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

    const insertData = {
      userId: user.id,
      movieId: parseInt(movieId),
      movieType: movieType.trim(),
      title: title.trim(),
      content: content.trim(),
      rating: parseInt(rating),
      isComingSoon: Boolean(isComingSoon),
      spoilerWarning: Boolean(spoilerWarning),
      helpful: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newRecord = await db.insert(reviews)
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

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user
    const existingRecord = await db.select()
      .from(reviews)
      .where(and(eq(reviews.id, parseInt(id)), eq(reviews.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (requestBody.movieId !== undefined) {
      updates.movieId = parseInt(requestBody.movieId);
    }

    if (requestBody.movieType !== undefined) {
      updates.movieType = requestBody.movieType.trim();
    }

    if (requestBody.title !== undefined) {
      if (!requestBody.title.trim()) {
        return NextResponse.json({ 
          error: "Title cannot be empty",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updates.title = requestBody.title.trim();
    }

    if (requestBody.content !== undefined) {
      if (!requestBody.content.trim()) {
        return NextResponse.json({ 
          error: "Content cannot be empty",
          code: "INVALID_CONTENT" 
        }, { status: 400 });
      }
      updates.content = requestBody.content.trim();
    }

    if (requestBody.rating !== undefined) {
      const rating = parseInt(requestBody.rating);
      if (rating < 1 || rating > 10) {
        return NextResponse.json({ 
          error: "Rating must be between 1 and 10",
          code: "INVALID_RATING" 
        }, { status: 400 });
      }
      updates.rating = rating;
    }

    if (requestBody.isComingSoon !== undefined) {
      updates.isComingSoon = Boolean(requestBody.isComingSoon);
    }

    if (requestBody.spoilerWarning !== undefined) {
      updates.spoilerWarning = Boolean(requestBody.spoilerWarning);
    }

    if (requestBody.helpful !== undefined) {
      updates.helpful = parseInt(requestBody.helpful) || 0;
    }

    const updated = await db.update(reviews)
      .set(updates)
      .where(and(eq(reviews.id, parseInt(id)), eq(reviews.userId, user.id)))
      .returning();

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
      .from(reviews)
      .where(and(eq(reviews.id, parseInt(id)), eq(reviews.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const deleted = await db.delete(reviews)
      .where(and(eq(reviews.id, parseInt(id)), eq(reviews.userId, user.id)))
      .returning();

    return NextResponse.json({
      message: 'Review deleted successfully',
      deletedRecord: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}