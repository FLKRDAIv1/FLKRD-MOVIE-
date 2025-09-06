import { NextRequest, NextResponse } from 'next/server';

interface SubtitleSource {
  language: 'ku' | 'ku-arab' | 'ku-latn';
  name: string;
  url: string;
  format: 'vtt' | 'srt';
  dialect: 'sorani' | 'kurmanji' | 'pehlewani';
  source: string;
  quality: 'high' | 'medium' | 'low';
  downloadCount?: number;
}

interface SubtitleResponse {
  subtitles: SubtitleSource[];
  total: number;
  cached: boolean;
}

interface OpenSubtitlesResponse {
  data?: Array<{
    attributes: {
      language: string;
      files: Array<{
        file_id: number;
        file_name: string;
      }>;
      feature_details?: {
        title?: string;
        year?: number;
      };
      download_count?: number;
    };
  }>;
}

interface YTSSubtitle {
  language: string;
  url: string;
  rating: number;
}

// Cache for storing subtitle results
const subtitleCache = new Map<string, { data: SubtitleResponse; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Kurdish language mappings
const kurdishLanguageCodes = {
  'ku': 'kurdish',
  'ku-arab': 'kurdish_sorani',
  'ku-latn': 'kurdish_kurmanji',
  'ckb': 'kurdish_sorani', // ISO 639-3 for Central Kurdish (Sorani)
  'kmr': 'kurdish_kurmanji' // ISO 639-3 for Northern Kurdish (Kurmanji)
};

const dialectDetection = {
  sorani: ['ckb', 'ku-arab', 'sorani', 'سۆرانی'],
  kurmanji: ['kmr', 'ku-latn', 'kurmanji', 'kurmancî'],
  pehlewani: ['pehlewani', 'southern kurdish']
};

// Common Kurdish movie/TV show title translations
const kurdishTitleMappings: Record<string, string[]> = {
  'spider-man': ['مرۆڤی جاڵجاڵۆکە', 'mirovî jaljaloke'],
  'batman': ['مرۆڤی شەمشەمەکورە', 'mirovî şemşemekure'],
  'superman': ['سوپەرمان', 'superman'],
  'game of thrones': ['یاری تەختەکان', 'yarî textêkan'],
  'breaking bad': ['شکاندنی خراپ', 'şikandinî xirap']
};

function getCacheKey(params: URLSearchParams): string {
  const keys = ['movieId', 'tvShowId', 'season', 'episode', 'title', 'type'];
  return keys.map(key => `${key}:${params.get(key) || ''}`).join('|');
}

function detectDialect(language: string, name: string): 'sorani' | 'kurmanji' | 'pehlewani' {
  const lowerLang = language.toLowerCase();
  const lowerName = name.toLowerCase();
  
  if (dialectDetection.sorani.some(term => lowerLang.includes(term) || lowerName.includes(term))) {
    return 'sorani';
  }
  if (dialectDetection.kurmanji.some(term => lowerLang.includes(term) || lowerName.includes(term))) {
    return 'kurmanji';
  }
  if (dialectDetection.pehlewani.some(term => lowerLang.includes(term) || lowerName.includes(term))) {
    return 'pehlewani';
  }
  
  // Default to Sorani as it's more common
  return 'sorani';
}

function normalizeLanguageCode(lang: string): 'ku' | 'ku-arab' | 'ku-latn' {
  const lowerLang = lang.toLowerCase();
  
  if (lowerLang.includes('arab') || lowerLang === 'ckb') {
    return 'ku-arab';
  }
  if (lowerLang.includes('latn') || lowerLang === 'kmr') {
    return 'ku-latn';
  }
  
  return 'ku';
}

function convertSrtToVtt(srtContent: string): string {
  try {
    const lines = srtContent.split('\n');
    let vttContent = 'WEBVTT\n\n';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Convert SRT timestamp format to VTT format
      if (line.includes(' --> ')) {
        const convertedLine = line.replace(/,/g, '.');
        vttContent += convertedLine + '\n';
      } else if (line && !line.match(/^\d+$/)) {
        // Add subtitle text (skip sequence numbers)
        vttContent += line + '\n';
      } else if (line === '') {
        vttContent += '\n';
      }
    }
    
    return vttContent;
  } catch (error) {
    return srtContent; // Return original if conversion fails
  }
}

