import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles, user, movieReviews } from '@/db/schema';
import { eq, and, avg, count } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const VALID_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 
  'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
];

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function calculateUserStats(userId: string) {
  try {
    const stats = await db
      .select({
        reviewCount: count(movieReviews.id),
        averageRating: avg(movieReviews.rating)
      })
      .from(movieReviews)
      .where(eq(movieReviews.userId, userId));

    return {
      reviewCount: stats[0]?.reviewCount || 0,
      averageRating: stats[0]?.averageRating || 0
    };
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return { reviewCount: 0, averageRating: 0 };
  }
}

async function createDefaultProfile(userId: string) {
  const now = new Date().toISOString();
  
  const newProfile = await db.insert(userProfiles)
    .values({
      userId,
      profileImage: null,
      bio: null,
      favoriteMovies: JSON.stringify([]),
      movieGenrePreferences: JSON.stringify([]),
      reviewCount: 0,
      averageRating: 0,
      joinedAt: now,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now
    })
    .returning();

  return newProfile[0];
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Try to get existing profile
    let profile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, currentUser.id))
      .limit(1);

    // If profile doesn't exist, create default profile
    if (profile.length === 0) {
      const newProfile = await createDefaultProfile(currentUser.id);
      profile = [newProfile];
    }

    // Update lastActiveAt
    await db.update(userProfiles)
      .set({ 
        lastActiveAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(userProfiles.userId, currentUser.id));

    // Get user information
    const userInfo = await db.select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    if (userInfo.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate real-time stats
    const stats = await calculateUserStats(currentUser.id);

    // Parse JSON fields
    const favoriteMovies = profile[0].favoriteMovies ? JSON.parse(profile[0].favoriteMovies) : [];
    const movieGenrePreferences = profile[0].movieGenrePreferences ? JSON.parse(profile[0].movieGenrePreferences) : [];

    const profileResponse = {
      ...profile[0],
      favoriteMovies,
      movieGenrePreferences,
      reviewCount: stats.reviewCount,
      averageRating: Number(stats.averageRating?.toFixed(1)) || 0,
      user: {
        id: userInfo[0].id,
        name: userInfo[0].name,
        email: userInfo[0].email
      }
    };

    return NextResponse.json(profileResponse);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if profile already exists
    const existingProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, currentUser.id))
      .limit(1);

    if (existingProfile.length > 0) {
      return NextResponse.json({ 
        error: "Profile already exists",
        code: "PROFILE_EXISTS" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create profile with defaults
    const newProfile = await db.insert(userProfiles)
      .values({
        userId: currentUser.id,
        profileImage: requestBody.profileImage || null,
        bio: requestBody.bio || null,
        favoriteMovies: JSON.stringify(requestBody.favoriteMovies || []),
        movieGenrePreferences: JSON.stringify(requestBody.movieGenrePreferences || []),
        reviewCount: 0,
        averageRating: 0,
        joinedAt: now,
        lastActiveAt: now,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    // Get user information
    const userInfo = await db.select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    const profileResponse = {
      ...newProfile[0],
      favoriteMovies: requestBody.favoriteMovies || [],
      movieGenrePreferences: requestBody.movieGenrePreferences || [],
      user: {
        id: userInfo[0].id,
        name: userInfo[0].name,
        email: userInfo[0].email
      }
    };

    return NextResponse.json(profileResponse, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody || 'reviewCount' in requestBody || 'averageRating' in requestBody) {
      return NextResponse.json({ 
        error: "User ID, reviewCount, and averageRating cannot be provided in request body",
        code: "FORBIDDEN_FIELDS" 
      }, { status: 400 });
    }

    // Check if profile exists
    const existingProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, currentUser.id))
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validation
    const updates: any = {};

    if (requestBody.profileImage !== undefined) {
      if (requestBody.profileImage !== null && requestBody.profileImage !== '' && !isValidUrl(requestBody.profileImage)) {
        return NextResponse.json({ 
          error: "Profile image must be a valid URL",
          code: "INVALID_URL" 
        }, { status: 400 });
      }
      updates.profileImage = requestBody.profileImage || null;
    }

    if (requestBody.bio !== undefined) {
      if (requestBody.bio && requestBody.bio.length > 500) {
        return NextResponse.json({ 
          error: "Bio cannot exceed 500 characters",
          code: "BIO_TOO_LONG" 
        }, { status: 400 });
      }
      updates.bio = requestBody.bio ? requestBody.bio.trim() : null;
    }

    if (requestBody.favoriteMovies !== undefined) {
      if (!Array.isArray(requestBody.favoriteMovies)) {
        return NextResponse.json({ 
          error: "Favorite movies must be an array",
          code: "INVALID_FAVORITE_MOVIES" 
        }, { status: 400 });
      }
      
      for (const movieId of requestBody.favoriteMovies) {
        if (!Number.isInteger(movieId) || movieId <= 0) {
          return NextResponse.json({ 
            error: "Favorite movies must be an array of positive integers",
            code: "INVALID_MOVIE_ID" 
          }, { status: 400 });
        }
      }
      
      updates.favoriteMovies = JSON.stringify(requestBody.favoriteMovies);
    }

    if (requestBody.movieGenrePreferences !== undefined) {
      if (!Array.isArray(requestBody.movieGenrePreferences)) {
        return NextResponse.json({ 
          error: "Movie genre preferences must be an array",
          code: "INVALID_GENRE_PREFERENCES" 
        }, { status: 400 });
      }
      
      for (const genre of requestBody.movieGenrePreferences) {
        if (typeof genre !== 'string' || !VALID_GENRES.includes(genre)) {
          return NextResponse.json({ 
            error: `Invalid genre. Valid genres are: ${VALID_GENRES.join(', ')}`,
            code: "INVALID_GENRE" 
          }, { status: 400 });
        }
      }
      
      updates.movieGenrePreferences = JSON.stringify(requestBody.movieGenrePreferences);
    }

    // Always update lastActiveAt and updatedAt
    updates.lastActiveAt = new Date().toISOString();
    updates.updatedAt = new Date().toISOString();

    // Update profile
    const updatedProfile = await db.update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.userId, currentUser.id))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Get user information
    const userInfo = await db.select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    // Calculate real-time stats
    const stats = await calculateUserStats(currentUser.id);

    // Parse JSON fields
    const favoriteMovies = updatedProfile[0].favoriteMovies ? JSON.parse(updatedProfile[0].favoriteMovies) : [];
    const movieGenrePreferences = updatedProfile[0].movieGenrePreferences ? JSON.parse(updatedProfile[0].movieGenrePreferences) : [];

    const profileResponse = {
      ...updatedProfile[0],
      favoriteMovies,
      movieGenrePreferences,
      reviewCount: stats.reviewCount,
      averageRating: Number(stats.averageRating?.toFixed(1)) || 0,
      user: {
        id: userInfo[0].id,
        name: userInfo[0].name,
        email: userInfo[0].email
      }
    };

    return NextResponse.json(profileResponse);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}