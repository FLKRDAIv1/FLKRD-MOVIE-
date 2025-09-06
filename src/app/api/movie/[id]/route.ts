import { NextResponse } from 'next/server';

const TMDB_API_KEY = 'd78432f39cd63211deb311460cfee367';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Ultra comprehensive content filtering for adult/sexual content AND romantic content
function isExplicitOrRomanticContent(movie: any): boolean {
  // 1. Check TMDB adult flag
  if (movie.adult === true) return true;
  
  // 2. Comprehensive explicit sexual/pornographic keywords
  const explicitKeywords = [
    'porn', 'xxx', 'adult', 'erotic', 'sex tape', 'nude', 'naked', 'strip', 
    'hooker', 'prostitute', 'call girl', 'escort', 'brothel', 'orgy',
    'threesome', 'gangbang', 'bukkake', 'bdsm', 'fetish', 'hardcore',
    'softcore', 'explicit', 'uncensored', 'x-rated', 'blue movie',
    'lesbian', 'gay porn', 'bisexual', 'shemale', 'transgender porn',
    'milf', 'teen sex', 'barely legal', 'creampie', 'anal', 
    'blowjob', 'cumshot', 'masturbation', 'dildo', 'vibrator',
    'sex toy', 'lingerie', 'panties', 'thong', 'nipple', 'pussy',
    'cock', 'dick', 'penis', 'vagina', 'orgasm', 'climax',
    'seduction', 'temptation', 'lust', 'desire', 'passionate',
    'sensual', 'intimate', 'romance adult', 'mature content',
    'parental advisory', 'adults only', '18+', '21+', 'rated x'
  ];
  
  // 3. Comprehensive romantic content keywords
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
    'star-crossed lovers', 'romantic fantasy', 'romantic thriller',
    'love conquers all', 'happily ever after', 'romantic journey'
  ];
  
  const title = (movie.title || '').toLowerCase();
  const overview = (movie.overview || '').toLowerCase();
  const originalTitle = (movie.original_title || '').toLowerCase();
  const tagline = (movie.tagline || '').toLowerCase();
  
  // Check title and original title for explicit keywords
  if (explicitKeywords.some(keyword => 
    title.includes(keyword) || originalTitle.includes(keyword)
  )) {
    return true;
  }
  
  // Check title and original title for romantic keywords
  if (romanticKeywords.some(keyword => 
    title.includes(keyword) || originalTitle.includes(keyword) || tagline.includes(keyword)
  )) {
    return true;
  }
  
  // 4. Check overview for explicit content more aggressively
  const explicitPhrases = [
    'adult film', 'porn star', 'sexual fantasy', 'erotic thriller',
    'nude scene', 'sexual content', 'explicit sex', 'adult entertainment',
    'sex worker', 'strip club', 'adult industry', 'pornography',
    'sexual encounter', 'intimate scene', 'bedroom scene', 'love scene',
    'sexual tension', 'seductive', 'provocative', 'steamy',
    'sexual desire', 'carnal', 'lustful', 'passionate love',
    'mature themes', 'adult situations', 'sexual violence'
  ];
  
  // 5. Check overview for romantic content phrases
  const romanticPhrases = [
    'love story', 'romantic journey', 'falling in love', 'true love',
    'romantic comedy', 'romantic drama', 'love triangle', 'love affair',
    'romantic relationship', 'passionate romance', 'heartbreak',
    'wedding day', 'marriage proposal', 'romantic tension',
    'chemistry between', 'romantic connection', 'love interest',
    'romantic subplot', 'romantic entanglement', 'forbidden romance',
    'romantic fantasy', 'romantic adventure', 'romantic thriller',
    'emotional journey', 'heart-warming', 'touching romance',
    'romantic moments', 'intimate relationship', 'deep connection',
    'soulmates', 'destined love', 'romantic destiny'
  ];
  
  // More aggressive overview checking - even one explicit or romantic phrase triggers filter
  if (explicitPhrases.some(phrase => overview.includes(phrase)) ||
      romanticPhrases.some(phrase => overview.includes(phrase))) {
    return true;
  }
  
  // 6. Check for romance genre IDs
  if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
    // Genre 10749 is Romance - filter ALL romance movies
    if (movie.genre_ids.includes(10749)) {
      return true;
    }
  }
  
  // 7. Check for romance in genres array (for detailed movie data)
  if (movie.genres && Array.isArray(movie.genres)) {
    if (movie.genres.some((genre: any) => 
      genre.name && (
        genre.name.toLowerCase().includes('romance') ||
        genre.id === 10749
      )
    )) {
      return true;
    }
  }
  
  // 8. Check vote average - adult content often has very low or artificially high ratings
  if (movie.vote_average && (movie.vote_average < 3.0 || movie.vote_average > 9.5)) {
    // Combined with suggestive content, filter it
    const suggestiveTerms = ['adult', 'mature', 'explicit', 'erotic'];
    if (suggestiveTerms.some(term => title.includes(term) || overview.includes(term))) {
      return true;
    }
  }
  
  return false;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const movieId = params.id;

  try {
    // Make parallel API calls for better performance
    const [movieResponse, creditsResponse, videosResponse] = await Promise.allSettled([
      fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`),
      fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=en-US`),
      fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`)
    ]);

    // Handle movie details response
    if (movieResponse.status === 'rejected' || !movieResponse.value.ok) {
      throw new Error('Movie not found');
    }

    const movieData = await movieResponse.value.json();

    // Filter explicit adult content AND romantic content
    if (isExplicitOrRomanticContent(movieData)) {
      return NextResponse.json(
        { error: 'Content not available' },
        { status: 404 }
      );
    }

    // Handle credits response (graceful degradation)
    let credits = { cast: [], crew: [] };
    if (creditsResponse.status === 'fulfilled' && creditsResponse.value.ok) {
      credits = await creditsResponse.value.json();
    }

    // Handle videos response (graceful degradation)
    let videos = { results: [] };
    if (videosResponse.status === 'fulfilled' && videosResponse.value.ok) {
      videos = await videosResponse.value.json();
    }

    // Enhanced response with better formatting
    const enhancedMovieData = {
      ...movieData,
      credits: {
        cast: credits.cast?.slice(0, 20) || [], // Limit cast to 20 members
        crew: credits.crew?.slice(0, 10) || []  // Limit crew to 10 members
      },
      videos: {
        results: videos.results?.filter((video: any) => 
          video.type === 'Trailer' || video.type === 'Teaser'
        ).slice(0, 3) || [] // Limit to 3 trailers/teasers
      },
      formatted_runtime: movieData.runtime ? `${Math.floor(movieData.runtime / 60)}h ${movieData.runtime % 60}m` : null,
      formatted_budget: movieData.budget ? new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(movieData.budget) : null,
      formatted_revenue: movieData.revenue ? new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0  
      }).format(movieData.revenue) : null,
      cache_status: 'miss',
      last_updated: new Date().toISOString(),
      content_filter: 'adult_and_romantic_content_removed'
    };

    return NextResponse.json(enhancedMovieData, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800', // 24 hours cache
        'X-Powered-By': 'FLKRD STUDIO',
        'X-Created-By': 'Zana Faroq'
      }
    });

  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      { error: 'Movie not found' },
      { 
        status: 404,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'X-Powered-By': 'FLKRD STUDIO',
          'X-Created-By': 'Zana Faroq'
        }
      }
    );
  }
}