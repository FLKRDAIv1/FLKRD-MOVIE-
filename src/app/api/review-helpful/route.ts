import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviewHelpful, movieReviews } from '@/db/schema';
import { eq, and, count, sum, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { reviewId, isHelpful } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!reviewId) {
      return NextResponse.json({ 
        error: "reviewId is required",
        code: "MISSING_REVIEW_ID" 
      }, { status: 400 });
    }

    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json({ 
        error: "isHelpful must be a boolean",
        code: "INVALID_IS_HELPFUL" 
      }, { status: 400 });
    }

    // Validate reviewId is positive integer
    const parsedReviewId = parseInt(reviewId);
    if (!parsedReviewId || parsedReviewId <= 0) {
      return NextResponse.json({ 
        error: "reviewId must be a positive integer",
        code: "INVALID_REVIEW_ID" 
      }, { status: 400 });
    }

    // Check if review exists
    const review = await db.select()
      .from(movieReviews)
      .where(eq(movieReviews.id, parsedReviewId))
      .limit(1);

    if (review.length === 0) {
      return NextResponse.json({ 
        error: "Review not found",
        code: "REVIEW_NOT_FOUND" 
      }, { status: 404 });
    }

    // Check if user is trying to vote on their own review
    if (review[0].userId === user.id) {
      return NextResponse.json({ 
        error: "Cannot vote on your own review",
        code: "CANNOT_VOTE_OWN_REVIEW" 
      }, { status: 403 });
    }

    // Check if user has already voted on this review
    const existingVote = await db.select()
      .from(reviewHelpful)
      .where(and(
        eq(reviewHelpful.reviewId, parsedReviewId),
        eq(reviewHelpful.userId, user.id)
      ))
      .limit(1);

    let voteResult;
    
    if (existingVote.length > 0) {
      // Update existing vote
      voteResult = await db.update(reviewHelpful)
        .set({
          isHelpful: isHelpful ? 1 : 0,
        })
        .where(and(
          eq(reviewHelpful.reviewId, parsedReviewId),
          eq(reviewHelpful.userId, user.id)
        ))
        .returning();
    } else {
      // Create new vote
      voteResult = await db.insert(reviewHelpful)
        .values({
          reviewId: parsedReviewId,
          userId: user.id,
          isHelpful: isHelpful ? 1 : 0,
          createdAt: new Date().toISOString(),
        })
        .returning();
    }

    // Update helpful count in movieReviews table
    const helpfulCount = await db.select({ count: count() })
      .from(reviewHelpful)
      .where(and(
        eq(reviewHelpful.reviewId, parsedReviewId),
        eq(reviewHelpful.isHelpful, 1)
      ));

    await db.update(movieReviews)
      .set({
        helpful: helpfulCount[0].count,
        updatedAt: new Date().toISOString()
      })
      .where(eq(movieReviews.id, parsedReviewId));

    // Get updated review info
    const updatedReview = await db.select()
      .from(movieReviews)
      .where(eq(movieReviews.id, parsedReviewId))
      .limit(1);

    return NextResponse.json({
      vote: {
        ...voteResult[0],
        isHelpful: Boolean(voteResult[0].isHelpful)
      },
      review: updatedReview[0],
      action: existingVote.length > 0 ? 'updated' : 'created'
    }, { status: existingVote.length > 0 ? 200 : 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (reviewId) {
      // Get single vote status for specific review
      const parsedReviewId = parseInt(reviewId);
      if (!parsedReviewId || parsedReviewId <= 0) {
        return NextResponse.json({ 
          error: "reviewId must be a positive integer",
          code: "INVALID_REVIEW_ID" 
        }, { status: 400 });
      }

      // Check if review exists
      const review = await db.select()
        .from(movieReviews)
        .where(eq(movieReviews.id, parsedReviewId))
        .limit(1);

      if (review.length === 0) {
        return NextResponse.json({ 
          error: "Review not found",
          code: "REVIEW_NOT_FOUND" 
        }, { status: 404 });
      }

      const vote = await db.select()
        .from(reviewHelpful)
        .where(and(
          eq(reviewHelpful.reviewId, parsedReviewId),
          eq(reviewHelpful.userId, user.id)
        ))
        .limit(1);

      if (vote.length === 0) {
        return NextResponse.json({ 
          hasVoted: false,
          review: review[0]
        });
      }

      return NextResponse.json({
        hasVoted: true,
        vote: {
          ...vote[0],
          isHelpful: Boolean(vote[0].isHelpful)
        },
        review: review[0]
      });

    } else {
      // Get all user's votes with pagination
      const votes = await db.select({
        id: reviewHelpful.id,
        reviewId: reviewHelpful.reviewId,
        userId: reviewHelpful.userId,
        isHelpful: reviewHelpful.isHelpful,
        createdAt: reviewHelpful.createdAt,
        reviewTitle: movieReviews.title,
        reviewRating: movieReviews.rating,
        movieId: movieReviews.movieId,
        movieType: movieReviews.movieType
      })
        .from(reviewHelpful)
        .innerJoin(movieReviews, eq(reviewHelpful.reviewId, movieReviews.id))
        .where(eq(reviewHelpful.userId, user.id))
        .orderBy(desc(reviewHelpful.createdAt))
        .limit(limit)
        .offset(offset);

      // Convert isHelpful to boolean for response
      const formattedVotes = votes.map(vote => ({
        ...vote,
        isHelpful: Boolean(vote.isHelpful)
      }));

      return NextResponse.json(formattedVotes);
    }

  } catch (error) {
    console.error('GET error:', error);
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
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ 
        error: "reviewId query parameter is required",
        code: "MISSING_REVIEW_ID" 
      }, { status: 400 });
    }

    // Validate reviewId is positive integer
    const parsedReviewId = parseInt(reviewId);
    if (!parsedReviewId || parsedReviewId <= 0) {
      return NextResponse.json({ 
        error: "reviewId must be a positive integer",
        code: "INVALID_REVIEW_ID" 
      }, { status: 400 });
    }

    // Check if review exists
    const review = await db.select()
      .from(movieReviews)
      .where(eq(movieReviews.id, parsedReviewId))
      .limit(1);

    if (review.length === 0) {
      return NextResponse.json({ 
        error: "Review not found",
        code: "REVIEW_NOT_FOUND" 
      }, { status: 404 });
    }

    // Check if user has voted on this review
    const existingVote = await db.select()
      .from(reviewHelpful)
      .where(and(
        eq(reviewHelpful.reviewId, parsedReviewId),
        eq(reviewHelpful.userId, user.id)
      ))
      .limit(1);

    if (existingVote.length === 0) {
      return NextResponse.json({ 
        error: "Vote not found for this review",
        code: "VOTE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete the vote
    const deleted = await db.delete(reviewHelpful)
      .where(and(
        eq(reviewHelpful.reviewId, parsedReviewId),
        eq(reviewHelpful.userId, user.id)
      ))
      .returning();

    // Update helpful count in movieReviews table
    const helpfulCount = await db.select({ count: count() })
      .from(reviewHelpful)
      .where(and(
        eq(reviewHelpful.reviewId, parsedReviewId),
        eq(reviewHelpful.isHelpful, 1)
      ));

    await db.update(movieReviews)
      .set({
        helpful: helpfulCount[0].count,
        updatedAt: new Date().toISOString()
      })
      .where(eq(movieReviews.id, parsedReviewId));

    // Get updated review info
    const updatedReview = await db.select()
      .from(movieReviews)
      .where(eq(movieReviews.id, parsedReviewId))
      .limit(1);

    return NextResponse.json({
      message: "Vote removed successfully",
      deletedVote: {
        ...deleted[0],
        isHelpful: Boolean(deleted[0].isHelpful)
      },
      review: updatedReview[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}