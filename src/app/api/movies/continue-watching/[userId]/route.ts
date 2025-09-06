import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { watchProgress } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// Helper function to format seconds to "1h 23m" or "23m" format
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authentication required
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { userId } = params;
    
    // Validate userId parameter
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    // Security: Only allow users to access their own continue watching list
    if (userId !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied: You can only view your own continue watching list',
        code: 'ACCESS_DENIED'
      }, { status: 403 });
    }

    // Parse query parameters with validation
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam), 1), 50) : 10;
    const offset = offsetParam ? Math.max(parseInt(offsetParam), 0) : 0;

    // Validate limit and offset are valid numbers
    if (limitParam && isNaN(limit)) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter',
        code: 'INVALID_LIMIT'
      }, { status: 400 });
    }

    if (offsetParam && isNaN(offset)) {
      return NextResponse.json({ 
        error: 'Invalid offset parameter',
        code: 'INVALID_OFFSET'
      }, { status: 400 });
    }

    // Query watch_progress for incomplete movies
    const progressRecords = await db.select()
      .from(watchProgress)
      .where(and(
        eq(watchProgress.userId, userId),
        eq(watchProgress.completed, false)
      ))
      .orderBy(desc(watchProgress.lastWatchedAt))
      .limit(limit)
      .offset(offset);

    // Transform records with calculated fields
    const transformedRecords = progressRecords.map(record => {
      const remainingTime = record.totalDuration - record.currentTime;
      
      return {
        ...record,
        remainingTime,
        formattedCurrentTime: formatTime(record.currentTime),
        formattedRemainingTime: formatTime(remainingTime),
        formattedProgressPercentage: parseFloat(record.progressPercentage.toFixed(1))
      };
    });

    return NextResponse.json(transformedRecords, { status: 200 });

  } catch (error) {
    console.error('GET continue-watching error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}