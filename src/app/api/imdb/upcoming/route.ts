import { NextRequest, NextResponse } from 'next/server';

interface IMDBMovie {
  id: string;
  title: string;
  originalTitle?: string;
  year: number;
  releaseDate?: string;
  runtime?: number;
  plot?: string;
  poster?: string;
  rating?: number;
  votes?: number;
  genres?: string[];
  directors?: string[];
  cast?: string[];
  country?: string[];
  language?: string[];
  type: 'movie' | 'series';
}

interface IMDBUpcomingResponse {
  movies: IMDBMovie[];
  total: number;
  page?: number;
  totalPages?: number;
}

interface APIErrorResponse {
  error: string;
  code?: string;
  timestamp: string;
}

// Cache for storing responses with timestamps
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

function getCacheKey(region?: string): string {
  return `upcoming-movies-${region || 'default'}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

// Ultra comprehensive content filtering for ALL unwanted content
function isFilteredContent(movie: any): boolean {
  // 1. BLOCK ALL TV SHOWS/SERIES COMPLETELY
  if (movie.type === 'series' || movie.type === 'tv' || movie.type === 'tvshow') return true;
  
  // 2. Check adult flag
  if (movie.adult === true) return true;
  
  // 3. COMPREHENSIVE EXPLICIT/ADULT/PORN KEYWORDS
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
  
  // 4. COMPREHENSIVE ROMANTIC CONTENT KEYWORDS
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
  
  // 5. COMPREHENSIVE LGBTQ KEYWORDS
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

  // 6. TV SHOW KEYWORDS (to filter out TV content)
  const tvKeywords = [
    'series', 'season', 'episode', 'tv show', 'television', 'sitcom',
    'drama series', 'miniseries', 'web series', 'streaming series',
    'tv movie', 'made for tv', 'pilot episode', 'season finale',
    'tv special', 'documentary series', 'reality show', 'game show',
    'talk show', 'news show', 'variety show', 'soap opera'
  ];

  const title = (movie.title || '').toLowerCase();
  const originalTitle = (movie.originalTitle || '').toLowerCase();
  const plot = (movie.plot || '').toLowerCase();
  const genre = Array.isArray(movie.genres) ? movie.genres.join(' ').toLowerCase() : '';
  const country = Array.isArray(movie.country) ? movie.country.join(' ').toLowerCase() : '';
  const language = Array.isArray(movie.language) ? movie.language.join(' ').toLowerCase() : '';
  
  // Check for ALL unwanted keywords
  const allContent = `${title} ${originalTitle} ${plot} ${genre}`;
  
  if (explicitKeywords.some(keyword => allContent.includes(keyword)) ||
      romanticKeywords.some(keyword => allContent.includes(keyword)) ||
      lgbtqKeywords.some(keyword => allContent.includes(keyword)) ||
      tvKeywords.some(keyword => allContent.includes(keyword))) {
    return true;
  }

  // 7. FILTER NON-ENGLISH CONTENT
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

  if (nonEnglishLanguages.some(lang => language.includes(lang))) {
    return true;
  }

  // 8. Filter non-English speaking countries
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
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || undefined;
    
    // Check cache first
    const cacheKey = getCacheKey(region);
    const cached = cache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      const response = NextResponse.json(cached.data);
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      response.headers.set('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=3600');
      response.headers.set('X-Powered-By', 'FLKRD STUDIO');
      response.headers.set('X-Created-By', 'Zana Faroq');
      
      return response;
    }

    // Prepare API request
    const apiUrl = new URL('https://imdb-movies-shows-persons-api.p.rapidapi.com/movies/upcoming');
    
    // Add query parameters
    if (region) {
      apiUrl.searchParams.set('region', region);
    }

    const apiResponse = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'imdb-movies-shows-persons-api.p.rapidapi.com',
        'x-rapidapi-key': '4ac41bbda9mshac0c3ed221d5b05p12b4d7jsn701206e04335',
        'Accept': 'application/json',
        'User-Agent': 'FLKRD-Movies/1.0'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`IMDB API error (${apiResponse.status}):`, errorText);
      
      // Handle specific API error codes
      if (apiResponse.status === 429) {
        const errorResponse: APIErrorResponse = {
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString()
        };
        
        const response = NextResponse.json(errorResponse, { status: 429 });
        response.headers.set('Retry-After', '60');
        return response;
      }
      
      if (apiResponse.status === 401) {
        const errorResponse: APIErrorResponse = {
          error: 'API authentication failed.',
          code: 'UNAUTHORIZED',
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(errorResponse, { status: 500 });
      }
      
      if (apiResponse.status === 403) {
        const errorResponse: APIErrorResponse = {
          error: 'API access forbidden. Please check your subscription.',
          code: 'FORBIDDEN',
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(errorResponse, { status: 500 });
      }
      
      // Generic API error
      const errorResponse: APIErrorResponse = {
        error: 'External API error occurred.',
        code: 'EXTERNAL_API_ERROR',
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(errorResponse, { status: 502 });
    }

    const responseData: IMDBUpcomingResponse = await apiResponse.json();
    
    // Validate response structure
    if (!responseData || typeof responseData !== 'object') {
      const errorResponse: APIErrorResponse = {
        error: 'Invalid response format from external API.',
        code: 'INVALID_RESPONSE',
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(errorResponse, { status: 502 });
    }

    // Filter out ALL unwanted content
    const filteredMovies = (responseData.movies || []).filter((movie: any) => {
      return !isFilteredContent(movie);
    });

    const filteredData = {
      ...responseData,
      movies: filteredMovies,
      content_filter: 'adult_romantic_lgbtq_tv_foreign_content_removed',
      filtered_count: (responseData.movies?.length || 0) - filteredMovies.length,
      total: filteredMovies.length
    };

    // Cache the successful response
    cache.set(cacheKey, {
      data: filteredData,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically (basic cleanup)
    if (cache.size > 100) {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (!isCacheValid(value.timestamp)) {
          cache.delete(key);
        }
      }
    }

    const response = NextResponse.json(filteredData);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=3600');
    response.headers.set('X-Cache-Status', cached ? 'HIT' : 'MISS');
    response.headers.set('X-Powered-By', 'FLKRD STUDIO');
    response.headers.set('X-Created-By', 'Zana Faroq');
    
    return response;
    
  } catch (error) {
    console.error('API route error:', error);
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'TimeoutError') {
      const errorResponse: APIErrorResponse = {
        error: 'Request timeout. The external service is taking too long to respond.',
        code: 'TIMEOUT',
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(errorResponse, { status: 504 });
    }
    
    // Handle network errors
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      const errorResponse: APIErrorResponse = {
        error: 'Network error occurred while fetching data.',
        code: 'NETWORK_ERROR',
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(errorResponse, { status: 503 });
    }
    
    // Generic server error
    const errorResponse: APIErrorResponse = {
      error: 'Internal server error occurred.',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}