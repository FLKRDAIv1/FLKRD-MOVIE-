import { NextResponse } from 'next/server';

// TV STREAMING IS COMPLETELY DISABLED
// This API endpoint is no longer available

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { 
      error: 'TV Streaming Not Available',
      message: 'TV show streaming has been disabled. Only movie streaming is available.',
      code: 'TV_STREAMING_DISABLED',
      requested_id: params.id,
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
      error: 'TV Streaming Not Available',
      message: 'TV show streaming has been disabled. Only movie streaming is available.',
      code: 'TV_STREAMING_DISABLED',
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