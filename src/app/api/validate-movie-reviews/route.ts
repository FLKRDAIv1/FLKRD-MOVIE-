import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movieReviews } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { movieId, movieType, title, content, rating } = requestBody;

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

    if (!title) {
      return NextResponse.json({ 
        error: "title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ 
        error: "content is required",
        code: "MISSING_CONTENT" 
      }, { status: 400 });
    }

    if (!rating) {
      return NextResponse.json({ 
        error: "rating is required",
        code: "MISSING_RATING" 
      }, { status: 400 });
    }

    // Validate movieId is integer
    const parsedMovieId = parseInt(movieId);
    if (isNaN(parsedMovieId)) {
      return NextResponse.json({ 
        error: "movieId must be a valid integer",
        code: "INVALID_MOVIE_ID" 
      }, { status: 400 });
    }

    // Validate rating is integer between 1-10
    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10) {
      return NextResponse.json({ 
        error: "rating must be an integer between 1 and 10",
        code: "INVALID_RATING" 
      }, { status: 400 });
    }

    // Validate movieType is text
    if (typeof movieType !== 'string' || movieType.trim().length === 0) {
      return NextResponse.json({ 
        error: "movieType must be a non-empty string",
        code: "INVALID_MOVIE_TYPE" 
      }, { status: 400 });
    }

    // Validate title is text
    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ 
        error: "title must be a non-empty string",
        code: "INVALID_TITLE" 
      }, { status: 400 });
    }

    // Validate content is text
    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ 
        error: "content must be a non-empty string",
        code: "INVALID_CONTENT" 
      }, { status: 400 });
    }

    // Prepare insert data with hardcoded userId and default values
    const insertData = {
      userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
      movieId: parsedMovieId,
      movieType: movieType.trim(),
      title: title.trim(),
      content: content.trim(),
      rating: parsedRating,
      helpful: 0,
      isComingSoon: false,
      spoilerWarning: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert the new movie review
    const newReview = await db.insert(movieReviews)
      .values(insertData)
      .returning();

    if (newReview.length === 0) {
      return NextResponse.json({ 
        error: "Failed to create movie review",
        code: "INSERT_FAILED" 
      }, { status: 500 });
    }

    return NextResponse.json(newReview[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}