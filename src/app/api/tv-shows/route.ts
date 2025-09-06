import { NextResponse } from 'next/server';

// TV SHOWS ARE COMPLETELY DISABLED
// This API endpoint is no longer available

export async function GET() {
  return NextResponse.json(
    { 
      error: 'TV Shows Not Available',
      message: 'TV show content has been disabled. Only movies are available.',
      code: 'TV_SHOWS_DISABLED',
      timestamp: new Date().toISOString()
    },
    { 
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-Powered-By': 'FLKRD STUDIO',
        'X-Created-By': 'Zana Faroq'
      }
    }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'TV Shows Not Available',
      message: 'TV show content has been disabled. Only movies are available.',
      code: 'TV_SHOWS_DISABLED',
      timestamp: new Date().toISOString()
    },
    { 
      status: 405,
      headers: {
        'Allow': 'GET',
        'X-Powered-By': 'FLKRD STUDIO',
        'X-Created-By': 'Zana Faroq'
      }
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'TV Shows Not Available',
      message: 'TV show content has been disabled. Only movies are available.',
      code: 'TV_SHOWS_DISABLED',
      timestamp: new Date().toISOString()
    },
    { 
      status: 405,
      headers: {
        'Allow': 'GET',
        'X-Powered-By': 'FLKRD STUDIO',
        'X-Created-By': 'Zana Faroq'
      }
    }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'TV Shows Not Available',
      message: 'TV show content has been disabled. Only movies are available.',
      code: 'TV_SHOWS_DISABLED',
      timestamp: new Date().toISOString()
    },
    { 
      status: 405,
      headers: {
        'Allow': 'GET',
        'X-Powered-By': 'FLKRD STUDIO',
        'X-Created-By': 'Zana Faroq'
      }
    }
  );
}