import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movieReviews } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { movieId, movieType, title, content, rating } = await request.json();

    // Validate required fields
    if (!movieId || !movieType || !title || !content || rating === undefined) {
      return NextResponse.json({ 
        error: "Missing required fields",
        code: "MISSING_FIELDS" 
      }, { status: 400 });
    }

    if (rating < 1 || rating > 10) {
      return NextResponse.json({ 
        error: "Rating must be between 1 and 10",
        code: "INVALID_RATING" 
      }, { status: 400 });
    }

    const currentTime = new Date().toISOString();

    // Insert data with explicit timestamps
    const insertData = {
      userId: 'user_2mQJ8k3L9pN4R7tS8vW1x',
      movieId: parseInt(movieId),
      movieType: movieType.trim(),
      title: title.trim(),
      content: content.trim(),
      rating: parseInt(rating),
      helpful: 0,
      isComingSoon: false,
      spoilerWarning: false,
      createdAt: currentTime,
      updatedAt: currentTime
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