import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    console.log('Test API GET - movieId:', movieId)

    let result
    if (movieId) {
      // Test querying specific movie reviews
      result = await db.run(sql`
        SELECT * FROM movie_reviews 
        WHERE movie_id = ${movieId}
        ORDER BY created_at DESC
      `)
    } else {
      // Test querying all reviews (limit for safety)
      result = await db.run(sql`
        SELECT * FROM movie_reviews 
        ORDER BY created_at DESC 
        LIMIT 10
      `)
    }

    console.log('Test API GET - query result:', result)

    return NextResponse.json({
      success: true,
      message: 'Database query successful',
      data: result.results || result,
      rowCount: result.results?.length || 0,
      movieId: movieId || 'all',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Test API GET error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database query failed',
      details: {
        message: error.message,
        code: error.code,
        stack: error.stack,
        cause: error.cause
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, title, content, rating } = body

    console.log('Test API POST - received data:', { movieId, title, content, rating })

    // Validate required fields
    if (!movieId || !title || !content || rating === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        required: ['movieId', 'title', 'content', 'rating'],
        received: { movieId, title, content, rating }
      }, { status: 400 })
    }

    // Test inserting a review with hardcoded user_id for now
    const testUserId = 'test-user-123'
    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log('Test API POST - attempting insert with ID:', reviewId)

    const result = await db.run(sql`
      INSERT INTO movie_reviews (
        id, 
        user_id, 
        movie_id, 
        title, 
        content, 
        rating, 
        created_at, 
        updated_at
      ) VALUES (
        ${reviewId},
        ${testUserId},
        ${movieId.toString()},
        ${title},
        ${content},
        ${Number(rating)},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `)

    console.log('Test API POST - insert result:', result)

    // Try to fetch the inserted review to verify
    const verificationResult = await db.run(sql`
      SELECT * FROM movie_reviews WHERE id = ${reviewId}
    `)

    console.log('Test API POST - verification result:', verificationResult)

    return NextResponse.json({
      success: true,
      message: 'Review inserted successfully',
      data: {
        insertResult: result,
        verification: verificationResult.results?.[0] || verificationResult,
        reviewId,
        testUserId
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Test API POST error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Database insert failed',
      details: {
        message: error.message,
        code: error.code,
        stack: error.stack,
        cause: error.cause,
        sqlState: error.sqlState
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}