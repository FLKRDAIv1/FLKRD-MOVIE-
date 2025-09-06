import { NextRequest, NextResponse } from 'next/server';

// Types for IMDB API responses
interface IMDBSearchResult {
  id: string;
  title: string;
  year?: string;
  type: 'movie' | 'tv' | 'person';
  poster?: string;
  rating?: string;
  genre?: string[];
  plot?: string;
  actors?: string[];
  director?: string;
  runtime?: string;
}

interface IMDBApiResponse {
  results: IMDBSearchResult[];
  total: number;
  page: number;
}

interface SearchParams {
  q: string;
  page?: number;
  type?: 'movie' | 'tv' | 'person';
}

interface CachedResult {
  data: IMDBApiResponse;
  timestamp: number;
}

// In-memory cache with 30-minute TTL
const cache = new Map<string, CachedResult>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

// RapidAPI configuration
const RAPIDAPI_KEY = '4ac41bbda9mshac0c3ed221d5b05p12b4d7jsn701206e04335';
const RAPIDAPI_HOST = 'imdb-movies-shows-persons-api.p.rapidapi.com';
const API_BASE_URL = 'https://imdb-movies-shows-persons-api.p.rapidapi.com';

// Ultra comprehensive content filtering for ALL unwanted content
function isFilteredContent(item: any): boolean {
  // 1. BLOCK ALL TV SHOWS COMPLETELY
  if (item.type === 'tv' || item.type === 'series' || item.type === 'tvshow') return true;
  
  // 2. BLOCK ALL PERSONS/ACTORS
  if (item.type === 'person' || item.type === 'name') return true;
  
  // 3. Check adult flag
  if (item.adult === true) return true;
  
  // 4. COMPREHENSIVE EXPLICIT/ADULT/PORN KEYWORDS
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
  
  // 5. COMPREHENSIVE ROMANTIC CONTENT KEYWORDS
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
  
  // 6. COMPREHENSIVE LGBTQ KEYWORDS
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

  // 7. TV SHOW KEYWORDS (to filter out TV content)
  const tvKeywords = [
    'series', 'season', 'episode', 'tv show', 'television', 'sitcom',
    'drama series', 'miniseries', 'web series', 'streaming series',
    'tv movie', 'made for tv', 'pilot episode', 'season finale',
    'tv special', 'documentary series', 'reality show', 'game show',
    'talk show', 'news show', 'variety show', 'soap opera'
  ];

  const title = (item.title || '').toLowerCase();
  const plot = (item.plot || '').toLowerCase();
  const genre = Array.isArray(item.genre) ? item.genre.join(' ').toLowerCase() : '';
  
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

  return false;
}

// Utility functions
function sanitizeQuery(query: string): string {
  return query.trim().replace(/[<>]/g, '');
}

function validateSearchParams(url: URL): SearchParams | { error: string } {
  const q = url.searchParams.get('q');
  
  if (!q) {
    return { error: 'Query parameter "q" is required' };
  }

  if (q.length < 2) {
    return { error: 'Query must be at least 2 characters long' };
  }

  if (q.length > 100) {
    return { error: 'Query must be less than 100 characters' };
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  if (page < 1 || page > 100) {
    return { error: 'Page must be between 1 and 100' };
  }

  // FORCE MOVIE TYPE ONLY - no TV shows or persons allowed
  const type = 'movie'; // Always search for movies only

  return {
    q: sanitizeQuery(q),
    page,
    type
  };
}

function getCacheKey(params: SearchParams): string {
  return `${params.q}-${params.page || 1}-movie-only`;
}

function getCachedResult(key: string): IMDBApiResponse | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedResult(key: string, data: IMDBApiResponse): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

async function fetchFromIMDB(params: SearchParams): Promise<IMDBApiResponse> {
  const url = new URL(`${API_BASE_URL}/search/movie`); // Only search movies
  url.searchParams.set('query', params.q);
  
  if (params.page && params.page > 1) {
    url.searchParams.set('page', params.page.toString());
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
      'Accept': 'application/json',
      'User-Agent': 'FLKRD-Movies/1.0'
    },
    // Add timeout
    signal: AbortSignal.timeout(10000) // 10 second timeout
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    } else if (response.status === 403) {
      throw new Error('API_KEY_INVALID');
    } else if (response.status >= 500) {
      throw new Error('API_SERVER_ERROR');
    } else {
      throw new Error(`API_ERROR_${response.status}`);
    }
  }

  const data = await response.json();
  
  // Transform the response to match our interface and filter content
  const allResults: IMDBSearchResult[] = (data.results || []).map((item: any) => ({
    id: item.id || item.imdbID || '',
    title: item.title || item.Title || '',
    year: item.year || item.Year || '',
    type: 'movie', // Force to movie type
    poster: item.poster || item.Poster || '',
    rating: item.rating || item.imdbRating || '',
    genre: item.genre || (item.Genre ? item.Genre.split(', ') : []),
    plot: item.plot || item.Plot || '',
    actors: item.actors || (item.Actors ? item.Actors.split(', ') : []),
    director: item.director || item.Director || '',
    runtime: item.runtime || item.Runtime || ''
  }));

  // Filter out ALL unwanted content
  const filteredResults = allResults.filter((item: any) => {
    return !isFilteredContent(item);
  });

  return {
    results: filteredResults,
    total: filteredResults.length,
    page: params.page || 1
  };
}

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Validate parameters
    const validationResult = validateSearchParams(url);
    if ('error' in validationResult) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: validationResult.error,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
    }

    const params = validationResult as SearchParams;
    const cacheKey = getCacheKey(params);

    // Check cache first
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      const response = NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true,
        content_filter: 'adult_romantic_lgbtq_tv_foreign_content_removed',
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'X-Powered-By': 'FLKRD STUDIO',
          'X-Created-By': 'Zana Faroq'
        }
      });
      return addCorsHeaders(response);
    }

    // Fetch from IMDB API
    const searchResults = await fetchFromIMDB(params);
    
    // Cache the result
    setCachedResult(cacheKey, searchResults);

    const response = NextResponse.json({
      success: true,
      data: searchResults,
      cached: false,
      content_filter: 'adult_romantic_lgbtq_tv_foreign_content_removed',
      filtered_count: 'filtered_at_source',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'X-Powered-By': 'FLKRD STUDIO',
        'X-Created-By': 'Zana Faroq'
      }
    });
    
    return addCorsHeaders(response);

  } catch (error: any) {
    console.error('IMDB API Error:', error);

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'An internal server error occurred';

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      statusCode = 408;
      errorCode = 'REQUEST_TIMEOUT';
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.message === 'RATE_LIMIT_EXCEEDED') {
      statusCode = 429;
      errorCode = 'RATE_LIMIT_EXCEEDED';
      errorMessage = 'API rate limit exceeded. Please try again later.';
    } else if (error.message === 'API_KEY_INVALID') {
      statusCode = 403;
      errorCode = 'API_KEY_INVALID';
      errorMessage = 'Invalid API key configuration';
    } else if (error.message === 'API_SERVER_ERROR') {
      statusCode = 502;
      errorCode = 'API_SERVER_ERROR';
      errorMessage = 'IMDB API is currently unavailable';
    } else if (error.message?.startsWith('API_ERROR_')) {
      statusCode = 502;
      errorCode = 'API_ERROR';
      errorMessage = 'External API error occurred';
    } else if (error.cause?.code === 'ENOTFOUND' || error.cause?.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorCode = 'SERVICE_UNAVAILABLE';
      errorMessage = 'Service temporarily unavailable';
    }

    const errorResponse = NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
    
    return addCorsHeaders(errorResponse);
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}