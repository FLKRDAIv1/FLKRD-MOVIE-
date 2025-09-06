import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reviewComments, user, movieReviews } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single comment by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const comment = await db
        .select({
          id: reviewComments.id,
          reviewId: reviewComments.reviewId,
          userId: reviewComments.userId,
          content: reviewComments.content,
          createdAt: reviewComments.createdAt,
          updatedAt: reviewComments.updatedAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          review: {
            id: movieReviews.id,
            title: movieReviews.title
          }
        })
        .from(reviewComments)
        .leftJoin(user, eq(reviewComments.userId, user.id))
        .leftJoin(movieReviews, eq(reviewComments.reviewId, movieReviews.id))
        .where(eq(reviewComments.id, parseInt(id)))
        .limit(1);

      if (comment.length === 0) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      return NextResponse.json(comment[0]);
    }

    // List comments with filters
    const reviewId = searchParams.get('reviewId');
    const userIdFilter = searchParams.get('userId');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!reviewId) {
      return NextResponse.json({ 
        error: "reviewId is required for listing comments",
        code: "MISSING_REVIEW_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(reviewId))) {
      return NextResponse.json({ 
        error: "Valid reviewId is required",
        code: "INVALID_REVIEW_ID" 
      }, { status: 400 });
    }

    let query = db
      .select({
        id: reviewComments.id,
        reviewId: reviewComments.reviewId,
        userId: reviewComments.userId,
        content: reviewComments.content,
        createdAt: reviewComments.createdAt,
        updatedAt: reviewComments.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        review: {
          id: movieReviews.id,
          title: movieReviews.title
        }
      })
      .from(reviewComments)
      .leftJoin(user, eq(reviewComments.userId, user.id))
      .leftJoin(movieReviews, eq(reviewComments.reviewId, movieReviews.id));

    // Build where conditions
    let whereConditions = [eq(reviewComments.reviewId, parseInt(reviewId))];

    if (userIdFilter) {
      whereConditions.push(eq(reviewComments.userId, userIdFilter));
    }

    if (search) {
      whereConditions.push(like(reviewComments.content, `%${search}%`));
    }

    query = query.where(and(...whereConditions));

    // Apply sorting
    if (sort === 'oldest') {
      query = query.orderBy(asc(reviewComments.createdAt));
    } else {
      query = query.orderBy(desc(reviewComments.createdAt));
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
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { reviewId, content } = requestBody;

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

    if (!content) {
      return NextResponse.json({ 
        error: "content is required",
        code: "MISSING_CONTENT" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(reviewId))) {
      return NextResponse.json({ 
        error: "Valid reviewId is required",
        code: "INVALID_REVIEW_ID" 
      }, { status: 400 });
    }

    // Validate content length
    const trimmedContent = content.trim();
    if (trimmedContent.length < 1 || trimmedContent.length > 1000) {
      return NextResponse.json({ 
        error: "Content must be between 1 and 1000 characters",
        code: "INVALID_CONTENT_LENGTH" 
      }, { status: 400 });
    }

    // Validate reviewId exists
    const existingReview = await db
      .select({ id: movieReviews.id })
      .from(movieReviews)
      .where(eq(movieReviews.id, parseInt(reviewId)))
      .limit(1);

    if (existingReview.length === 0) {
      return NextResponse.json({ 
        error: "Review not found",
        code: "REVIEW_NOT_FOUND" 
      }, { status: 404 });
    }

    const newComment = await db.insert(reviewComments)
      .values({
        reviewId: parseInt(reviewId),
        userId: user.id,
        content: trimmedContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // Fetch the created comment with user and review info
    const commentWithDetails = await db
      .select({
        id: reviewComments.id,
        reviewId: reviewComments.reviewId,
        userId: reviewComments.userId,
        content: reviewComments.content,
        createdAt: reviewComments.createdAt,
        updatedAt: reviewComments.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        review: {
          id: movieReviews.id,
          title: movieReviews.title
        }
      })
      .from(reviewComments)
      .leftJoin(user, eq(reviewComments.userId, user.id))
      .leftJoin(movieReviews, eq(reviewComments.reviewId, movieReviews.id))
      .where(eq(reviewComments.id, newComment[0].id))
      .limit(1);

    return NextResponse.json(commentWithDetails[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
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

    // Check if comment exists and belongs to the user
    const existingComment = await db
      .select({
        id: reviewComments.id,
        userId: reviewComments.userId,
        content: reviewComments.content,
        reviewId: reviewComments.reviewId,
        createdAt: reviewComments.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        review: {
          id: movieReviews.id,
          title: movieReviews.title
        }
      })
      .from(reviewComments)
      .leftJoin(user, eq(reviewComments.userId, user.id))
      .leftJoin(movieReviews, eq(reviewComments.reviewId, movieReviews.id))
      .where(eq(reviewComments.id, parseInt(id)))
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json({ 
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Check if user owns the comment
    if (existingComment[0].userId !== user.id) {
      return NextResponse.json({ 
        error: 'You can only delete your own comments',
        code: 'UNAUTHORIZED_DELETE' 
      }, { status: 403 });
    }

    const deleted = await db.delete(reviewComments)
      .where(and(eq(reviewComments.id, parseInt(id)), eq(reviewComments.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Comment not found or unauthorized',
        code: 'DELETE_FAILED' 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Comment deleted successfully',
      deletedComment: existingComment[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}