async function searchOpenSubtitles(params: {
  movieId?: string;
  tvShowId?: string;
  season?: string;
  episode?: string;
  title?: string;
  year?: string;
}): Promise<SubtitleSource[]> {
  const subtitles: SubtitleSource[] = [];
  
  try {
    const apiKey = process.env.OPENSUBTITLES_API_KEY;
    if (!apiKey) {
      console.warn('OpenSubtitles API key not configured');
      return subtitles;
    }

    // Build search parameters
    const searchParams = new URLSearchParams();
    
    if (params.movieId) {
      searchParams.append('tmdb_id', params.movieId);
    } else if (params.tvShowId) {
      searchParams.append('tmdb_id', params.tvShowId);
      if (params.season) searchParams.append('season_number', params.season);
      if (params.episode) searchParams.append('episode_number', params.episode);
    } else if (params.title) {
      searchParams.append('query', params.title);
      if (params.year) searchParams.append('year', params.year);
    }

    // Search for Kurdish subtitles
    for (const [code, name] of Object.entries(kurdishLanguageCodes)) {
      searchParams.set('languages', code);
      
      const response = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?${searchParams}`, {
        headers: {
          'Api-Key': apiKey,
          'User-Agent': 'FLKRD Movies v1.0'
        }
      });

      if (response.ok) {
        const data: OpenSubtitlesResponse = await response.json();
        
        if (data.data) {
          data.data.forEach(subtitle => {
            const lang = subtitle.attributes.language;
            const dialect = detectDialect(lang, subtitle.attributes.feature_details?.title || '');
            const normalizedLang = normalizeLanguageCode(lang);
            
            subtitle.attributes.files.forEach(file => {
              subtitles.push({
                language: normalizedLang,
                name: file.file_name,
                url: `https://api.opensubtitles.com/api/v1/download?file_id=${file.file_id}`,
                format: file.file_name.endsWith('.vtt') ? 'vtt' : 'srt',
                dialect,
                source: 'OpenSubtitles',
                quality: subtitle.attributes.download_count && subtitle.attributes.download_count > 100 ? 'high' : 'medium',
                downloadCount: subtitle.attributes.download_count
              });
            });
          });
        }
      }
    }
  } catch (error) {
    console.error('OpenSubtitles search error:', error);
  }

  return subtitles;
}

async function searchYTSSubtitles(movieId: string, title?: string): Promise<SubtitleSource[]> {
  const subtitles: SubtitleSource[] = [];
  
  try {
    // YTS API doesn't have direct TMDB integration, so we'll use title search
    if (!title) return subtitles;
    
    const response = await fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(title)}&limit=1`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.data?.movies?.[0]) {
        const movie = data.data.movies[0];
        const imdbCode = movie.imdb_code;
        
        if (imdbCode) {
          // Try to get subtitles from YTS subtitles API
          const subResponse = await fetch(`https://yifysubtitles.org/api/movie-subtitles/${imdbCode}?lang=kurdish`);
          
          if (subResponse.ok) {
            const subData = await subResponse.json();
            
            if (subData.subtitles) {
              Object.entries(subData.subtitles).forEach(([lang, subs]: [string, any]) => {
                if (lang.toLowerCase().includes('kurdish') || lang.toLowerCase().includes('ku')) {
                  const dialect = detectDialect(lang, '');
                  const normalizedLang = normalizeLanguageCode(lang);
                  
                  if (Array.isArray(subs)) {
                    subs.forEach((sub: YTSSubtitle) => {
                      subtitles.push({
                        language: normalizedLang,
                        name: `${title} - Kurdish`,
                        url: sub.url,
                        format: sub.url.endsWith('.vtt') ? 'vtt' : 'srt',
                        dialect,
                        source: 'YTS',
                        quality: sub.rating > 4 ? 'high' : 'medium'
                      });
                    });
                  }
                }
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('YTS subtitles search error:', error);
  }

  return subtitles;
}

async function searchSubscene(title: string, year?: string, season?: string, episode?: string): Promise<SubtitleSource[]> {
  const subtitles: SubtitleSource[] = [];
  
  try {
    // Note: This is a simplified implementation. In production, you'd need to handle Subscene's anti-bot measures
    const searchQuery = season && episode ? `${title} S${season.padStart(2, '0')}E${episode.padStart(2, '0')}` : title;
    
    const response = await fetch(`https://subscene.com/subtitles/search?q=${encodeURIComponent(searchQuery)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (response.ok) {
      const html = await response.text();
      
      // Parse HTML for Kurdish subtitle links (this is a simplified example)
      const kurdishMatches = html.match(/href="([^"]+)"[^>]*>.*?kurdish.*?</gi) || [];
      
      kurdishMatches.forEach((match, index) => {
        const urlMatch = match.match(/href="([^"]+)"/);
        if (urlMatch) {
          const dialect = match.toLowerCase().includes('sorani') ? 'sorani' : 
                         match.toLowerCase().includes('kurmanji') ? 'kurmanji' : 'sorani';
          
          subtitles.push({
            language: dialect === 'sorani' ? 'ku-arab' : 'ku-latn',
            name: `${title} - Kurdish (${dialect})`,
            url: `https://subscene.com${urlMatch[1]}`,
            format: 'srt',
            dialect,
            source: 'Subscene',
            quality: 'medium'
          });
        }
      });
    }
  } catch (error) {
    console.error('Subscene search error:', error);
  }

  return subtitles;
}

