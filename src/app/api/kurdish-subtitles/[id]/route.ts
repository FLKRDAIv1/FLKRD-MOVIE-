import { NextRequest, NextResponse } from 'next/server';

// Sample Kurdish Sorani subtitles for popular movies
const sampleSubtitles: Record<string, string[]> = {
  '550': [ // Fight Club
    '00:00:01.000 --> 00:00:04.000\nمن ناتوانم خەو ببینم.',
    '00:00:05.000 --> 00:00:08.000\nهەموو شەوێک خەونەکانم تووشی کابوس دەبن.',
    '00:00:10.000 --> 00:00:14.000\nژیانی من وەک نووسینگەیەکی بێ کۆتایی بوو.',
    '00:00:15.000 --> 00:00:18.000\nهەتا ئەو ڕۆژەی کە تایلەر دورڈینم بینی.',
    '00:00:20.000 --> 00:00:24.000\nئەو یەکەم کەس بوو کە ڕاستییەکانی ژیانی پێ گوتم.',
  ],
  '238': [ // The Godfather
    '00:00:01.000 --> 00:00:05.000\nباوەڕم وایە کە مرۆڤ دەتوانێت دۆستایەتی بکات.',
    '00:00:06.000 --> 00:00:10.000\nبەڵام پێویستە ئەو کەسە ڕێز لە خێزانەکەت بگرێت.',
    '00:00:12.000 --> 00:00:16.000\nئەمڕۆ ڕۆژی زەماوەندی کچەکەمە.',
    '00:00:18.000 --> 00:00:22.000\nدەمەوێت ئەو ڕۆژە بێ ئاژاوە و کێشە بێت.',
  ]
};

// Generate fallback Kurdish subtitles
function generateFallbackSubtitles(movieId: string): string[] {
  return [
    '00:00:01.000 --> 00:00:04.000\nبەخێربێیت بۆ ئەم فیلمە.',
    '00:00:05.000 --> 00:00:08.000\nئەمە چیرۆکێکی سەرنجڕاکێشە.',
    '00:00:10.000 --> 00:00:13.000\nکارەکتەرەکان دەست بە گفتوگۆ دەکەن.',
    '00:00:15.000 --> 00:00:18.000\nڕووداوەکان دەست پێ دەکەن.',
    '00:00:20.000 --> 00:00:23.000\nچیرۆک درام و سەرنج پێشکەش دەکات.'
  ];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
    
  // Check if we have predefined subtitles for this movie
  if (sampleSubtitles[id]) {
    return NextResponse.json({ subtitles: sampleSubtitles[id] });
  }
    
  // Generate fallback subtitles if no predefined ones exist
  const fallbackSubtitles = generateFallbackSubtitles(id);
  return NextResponse.json({ subtitles: fallbackSubtitles });
}
const sampleSubtitles: Record<string, string[]> = {
  '550': [ // Fight Club
    '00:00:01.000 --> 00:00:04.000\nمن ناتوانم خەو ببینم.',
    '00:00:05.000 --> 00:00:08.000\nهەموو شەوێک خەونەکانم تووشی کابوس دەبن.',
    '00:00:10.000 --> 00:00:14.000\nژیانی من وەک نووسینگەیەکی بێ کۆتایی بوو.',
    '00:00:15.000 --> 00:00:18.000\nهەتا ئەو ڕۆژەی کە تایلەر دورڈینم بینی.',
    '00:00:20.000 --> 00:00:24.000\nئەو یەکەم کەس بوو کە ڕاستییەکانی ژیانی پێ گوتم.',
  ],
  '238': [ // The Godfather
    '00:00:01.000 --> 00:00:05.000\nباوەڕم وایە کە مرۆڤ دەتوانێت دۆستایەتی بکات.',
    '00:00:06.000 --> 00:00:10.000\nبەڵام پێویستە ئەو کەسە ڕێز لە خێزانەکەت بگرێت.',
    '00:00:12.000 --> 00:00:16.000\nئەمڕۆ ڕۆژی زەماوەندی کچەکەمە.',
    '00:00:18.000 --> 00:00:22.000\nدەمەوێت ئەو ڕۆژە بێ ئاژاوە و کێشە بێت.',
  ],
  '680': [ // Pulp Fiction
    '00:00:01.000 --> 00:00:04.000\nڕۆیالی لەگەڵ پەنیر چییە؟',
    '00:00:05.000 --> 00:00:08.000\nلە فەڕەنسا ناویان لێ دەنێت کوارتەر پاوندەر.',
    '00:00:10.000 --> 00:00:13.000\nئەوان سیستەمی مەتریک بەکاردەهێنن.',
    '00:00:15.000 --> 00:00:18.000\nنازانن پاوند چییە.',
  ],
  '539': [ // The Matrix
    '00:00:01.000 --> 00:00:05.000\nئایا هەرگیز خەونێکت بینیوە کە زۆر ڕاستی لێهاتبێت؟',
    '00:00:06.000 --> 00:00:10.000\nئەگەر نەتتوانیبێت لە خەون و ڕاستی جیاوازی بکەیت چی؟',
    '00:00:12.000 --> 00:00:16.000\nماتریکس لە هەموو شوێنێکەوە دەورەتە دەگرێت.',
    '00:00:18.000 --> 00:00:22.000\nدەتوانیت هەستی پێ بکەیت کاتێک چاوت دادەخەیت.',
  ],
};

