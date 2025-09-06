import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kurdishMovies } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

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

      const movie = await db.select()
        .from(kurdishMovies)
        .where(eq(kurdishMovies.id, parseInt(id)))
        .limit(1);

      if (movie.length === 0) {
        return NextResponse.json({ 
          error: 'Kurdish movie not found',
          code: 'MOVIE_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(movie[0]);
    }

    // List with pagination, search, filtering, and sorting
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const hasDub = searchParams.get('has_dub');
    const hasSubtitle = searchParams.get('has_subtitle');
    const isKurdish = searchParams.get('is_kurdish');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select().from(kurdishMovies);

    // Build where conditions
    const conditions = [];

    // Search across title and title_kurdish
    if (search) {
      conditions.push(
        or(
          like(kurdishMovies.title, `%${search}%`),
          like(kurdishMovies.titleKurdish, `%${search}%`)
        )
      );
    }

    // Filter by Kurdish dub availability
    if (hasDub !== null) {
      const hasDubBool = hasDub === 'true';
      conditions.push(eq(kurdishMovies.hasKurdishDub, hasDubBool));
    }

    // Filter by Kurdish subtitle availability
    if (hasSubtitle !== null) {
      const hasSubtitleBool = hasSubtitle === 'true';
      conditions.push(eq(kurdishMovies.hasKurdishSubtitle, hasSubtitleBool));
    }

    // Filter by Kurdish production
    if (isKurdish !== null) {
      const isKurdishBool = isKurdish === 'true';
      conditions.push(eq(kurdishMovies.isKurdishProduction, isKurdishBool));
    }

    // Apply where conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const validSortFields = ['releaseDate', 'voteAverage', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
    const sortOrder = order.toLowerCase() === 'asc' ? asc : desc;

    if (sortField === 'releaseDate') {
      query = query.orderBy(sortOrder(kurdishMovies.releaseDate));
    } else if (sortField === 'voteAverage') {
      query = query.orderBy(sortOrder(kurdishMovies.voteAverage));
    } else if (sortField === 'updatedAt') {
      query = query.orderBy(sortOrder(kurdishMovies.updatedAt));
    } else {
      query = query.orderBy(sortOrder(kurdishMovies.createdAt));
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
    const requestBody = await request.json();
    const {
      tmdbId,
      title,
      titleKurdish,
      overview,
      overviewKurdish,
      posterPath,
      backdropPath,
      releaseDate,
      voteAverage,
      genreIds,
      hasKurdishDub = false,
      hasKurdishSubtitle = false,
      kurdishDubQuality,
      kurdishSubtitleQuality,
      streamingUrl,
      isKurdishProduction = false
    } = requestBody;

    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json({ 
        error: "Title is required and cannot be empty",
        code: "TITLE_REQUIRED" 
      }, { status: 400 });
    }

    // Validate tmdbId if provided
    if (tmdbId !== undefined && tmdbId !== null && (!Number.isInteger(tmdbId) || tmdbId <= 0)) {
      return NextResponse.json({ 
        error: "TMDB ID must be a positive integer",
        code: "INVALID_TMDB_ID" 
      }, { status: 400 });
    }

    // Validate vote_average if provided
    if (voteAverage !== undefined && voteAverage !== null && (typeof voteAverage !== 'number' || voteAverage < 0 || voteAverage > 10)) {
      return NextResponse.json({ 
        error: "Vote average must be a number between 0.0 and 10.0",
        code: "INVALID_VOTE_AVERAGE" 
      }, { status: 400 });
    }

    // Validate quality fields
    const validQualities = ['excellent', 'good', 'fair', 'poor'];
    if (kurdishDubQuality && !validQualities.includes(kurdishDubQuality)) {
      return NextResponse.json({ 
        error: "Kurdish dub quality must be one of: excellent, good, fair, poor",
        code: "INVALID_DUB_QUALITY" 
      }, { status: 400 });
    }

    if (kurdishSubtitleQuality && !validQualities.includes(kurdishSubtitleQuality)) {
      return NextResponse.json({ 
        error: "Kurdish subtitle quality must be one of: excellent, good, fair, poor",
        code: "INVALID_SUBTITLE_QUALITY" 
      }, { status: 400 });
    }

    // Prepare insert data with sanitization and defaults
    const insertData = {
      tmdbId: tmdbId || null,
      title: title.trim(),
      titleKurdish: titleKurdish ? titleKurdish.trim() : null,
      overview: overview ? overview.trim() : null,
      overviewKurdish: overviewKurdish ? overviewKurdish.trim() : null,
      posterPath: posterPath ? posterPath.trim() : null,
      backdropPath: backdropPath ? backdropPath.trim() : null,
      releaseDate: releaseDate || null,
      voteAverage: voteAverage || null,
      genreIds: genreIds || null,
      hasKurdishDub: Boolean(hasKurdishDub),
      hasKurdishSubtitle: Boolean(hasKurdishSubtitle),
      kurdishDubQuality: kurdishDubQuality || null,
      kurdishSubtitleQuality: kurdishSubtitleQuality || null,
      streamingUrl: streamingUrl ? streamingUrl.trim() : null,
      isKurdishProduction: Boolean(isKurdishProduction),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newMovie = await db.insert(kurdishMovies)
      .values(insertData)
      .returning();

    return NextResponse.json(newMovie[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const {
      tmdbId,
      title,
      titleKurdish,
      overview,
      overviewKurdish,
      posterPath,
      backdropPath,
      releaseDate,
      voteAverage,
      genreIds,
      hasKurdishDub,
      hasKurdishSubtitle,
      kurdishDubQuality,
      kurdishSubtitleQuality,
      streamingUrl,
      isKurdishProduction
    } = requestBody;

    // Check if record exists
    const existingMovie = await db.select()
      .from(kurdishMovies)
      .where(eq(kurdishMovies.id, parseInt(id)))
      .limit(1);

    if (existingMovie.length === 0) {
      return NextResponse.json({ 
        error: 'Kurdish movie not found',
        code: 'MOVIE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate title if provided
    if (title !== undefined && (!title || title.trim() === '')) {
      return NextResponse.json({ 
        error: "Title cannot be empty",
        code: "INVALID_TITLE" 
      }, { status: 400 });
    }

    // Validate tmdbId if provided
    if (tmdbId !== undefined && tmdbId !== null && (!Number.isInteger(tmdbId) || tmdbId <= 0)) {
      return NextResponse.json({ 
        error: "TMDB ID must be a positive integer",
        code: "INVALID_TMDB_ID" 
      }, { status: 400 });
    }

    // Validate vote_average if provided
    if (voteAverage !== undefined && voteAverage !== null && (typeof voteAverage !== 'number' || voteAverage < 0 || voteAverage > 10)) {
      return NextResponse.json({ 
        error: "Vote average must be a number between 0.0 and 10.0",
        code: "INVALID_VOTE_AVERAGE" 
      }, { status: 400 });
    }

    // Validate quality fields
    const validQualities = ['excellent', 'good', 'fair', 'poor'];
    if (kurdishDubQuality !== undefined && kurdishDubQuality !== null && !validQualities.includes(kurdishDubQuality)) {
      return NextResponse.json({ 
        error: "Kurdish dub quality must be one of: excellent, good, fair, poor",
        code: "INVALID_DUB_QUALITY" 
      }, { status: 400 });
    }

    if (kurdishSubtitleQuality !== undefined && kurdishSubtitleQuality !== null && !validQualities.includes(kurdishSubtitleQuality)) {
      return NextResponse.json({ 
        error: "Kurdish subtitle quality must be one of: excellent, good, fair, poor",
        code: "INVALID_SUBTITLE_QUALITY" 
      }, { status: 400 });
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (tmdbId !== undefined) updates.tmdbId = tmdbId;
    if (title !== undefined) updates.title = title.trim();
    if (titleKurdish !== undefined) updates.titleKurdish = titleKurdish ? titleKurdish.trim() : null;
    if (overview !== undefined) updates.overview = overview ? overview.trim() : null;
    if (overviewKurdish !== undefined) updates.overviewKurdish = overviewKurdish ? overviewKurdish.trim() : null;
    if (posterPath !== undefined) updates.posterPath = posterPath ? posterPath.trim() : null;
    if (backdropPath !== undefined) updates.backdropPath = backdropPath ? backdropPath.trim() : null;
    if (releaseDate !== undefined) updates.releaseDate = releaseDate;
    if (voteAverage !== undefined) updates.voteAverage = voteAverage;
    if (genreIds !== undefined) updates.genreIds = genreIds;
    if (hasKurdishDub !== undefined) updates.hasKurdishDub = Boolean(hasKurdishDub);
    if (hasKurdishSubtitle !== undefined) updates.hasKurdishSubtitle = Boolean(hasKurdishSubtitle);
    if (kurdishDubQuality !== undefined) updates.kurdishDubQuality = kurdishDubQuality;
    if (kurdishSubtitleQuality !== undefined) updates.kurdishSubtitleQuality = kurdishSubtitleQuality;
    if (streamingUrl !== undefined) updates.streamingUrl = streamingUrl ? streamingUrl.trim() : null;
    if (isKurdishProduction !== undefined) updates.isKurdishProduction = Boolean(isKurdishProduction);

    const updatedMovie = await db.update(kurdishMovies)
      .set(updates)
      .where(eq(kurdishMovies.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMovie[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists before deleting
    const existingMovie = await db.select()
      .from(kurdishMovies)
      .where(eq(kurdishMovies.id, parseInt(id)))
      .limit(1);

    if (existingMovie.length === 0) {
      return NextResponse.json({ 
        error: 'Kurdish movie not found',
        code: 'MOVIE_NOT_FOUND' 
      }, { status: 404 });
    }

    const deletedMovie = await db.delete(kurdishMovies)
      .where(eq(kurdishMovies.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Kurdish movie deleted successfully',
      deletedMovie: deletedMovie[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}