import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { imageUrl } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody || 'authorId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate imageUrl
    if (!imageUrl) {
      return NextResponse.json({ 
        error: "Image URL is required",
        code: "MISSING_IMAGE_URL" 
      }, { status: 400 });
    }

    // Validate URL format
    try {
      const url = new URL(imageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return NextResponse.json({ 
          error: "Image URL must use HTTP or HTTPS protocol",
          code: "INVALID_URL_PROTOCOL" 
        }, { status: 400 });
      }

      // Check for common image file extensions
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const hasValidExtension = validExtensions.some(ext => 
        url.pathname.toLowerCase().includes(ext)
      );
      
      if (!hasValidExtension && !url.pathname.includes('image')) {
        return NextResponse.json({ 
          error: "URL must point to a valid image format (jpg, jpeg, png, gif, webp)",
          code: "INVALID_IMAGE_FORMAT" 
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: "Invalid URL format",
        code: "INVALID_URL_FORMAT" 
      }, { status: 400 });
    }

    // Optional: Check if URL is accessible
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (!response.ok) {
        return NextResponse.json({ 
          error: "Image URL is not accessible",
          code: "INACCESSIBLE_IMAGE_URL" 
        }, { status: 400 });
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        return NextResponse.json({ 
          error: "URL does not point to an image",
          code: "INVALID_CONTENT_TYPE" 
        }, { status: 400 });
      }
    } catch (error) {
      // If we can't check accessibility, we'll still proceed but log the error
      console.warn('Could not verify image URL accessibility:', error);
    }

    const currentTime = new Date().toISOString();

    // Check if user profile exists
    const existingProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    let updatedProfile;

    if (existingProfile.length === 0) {
      // Create default profile with the new image
      updatedProfile = await db.insert(userProfiles)
        .values({
          userId: user.id,
          profileImage: imageUrl.trim(),
          bio: null,
          favoriteMovies: null,
          movieGenrePreferences: null,
          reviewCount: 0,
          averageRating: 0,
          joinedAt: currentTime,
          lastActiveAt: currentTime,
          createdAt: currentTime,
          updatedAt: currentTime,
        })
        .returning();
    } else {
      // Update existing profile
      updatedProfile = await db.update(userProfiles)
        .set({
          profileImage: imageUrl.trim(),
          lastActiveAt: currentTime,
          updatedAt: currentTime,
        })
        .where(eq(userProfiles.userId, user.id))
        .returning();
    }

    if (updatedProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update profile image',
        code: "UPDATE_FAILED" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imageUrl: updatedProfile[0].profileImage,
      updatedAt: updatedProfile[0].updatedAt
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { imageUrl } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody || 'authorId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate imageUrl
    if (!imageUrl) {
      return NextResponse.json({ 
        error: "Image URL is required",
        code: "MISSING_IMAGE_URL" 
      }, { status: 400 });
    }

    // Validate URL format
    try {
      const url = new URL(imageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return NextResponse.json({ 
          error: "Image URL must use HTTP or HTTPS protocol",
          code: "INVALID_URL_PROTOCOL" 
        }, { status: 400 });
      }

      // Check for common image file extensions
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const hasValidExtension = validExtensions.some(ext => 
        url.pathname.toLowerCase().includes(ext)
      );
      
      if (!hasValidExtension && !url.pathname.includes('image')) {
        return NextResponse.json({ 
          error: "URL must point to a valid image format (jpg, jpeg, png, gif, webp)",
          code: "INVALID_IMAGE_FORMAT" 
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: "Invalid URL format",
        code: "INVALID_URL_FORMAT" 
      }, { status: 400 });
    }

    // Optional: Check if URL is accessible
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (!response.ok) {
        return NextResponse.json({ 
          error: "Image URL is not accessible",
          code: "INACCESSIBLE_IMAGE_URL" 
        }, { status: 400 });
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        return NextResponse.json({ 
          error: "URL does not point to an image",
          code: "INVALID_CONTENT_TYPE" 
        }, { status: 400 });
      }
    } catch (error) {
      console.warn('Could not verify image URL accessibility:', error);
    }

    // Check if user profile exists
    const existingProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json({ 
        error: 'User profile not found',
        code: "PROFILE_NOT_FOUND" 
      }, { status: 404 });
    }

    const currentTime = new Date().toISOString();

    // Update existing profile
    const updatedProfile = await db.update(userProfiles)
      .set({
        profileImage: imageUrl.trim(),
        lastActiveAt: currentTime,
        updatedAt: currentTime,
      })
      .where(eq(userProfiles.userId, user.id))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update profile image',
        code: "UPDATE_FAILED" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imageUrl: updatedProfile[0].profileImage,
      updatedAt: updatedProfile[0].updatedAt
    });

  } catch (error) {
    console.error('PUT error:', error);
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

    // Check if user profile exists
    const existingProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json({ 
        error: 'User profile not found',
        code: "PROFILE_NOT_FOUND" 
      }, { status: 404 });
    }

    const currentTime = new Date().toISOString();

    // Remove profile image (set to null)
    const updatedProfile = await db.update(userProfiles)
      .set({
        profileImage: null,
        lastActiveAt: currentTime,
        updatedAt: currentTime,
      })
      .where(eq(userProfiles.userId, user.id))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to remove profile image',
        code: "DELETE_FAILED" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully',
      imageUrl: null,
      updatedAt: updatedProfile[0].updatedAt,
      deletedProfile: updatedProfile[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}