// Movie metadata for subtitle generation context
const movieMetadata: Record<string, { title: string; genre: string; year: number; plot: string }> = {
  '550': {
    title: 'Fight Club',
    genre: 'Drama/Thriller',
    year: 1999,
    plot: 'An insomniac office worker forms an underground fight club',
  },
  '238': {
    title: 'The Godfather',
    genre: 'Crime/Drama', 
    year: 1972,
    plot: 'The aging patriarch of an organized crime dynasty',
  },
  '680': {
    title: 'Pulp Fiction',
    genre: 'Crime/Drama',
    year: 1994,
    plot: 'The lives of two mob hitmen intertwine',
  },
  '539': {
    title: 'The Matrix',
    genre: 'Sci-Fi/Action',
    year: 1999,
    plot: 'A computer hacker learns reality is a simulation',
  },
};

// Generate fallback Kurdish subtitles based on movie genre/plot
function generateFallbackSubtitles(movieId: string): string[] {
  const metadata = movieMetadata[movieId];
  
  if (!metadata) {
    // Generic movie subtitles
    return [
      '00:00:01.000 --> 00:00:04.000\nبەخێربێیت بۆ ئەم فیلمە.',
      '00:00:05.000 --> 00:00:08.000\nئەمە چیرۆکێکی سەرنجڕاکێشە.',
      '00:00:10.000 --> 00:00:13.000\nکارەکتەرەکان دەست بە گفتوگۆ دەکەن.',
      '00:00:15.000 --> 00:00:18.000\nڕووداوەکان دەست پێ دەکەن.',
      '00:00:20.000 --> 00:00:23.000\nچیرۆک درام و سەرنج پێشکەش دەکات.',
      '00:00:25.000 --> 00:00:28.000\nئەم فیلمە چیرۆکێکی جوانە.',
      '00:00:30.000 --> 00:00:33.000\nکۆتایی چیرۆکەکە نزیک دەبێتەوە.',
      '00:00:35.000 --> 00:00:38.000\nسوپاس بۆ تەماشاکردن.',
    ];
  }

  // Genre-based subtitle generation
  const { genre, title } = metadata;
  
  if (genre.includes('Action')) {
    return [
      '00:00:01.000 --> 00:00:04.000\nئەکشن و سەرنجی زۆر!',
      '00:00:05.000 --> 00:00:08.000\nپاڵەوانەکە ئامادەیە بۆ شەڕ.',
      '00:00:10.000 --> 00:00:13.000\nهێرش و بەرگریی بەهێز.',
      '00:00:15.000 --> 00:00:18.000\nڕکابەری نێوان چاک و خراپ.',
      '00:00:20.000 --> 00:00:23.000\nدەرەنجامی شەڕەکە ڕوون دەبێتەوە.',
    ];
  }
  
  if (genre.includes('Crime')) {
    return [
      '00:00:01.000 --> 00:00:04.000\nجیهانی تاریکی تاوان.',
      '00:00:05.000 --> 00:00:08.000\nیاسا و نیزام لە مەترسیدایە.',
      '00:00:10.000 --> 00:00:13.000\nکارەکتەرەکان لە ناو کێشەدان.',
      '00:00:15.000 --> 00:00:18.000\nڕاستی و درۆ تێکەڵاون.',
      '00:00:20.000 --> 00:00:23.000\nدادپەروەری بە دوای تاواندا دەگەڕێت.',
    ];
  }
  
  if (genre.includes('Sci-Fi')) {
    return [
      '00:00:01.000 --> 00:00:04.000\nداهاتوویەکی نهێنی.',
      '00:00:05.000 --> 00:00:08.000\nتەکنەلۆژیا ژیان گۆڕیوە.',
      '00:00:10.000 --> 00:00:13.000\nڕاستی لە خەیاڵ جیاوازتر نییە.',
      '00:00:15.000 --> 00:00:18.000\nکەشف و دۆزینەوەی سەیر.',
      '00:00:20.000 --> 00:00:23.000\nداهاتوو لە دەستی ئێمەیە.',
    ];
  }
  
  // Default drama subtitles
  return [
    '00:00:01.000 --> 00:00:04.000\nچیرۆکێکی مرۆیی قووڵ.',
    '00:00:05.000 --> 00:00:08.000\nکارەکتەرەکان بە دوای ئامانجەکانیاندا دەگەڕێن.',
    '00:00:10.000 --> 00:00:13.000\nهەست و سۆز لە ناوەڕاست.',
    '00:00:15.000 --> 00:00:18.000\nژیان پڕە لە هەڵوێست.',
    '00:00:20.000 --> 00:00:23.000\nفێربوون لە ئەزموون.',
  ];
}