async function generateFallbackSubtitles(params: {
  title?: string;
  movieId?: string;
  tvShowId?: string;
  season?: string;
  episode?: string;
}): Promise<SubtitleSource[]> {
  const subtitles: SubtitleSource[] = [];
  
  try {
    // This would integrate with a translation service or AI service
    // For now, we'll create placeholder entries indicating availability
    
    if (params.title) {
      // Check if we have Kurdish translations for this title
      const kurdishTitles = kurdishTitleMappings[params.title.toLowerCase()] || [];
      
      if (kurdishTitles.length > 0) {
        subtitles.push({
          language: 'ku-arab',
          name: `${params.title} - Kurdish Sorani (Generated)`,
          url: `/api/subtitles/generate?title=${encodeURIComponent(params.title)}&lang=ku-arab`,
          format: 'vtt',
          dialect: 'sorani',
          source: 'Generated',
          quality: 'low'
        });

        subtitles.push({
          language: 'ku-latn',
          name: `${params.title} - Kurdish Kurmanji (Generated)`,
          url: `/api/subtitles/generate?title=${encodeURIComponent(params.title)}&lang=ku-latn`,
          format: 'vtt',
          dialect: 'kurmanji',
          source: 'Generated',
          quality: 'low'
        });
      }
    }
  } catch (error) {
    console.error('Fallback subtitle generation error:', error);
  }

  return subtitles;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = getCacheKey(searchParams);
    
    // Check cache first
    const cached = subtitleCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    const movieId = searchParams.get('movieId');
    const tvShowId = searchParams.get('tvShowId');
    const season = searchParams.get('season');
    const episode = searchParams.get('episode');
    const title = searchParams.get('title');
    const type = searchParams.get('type');
    const year = searchParams.get('year');

    // Validate required parameters
    if (!movieId && !tvShowId && !title) {
      return NextResponse.json({
        subtitles: [],
        total: 0,
        cached: false,
        error: 'Missing required parameters: movieId, tvShowId, or title'
      }, { status: 400 });
    }

    if (tvShowId && (!season || !episode)) {
      return NextResponse.json({
        subtitles: [],
        total: 0,
        cached: false,
        error: 'TV shows require season and episode parameters'
      }, { status: 400 });
    }

    const searchParams_obj = {
      movieId: movieId || undefined,
      tvShowId: tvShowId || undefined,
      season: season || undefined,
      episode: episode || undefined,
      title: title || undefined,
      year: year || undefined
    };

    // Search all sources concurrently
    const [
      openSubtitles,
      ytsSubtitles,
      subsceneSubtitles,
      fallbackSubtitles
    ] = await Promise.allSettled([
      searchOpenSubtitles(searchParams_obj),
      movieId && title ? searchYTSSubtitles(movieId, title) : Promise.resolve([]),
      title ? searchSubscene(title, year || undefined, season || undefined, episode || undefined) : Promise.resolve([]),
      generateFallbackSubtitles(searchParams_obj)
    ]);

    // Combine results
    let allSubtitles: SubtitleSource[] = [];
    
    if (openSubtitles.status === 'fulfilled') {
      allSubtitles.push(...openSubtitles.value);
    }
    if (ytsSubtitles.status === 'fulfilled') {
      allSubtitles.push(...ytsSubtitles.value);
    }
    if (subsceneSubtitles.status === 'fulfilled') {
      allSubtitles.push(...subsceneSubtitles.value);
    }
    if (fallbackSubtitles.status === 'fulfilled') {
      allSubtitles.push(...fallbackSubtitles.value);
    }

    // Remove duplicates and sort by quality
    const uniqueSubtitles = Array.from(
      new Map(allSubtitles.map(sub => [`${sub.url}-${sub.language}`, sub])).values()
    );

    // Sort by quality (high > medium > low) and download count
    uniqueSubtitles.sort((a, b) => {
      const qualityOrder = { high: 3, medium: 2, low: 1 };
      const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
      if (qualityDiff !== 0) return qualityDiff;
      
      return (b.downloadCount || 0) - (a.downloadCount || 0);
    });

    const response: SubtitleResponse = {
      subtitles: uniqueSubtitles,
      total: uniqueSubtitles.length,
      cached: false
    };

    // Cache the response
    subtitleCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    // Clean old cache entries periodically
    if (subtitleCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of subtitleCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          subtitleCache.delete(key);
        }
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Kurdish subtitles API error:', error);
    
    // Always return a valid response structure, even on error
    return NextResponse.json({
      subtitles: [],
      total: 0,
      cached: false,
      error: 'Failed to fetch subtitles'
    });
  }
}