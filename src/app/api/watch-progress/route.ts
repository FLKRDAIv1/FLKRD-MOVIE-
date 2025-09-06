import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { watchProgress } from '@/db/schema';
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
    const completed = searchParams.get('completed');
    const sort = searchParams.get('sort') || 'lastWatchedAt';
    const order = searchParams.get('order') || 'desc';

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(watchProgress)
        .where(and(eq(watchProgress.id, parseInt(id)), eq(watchProgress.userId, user.id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Watch progress not found' }, { status: 404 });
      }

      return NextResponse.json(record[0]);
    }

    // List with filters
    let query = db.select().from(watchProgress).where(eq(watchProgress.userId, user.id));

    // Filter by completed status
    if (completed !== null) {
      const isCompleted = completed === 'true';
      query = query.where(and(eq(watchProgress.userId, user.id), eq(watchProgress.completed, isCompleted)));
    }

    // Add sorting
    const sortField = sort === 'progressPercentage' ? watchProgress.progressPercentage :
                     sort === 'currentTime' ? watchProgress.currentTime :
                     sort === 'movieId' ? watchProgress.movieId :
                     watchProgress.lastWatchedAt;
    
    if (order === 'asc') {
      query = query.orderBy(asc(sortField));
    } else {
      query = query.orderBy(desc(sortField));
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

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { movieId, currentTime, totalDuration } = requestBody;

    // Validate required fields
    if (!movieId) {
      return NextResponse.json({ 
        error: "Movie ID is required",
        code: "MISSING_MOVIE_ID" 
      }, { status: 400 });
    }

    if (currentTime === undefined || currentTime === null) {
      return NextResponse.json({ 
        error: "Current time is required",
        code: "MISSING_CURRENT_TIME" 
      }, { status: 400 });
    }

    if (!totalDuration) {
      return NextResponse.json({ 
        error: "Total duration is required",
        code: "MISSING_TOTAL_DURATION" 
      }, { status: 400 });
    }

    // Validate field types
    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json({ 
        error: "Movie ID must be a positive integer",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    if (!Number.isInteger(currentTime) || currentTime < 0) {
      return NextResponse.json({ 
        error: "Current time must be a non-negative integer",
        code: "INVALID_CURRENT_TIME" 
      }, { status: 400 });
    }

    if (!Number.isInteger(totalDuration) || totalDuration <= 0) {
      return NextResponse.json({ 
        error: "Total duration must be a positive integer",
        code: "INVALID_TOTAL_DURATION" 
      }, { status: 400 });
    }

    // Validate current time doesn't exceed total duration
    if (currentTime > totalDuration) {
      return NextResponse.json({ 
        error: "Current time cannot exceed total duration",
        code: "CURRENT_TIME_EXCEEDS_DURATION" 
      }, { status: 400 });
    }

    // Calculate progress percentage (capped at 100)
    const progressPercentage = Math.min((currentTime / totalDuration) * 100, 100);
    
    // Set completed status based on progress
    const completed = progressPercentage >= 95;

    const insertData = {
      userId: user.id,
      movieId,
      currentTime,
      totalDuration,
      progressPercentage,
      lastWatchedAt: new Date().toISOString(),
      completed
    };

    const newRecord = await db.insert(watchProgress)
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
      .from(watchProgress)
      .where(and(eq(watchProgress.id, parseInt(id)), eq(watchProgress.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Watch progress not found' }, { status: 404 });
    }

    const current = existingRecord[0];
    const { movieId, currentTime, totalDuration } = requestBody;

    // Validate updated fields if provided
    if (movieId !== undefined) {
      if (!Number.isInteger(movieId) || movieId <= 0) {
        return NextResponse.json({ 
          error: "Movie ID must be a positive integer",
          code: "INVALID_MOVIE_ID" 
        }, { status: 400 });
      }
    }

    if (currentTime !== undefined) {
      if (!Number.isInteger(currentTime) || currentTime < 0) {
        return NextResponse.json({ 
          error: "Current time must be a non-negative integer",
          code: "INVALID_CURRENT_TIME" 
        }, { status: 400 });
      }
    }

    if (totalDuration !== undefined) {
      if (!Number.isInteger(totalDuration) || totalDuration <= 0) {
        return NextResponse.json({ 
          error: "Total duration must be a positive integer",
          code: "INVALID_TOTAL_DURATION" 
        }, { status: 400 });
      }
    }

    // Use current values if not provided in update
    const updatedCurrentTime = currentTime !== undefined ? currentTime : current.currentTime;
    const updatedTotalDuration = totalDuration !== undefined ? totalDuration : current.totalDuration;

    // Validate current time doesn't exceed total duration
    if (updatedCurrentTime > updatedTotalDuration) {
      return NextResponse.json({ 
        error: "Current time cannot exceed total duration",
        code: "CURRENT_TIME_EXCEEDS_DURATION" 
      }, { status: 400 });
    }

    // Recalculate progress percentage if current_time or total_duration changed
    let updatedProgressPercentage = current.progressPercentage;
    if (currentTime !== undefined || totalDuration !== undefined) {
      updatedProgressPercentage = Math.min((updatedCurrentTime / updatedTotalDuration) * 100, 100);
    }

    // Auto-set completed if progress >= 95%
    const updatedCompleted = updatedProgressPercentage >= 95;

    const updates = {
      lastWatchedAt: new Date().toISOString()
    };

    if (movieId !== undefined) updates.movieId = movieId;
    if (currentTime !== undefined) updates.currentTime = currentTime;
    if (totalDuration !== undefined) updates.totalDuration = totalDuration;
    if (currentTime !== undefined || totalDuration !== undefined) {
      updates.progressPercentage = updatedProgressPercentage;
      updates.completed = updatedCompleted;
    }

    const updated = await db.update(watchProgress)
      .set(updates)
      .where(and(eq(watchProgress.id, parseInt(id)), eq(watchProgress.userId, user.id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Watch progress not found' }, { status: 404 });
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

    const deleted = await db.delete(watchProgress)
      .where(and(eq(watchProgress.id, parseInt(id)), eq(watchProgress.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Watch progress not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Watch progress deleted successfully',
      deleted: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}