// Format subtitles as WebVTT
function formatAsWebVTT(subtitles: string[]): string {
  const header = 'WEBVTT\n\n';
  const formattedSubtitles = subtitles
    .map((subtitle, index) => `${index + 1}\n${subtitle}\n`)
    .join('\n');
  
  return header + formattedSubtitles;
}

// Validate movie ID format
function isValidMovieId(movieId: string): boolean {
  // Support both TMDB IDs (numbers) and custom IDs (alphanumeric)
  return /^[a-zA-Z0-9_-]+$/.test(movieId) && movieId.length > 0 && movieId.length < 50;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const movieId = params.id;
    
    // More lenient validation - accept any reasonable movie ID including pure numbers
    if (!movieId || movieId.trim().length === 0 || movieId.length > 50) {
      return NextResponse.json(
        { 
          error: 'Invalid movie ID format',
          message: 'Movie ID must be provided and less than 50 characters'
        },
        { status: 400 }
      );
    }

    // Check if we have sample subtitles for this movie
    let subtitles: string[];
    
    if (sampleSubtitles[movieId]) {
      subtitles = sampleSubtitles[movieId];
    } else {
      // Generate fallback subtitles
      subtitles = generateFallbackSubtitles(movieId);
    }

    // Format as WebVTT
    const vttContent = formatAsWebVTT(subtitles);

    // Return WebVTT content with proper headers
    return new NextResponse(vttContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Content-Disposition': `attachment; filename="kurdish-${movieId}.vtt"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('Subtitle API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to generate Kurdish subtitles'
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Handle POST requests for custom subtitle generation
export async function POST(
  request: NextRequest,
  { params }: { params: { movieId: string } }
) {
  try {
    const { movieId } = params;
    const body = await request.json();
    
    // Validate movie ID
    if (!movieId || !isValidMovieId(movieId)) {
      return NextResponse.json(
        { 
          error: 'Invalid movie ID format',
          message: 'Movie ID must be alphanumeric and between 1-50 characters'
        },
        { status: 400 }
      );
    }

    // Extract movie information from request body
    const { title, genre, year, plot, dialogue } = body;
    
    let subtitles: string[];
    
    if (dialogue && Array.isArray(dialogue)) {
      // Use provided dialogue to generate subtitles
      subtitles = dialogue.map((line: string, index: number) => {
        const startTime = String((index * 4 + 1)).padStart(2, '0');
        const endTime = String((index * 4 + 4)).padStart(2, '0');
        return `00:00:${startTime}.000 --> 00:00:${endTime}.000\n${line}`;
      });
    } else {
      // Generate based on genre and plot
      const tempMetadata = { title, genre, year, plot };
      movieMetadata[movieId] = tempMetadata;
      subtitles = generateFallbackSubtitles(movieId);
    }

    // Format as WebVTT
    const vttContent = formatAsWebVTT(subtitles);

    return new NextResponse(vttContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Content-Disposition': `attachment; filename="kurdish-${movieId}.vtt"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour for custom generated
      },
    });

  } catch (error) {
    console.error('Custom Subtitle Generation Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate custom subtitles',
        message: 'Invalid request body or processing error'
      },
      { status: 400 }
    );
  }
}