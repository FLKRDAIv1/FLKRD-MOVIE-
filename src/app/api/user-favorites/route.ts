import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userFavorites } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const movieType = searchParams.get('type');

    let query = db.select().from(userFavorites).where(eq(userFavorites.userId, user.id));

    if (movieType && (movieType === 'kurdish' || movieType === 'tmdb')) {
      query = query.where(and(
        eq(userFavorites.userId, user.id),
        eq(userFavorites.movieType, movieType)
      ));
    }

    const results = await query
      .orderBy(desc(userFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET favorites error:', error);
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
    const { movieId, movieType } = requestBody;

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

    // Validate movieId is positive integer
    const parsedMovieId = parseInt(movieId);
    if (isNaN(parsedMovieId) || parsedMovieId <= 0) {
      return NextResponse.json({ 
        error: "Movie ID must be a positive integer",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    // Validate movieType
    if (movieType !== 'kurdish' && movieType !== 'tmdb') {
      return NextResponse.json({ 
        error: "Movie type must be 'kurdish' or 'tmdb'",
        code: "INVALID_MOVIE_TYPE" 
      }, { status: 400 });
    }

    // Check for duplicates
    const existingFavorite = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, user.id),
        eq(userFavorites.movieId, parsedMovieId),
        eq(userFavorites.movieType, movieType)
      ))
      .limit(1);

    if (existingFavorite.length > 0) {
      return NextResponse.json({ 
        error: "Movie is already in favorites",
        code: "DUPLICATE_FAVORITE" 
      }, { status: 409 });
    }

    // Insert new favorite
    const newFavorite = await db.insert(userFavorites)
      .values({
        userId: user.id,
        movieId: parsedMovieId,
        movieType: movieType,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newFavorite[0], { status: 201 });
  } catch (error) {
    console.error('POST favorites error:', error);
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

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const parsedId = parseInt(id);

    // Check if favorite exists and belongs to user
    const existingFavorite = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.id, parsedId),
        eq(userFavorites.userId, user.id)
      ))
      .limit(1);

    if (existingFavorite.length === 0) {
      return NextResponse.json({ 
        error: 'Favorite not found' 
      }, { status: 404 });
    }

    // Delete the favorite
    const deleted = await db.delete(userFavorites)
      .where(and(
        eq(userFavorites.id, parsedId),
        eq(userFavorites.userId, user.id)
      ))
      .returning();

    return NextResponse.json({ 
      message: 'Favorite removed successfully',
      deleted: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE favorites error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}