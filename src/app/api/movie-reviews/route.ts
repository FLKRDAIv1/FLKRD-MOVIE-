import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    // Query with correct column names from the actual database
    const reviewsResult = await db.run(sql`
      SELECT 
        id, user_id, movie_id, movie_title, movie_poster, rating, 
        review_title, review_text, is_verified_user, helpful_votes, 
        total_votes, created_at, updated_at
      FROM movie_reviews 
      WHERE movie_id = ${movieId}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `);

    const reviews = reviewsResult.rows || [];

    // Get user information for each review
    const reviewsWithUsers = [];
    for (const review of reviews) {
      let userName = 'Anonymous';
      let userImage = null;
      
      if (review.user_id) {
        try {
          const userResult = await db.run(sql`
            SELECT name, image FROM user WHERE id = ${review.user_id}
          `);
          
          if (userResult.rows && userResult.rows.length > 0) {
            userName = userResult.rows[0].name || 'Anonymous';
            userImage = userResult.rows[0].image;
          }
        } catch (userError) {
          console.error('Error fetching user:', userError);
        }
      }

      reviewsWithUsers.push({
        id: review.id,
        userId: review.user_id,
        movieId: review.movie_id,
        movieTitle: review.movie_title,
        moviePoster: review.movie_poster,
        title: review.review_title,
        content: review.review_text,
        rating: review.rating,
        isVerifiedUser: review.is_verified_user,
        helpful: review.helpful_votes,
        totalVotes: review.total_votes,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        user: {
          name: userName,
          image: userImage
        }
      });
    }

    return NextResponse.json({
      reviews: reviewsWithUsers,
      total: reviewsWithUsers.length,
      hasMore: reviewsWithUsers.length === limit
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: `Failed to fetch reviews: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { movieId, movieTitle, moviePoster, title, content, rating } = body;

    // Validate required fields
    if (!movieId || !title || !content || rating === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: movieId, title, content, rating' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 10' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    
    // Insert the review using correct column names
    const result = await db.run(sql`
      INSERT INTO movie_reviews (
        user_id, movie_id, movie_title, movie_poster, rating, 
        review_title, review_text, is_verified_user, helpful_votes, 
        total_votes, created_at, updated_at
      ) VALUES (
        ${session.user.id}, ${movieId}, ${movieTitle || ''}, ${moviePoster || ''}, ${rating}, 
        ${title}, ${content}, ${0}, ${0}, ${0}, ${now}, ${now}
      )
    `);

    // Get the inserted review ID
    const reviewId = result.meta?.last_row_id;
    
    if (!reviewId) {
      throw new Error('Failed to get review ID after insertion');
    }

    // Fetch the complete review
    const reviewResult = await db.run(sql`
      SELECT 
        id, user_id, movie_id, movie_title, movie_poster, rating, 
        review_title, review_text, is_verified_user, helpful_votes, 
        total_votes, created_at, updated_at
      FROM movie_reviews 
      WHERE id = ${reviewId}
    `);

    if (!reviewResult.rows || reviewResult.rows.length === 0) {
      throw new Error('Failed to fetch created review');
    }

    const review = reviewResult.rows[0];

    // Get user info
    const userResult = await db.run(sql`
      SELECT name, image FROM user WHERE id = ${session.user.id}
    `);

    const user = userResult.rows?.[0] || { name: 'Anonymous', image: null };

    const completeReview = {
      id: review.id,
      userId: review.user_id,
      movieId: review.movie_id,
      movieTitle: review.movie_title,
      moviePoster: review.movie_poster,
      title: review.review_title,
      content: review.review_text,
      rating: review.rating,
      isVerifiedUser: review.is_verified_user,
      helpful: review.helpful_votes,
      totalVotes: review.total_votes,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      user: {
        name: user.name,
        image: user.image
      }
    };

    return NextResponse.json({
      success: true,
      review: completeReview
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: `Failed to create review: ${error.message}` },
      { status: 500 }
    );
  }
}