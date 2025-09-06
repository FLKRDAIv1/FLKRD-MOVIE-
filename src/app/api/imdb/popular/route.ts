import { NextRequest, NextResponse } from 'next/server';

// TypeScript interfaces for IMDB API response
interface IMDBMovie {
  id: string;
  title: string;
  year: number;
  rating: number;
  plot: string;
  poster: string;
  genre: string[];
  director: string;
  cast: string[];
  runtime: string;
  country: string;
  language: string;
}

interface IMDBPopularResponse {
  movies: IMDBMovie[];
  total: number;
  page: number;
  per_page: number;
}

interface ErrorResponse {
  error: string;
  message: string;
  status: number;
}

// Cache storage for responses
let cachedData: {
  data: IMDBPopularResponse | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const RAPIDAPI_KEY = '4ac41bbda9mshac0c3ed221d5b05p12b4d7jsn701206e04335';
const RAPIDAPI_HOST = 'imdb-movies-shows-persons-api.p.rapidapi.com';
const IMDB_API_URL = 'https://imdb-movies-shows-persons-api.p.rapidapi.com/movies/popular';

// Ultra comprehensive content filtering for ALL unwanted content
function isFilteredContent(movie: any): boolean {
  // 1. Check adult flag
  if (movie.adult === true) return true;
  
  // 2. COMPREHENSIVE EXPLICIT/ADULT/PORN KEYWORDS
  const explicitKeywords = [
    'porn', 'xxx', 'adult', 'erotic', 'sex tape', 'nude', 'naked', 'strip', 
    'hooker', 'prostitute', 'call girl', 'escort', 'brothel', 'orgy',
    'threesome', 'gangbang', 'bukkake', 'bdsm', 'fetish', 'hardcore',
    'softcore', 'explicit', 'uncensored', 'x-rated', 'blue movie',
    'milf', 'teen sex', 'barely legal', 'creampie', 'anal', 
    'blowjob', 'cumshot', 'masturbation', 'dildo', 'vibrator',
    'sex toy', 'lingerie', 'panties', 'thong', 'nipple', 'pussy',
    'cock', 'dick', 'penis', 'vagina', 'orgasm', 'climax',
    'seduction', 'temptation', 'lust', 'desire', 'passionate',
    'sensual', 'intimate', 'mature content', 'parental advisory', 
    'adults only', '18+', '21+', 'rated x', 'sexy', 'hot'
  ];
  
  // 3. COMPREHENSIVE ROMANTIC CONTENT KEYWORDS
  const romanticKeywords = [
    'romance', 'romantic', 'love story', 'love affair', 'love triangle',
    'passion', 'passionate', 'desire', 'soulmate', 'true love',
    'heart', 'heartbreak', 'romantic comedy', 'rom com', 'romcom',
    'dating', 'relationship', 'boyfriend', 'girlfriend', 'husband', 'wife',
    'wedding', 'marriage', 'bride', 'groom', 'engagement', 'proposal',
    'valentine', 'kiss', 'embrace', 'tender', 'affection', 'devotion',
    'emotional', 'feelings', 'chemistry', 'attraction', 'crush',
    'falling in love', 'love at first sight', 'romantic drama',
    'intimate moments', 'romantic tension', 'forbidden love',
    'star-crossed lovers', 'romantic fantasy', 'romantic thriller'
  ];
  
  // 4. COMPREHENSIVE LGBTQ KEYWORDS
  const lgbtqKeywords = [
    'gay', 'lesbian', 'bisexual', 'transgender', 'queer', 'lgbt', 'lgbtq',
    'homosexual', 'same-sex', 'pride', 'coming out', 'gender identity',
    'sexual orientation', 'drag queen', 'drag king', 'trans', 'gender fluid',
    'non-binary', 'pansexual', 'asexual', 'intersex', 'two-spirit',
    'rainbow', 'pride flag', 'gay rights', 'marriage equality',
    'gender dysphoria', 'transition', 'hormone therapy', 'top surgery',
    'bottom surgery', 'chosen family', 'gay bar', 'gay club',
    'lesbian couple', 'gay couple', 'same-sex marriage', 'gay wedding'
  ];

  // 5. TV SHOW KEYWORDS (to filter out TV content)
  const tvKeywords = [
    'series', 'season', 'episode', 'tv show', 'television', 'sitcom',
    'drama series', 'miniseries', 'web series', 'streaming series',
    'tv movie', 'made for tv', 'pilot episode', 'season finale',
    'tv special', 'documentary series', 'reality show', 'game show',
    'talk show', 'news show', 'variety show', 'soap opera'
  ];

  const title = (movie.title || '').toLowerCase();
  const plot = (movie.plot || '').toLowerCase();
  const genre = Array.isArray(movie.genre) ? movie.genre.join(' ').toLowerCase() : '';
  const country = (movie.country || '').toLowerCase();
  const language = (movie.language || '').toLowerCase();
  
  // Check for ALL unwanted keywords in title
  if (explicitKeywords.some(keyword => title.includes(keyword)) ||
      romanticKeywords.some(keyword => title.includes(keyword)) ||
      lgbtqKeywords.some(keyword => title.includes(keyword)) ||
      tvKeywords.some(keyword => title.includes(keyword))) {
    return true;
  }
  
  // Check for ALL unwanted keywords in plot
  if (explicitKeywords.some(keyword => plot.includes(keyword)) ||
      romanticKeywords.some(keyword => plot.includes(keyword)) ||
      lgbtqKeywords.some(keyword => plot.includes(keyword)) ||
      tvKeywords.some(keyword => plot.includes(keyword))) {
    return true;
  }
  
  // Check for ALL unwanted keywords in genre
  if (explicitKeywords.some(keyword => genre.includes(keyword)) ||
      romanticKeywords.some(keyword => genre.includes(keyword)) ||
      lgbtqKeywords.some(keyword => genre.includes(keyword)) ||
      tvKeywords.some(keyword => genre.includes(keyword))) {
    return true;
  }

  // 6. FILTER NON-ENGLISH CONTENT
  const nonEnglishLanguages = [
    'hindi', 'spanish', 'french', 'german', 'italian', 'japanese', 'korean',
    'chinese', 'mandarin', 'cantonese', 'arabic', 'portuguese', 'russian',
    'dutch', 'swedish', 'norwegian', 'danish', 'finnish', 'polish',
    'czech', 'hungarian', 'romanian', 'bulgarian', 'serbian', 'croatian',
    'slovak', 'slovenian', 'lithuanian', 'latvian', 'estonian', 'greek',
    'turkish', 'hebrew', 'persian', 'farsi', 'urdu', 'bengali', 'tamil',
    'telugu', 'marathi', 'gujarati', 'punjabi', 'malayalam', 'kannada',
    'thai', 'vietnamese', 'indonesian', 'malay', 'tagalog', 'swahili'
  ];

  if (nonEnglishLanguages.some(lang => language.includes(lang)) ||
      nonEnglishLanguages.some(lang => country.includes(lang))) {
    return true;
  }

  // 7. Filter non-English speaking countries
  const nonEnglishCountries = [
    'india', 'china', 'japan', 'korea', 'france', 'germany', 'italy', 'spain',
    'russia', 'brazil', 'mexico', 'argentina', 'colombia', 'venezuela',
    'peru', 'chile', 'ecuador', 'bolivia', 'uruguay', 'paraguay',
    'turkey', 'iran', 'iraq', 'saudi arabia', 'egypt', 'morocco',
    'algeria', 'tunisia', 'lebanon', 'syria', 'jordan', 'israel',
    'pakistan', 'bangladesh', 'sri lanka', 'nepal', 'myanmar',
    'thailand', 'vietnam', 'cambodia', 'laos', 'malaysia', 'indonesia',
    'philippines', 'singapore', 'brunei', 'poland', 'czech republic',
    'hungary', 'romania', 'bulgaria', 'serbia', 'croatia', 'bosnia',
    'montenegro', 'macedonia', 'albania', 'greece', 'portugal'
  ];

  if (nonEnglishCountries.some(country_name => country.includes(country_name))) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  });

  try {
    // Check if we have cached data that's still fresh
    const now = Date.now();
    if (cachedData.data && (now - cachedData.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedData.data, {
        status: 200,
        headers: {
          ...Object.fromEntries(headers),
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=7200', // 2 hours
        },
      });
    }

    // Extract query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';

    // Fetch from IMDB API via RapidAPI
    const response = await fetch(`${IMDB_API_URL}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Accept': 'application/json',
      },
    });

    // Handle API rate limiting
    if (response.status === 429) {
      const errorResponse: ErrorResponse = {
        error: 'Rate Limit Exceeded',
        message: 'Too many requests to IMDB API. Please try again later.',
        status: 429,
      };
      
      return NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          ...Object.fromEntries(headers),
          'Retry-After': '60',
        },
      });
    }

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('IMDB API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      const errorResponse: ErrorResponse = {
        error: 'IMDB API Error',
        message: response.status === 404 
          ? 'Movies not found' 
          : `Failed to fetch popular movies: ${response.statusText}`,
        status: response.status,
      };

      return NextResponse.json(errorResponse, {
        status: response.status >= 500 ? 502 : response.status,
        headers,
      });
    }

    // Parse response data
    const data: IMDBPopularResponse = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      const errorResponse: ErrorResponse = {
        error: 'Invalid Response',
        message: 'Received invalid response format from IMDB API',
        status: 502,
      };

      return NextResponse.json(errorResponse, {
        status: 502,
        headers,
      });
    }

    // Filter out ALL unwanted content
    const filteredMovies = (data.movies || []).filter((movie: any) => {
      return !isFilteredContent(movie);
    });

    const filteredData = {
      ...data,
      movies: filteredMovies,
      content_filter: 'adult_romantic_lgbtq_tv_foreign_content_removed',
      filtered_count: (data.movies?.length || 0) - filteredMovies.length,
      total: filteredMovies.length
    };

    // Cache the successful response
    cachedData = {
      data: filteredData,
      timestamp: now,
    };

    // Return the data with cache headers
    return NextResponse.json(filteredData, {
      status: 200,
      headers: {
        ...Object.fromEntries(headers),
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=7200', // 2 hours
        'ETag': `"${now}"`,
        'X-Powered-By': 'FLKRD STUDIO',
        'X-Created-By': 'Zana Faroq'
      },
    });

  } catch (error) {
    console.error('API Route Error:', error);

    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      status: 500,
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers,
    });
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}