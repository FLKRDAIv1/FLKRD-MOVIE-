import { NextResponse } from 'next/server';

const TMDB_API_KEY = 'd78432f39cd63211deb311460cfee367';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Ultra comprehensive content filtering for ALL unwanted content
function isFilteredContent(movie: any): boolean {
  // 1. Check TMDB adult flag
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
    'star-crossed lovers', 'romantic fantasy', 'romantic thriller',
    'love conquers all', 'happily ever after', 'romantic journey'
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
  const overview = (movie.overview || '').toLowerCase();
  const originalTitle = (movie.original_title || '').toLowerCase();
  
  // Check for ALL unwanted keywords in title and original title
  const allTitles = `${title} ${originalTitle}`;
  if (explicitKeywords.some(keyword => allTitles.includes(keyword)) ||
      romanticKeywords.some(keyword => allTitles.includes(keyword)) ||
      lgbtqKeywords.some(keyword => allTitles.includes(keyword)) ||
      tvKeywords.some(keyword => allTitles.includes(keyword))) {
    return true;
  }
  
  // 6. Check overview for ALL unwanted content phrases
  const explicitPhrases = [
    'adult film', 'porn star', 'sexual fantasy', 'erotic thriller',
    'nude scene', 'sexual content', 'explicit sex', 'adult entertainment',
    'sex worker', 'strip club', 'adult industry', 'pornography',
    'sexual encounter', 'intimate scene', 'bedroom scene', 'love scene',
    'sexual tension', 'seductive', 'provocative', 'steamy',
    'sexual desire', 'carnal', 'lustful', 'passionate love',
    'mature themes', 'adult situations', 'sexual violence'
  ];
  
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

  const lgbtqPhrases = [
    'gay pride', 'coming out story', 'same-sex relationship',
    'lgbt community', 'gender transition', 'drag performance',
    'gay marriage', 'lesbian relationship', 'transgender journey',
    'queer identity', 'sexual orientation', 'gay rights movement'
  ];

  if (explicitPhrases.some(phrase => overview.includes(phrase)) ||
      romanticPhrases.some(phrase => overview.includes(phrase)) ||
      lgbtqPhrases.some(phrase => overview.includes(phrase))) {
    return true;
  }
  
  // 7. Check for romance genre IDs - filter ALL romance movies
  if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
    if (movie.genre_ids.includes(10749)) { // Romance genre
      return true;
    }
  }

  // 8. FILTER NON-ENGLISH CONTENT BY LANGUAGE
  const originalLanguage = (movie.original_language || '').toLowerCase();
  if (originalLanguage && originalLanguage !== 'en') {
    return true; // Filter out all non-English movies
  }

  // 9. Additional language checking in overview/title for foreign content
  const foreignLanguageIndicators = [
    'hindi', 'bollywood', 'telugu', 'tamil', 'malayalam', 'kannada', 'marathi',
    'gujarati', 'punjabi', 'bengali', 'korean', 'k-drama', 'anime', 'manga',
    'chinese', 'mandarin', 'cantonese', 'japanese', 'french', 'german',
    'italian', 'spanish', 'portuguese', 'russian', 'arabic', 'turkish',
    'persian', 'farsi', 'dutch', 'swedish', 'norwegian', 'polish'
  ];

  if (foreignLanguageIndicators.some(indicator => 
    title.includes(indicator) || overview.includes(indicator) || originalTitle.includes(indicator)
  )) {
    return true;
  }
  
  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`,
      { 
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch trending movies');
    }

    const data = await response.json();

    // Filter out ALL unwanted content
    const filteredResults = data.results.filter((movie: any) => {
      return !isFilteredContent(movie);
    });

    return NextResponse.json({
      ...data,
      results: filteredResults,
      content_filter: 'adult_romantic_lgbtq_tv_foreign_content_removed',
      filtered_count: data.results.length - filteredResults.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Powered-By': 'FLKRD STUDIO',
        'X-Created-By': 'Zana Faroq'
      }
    });

  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending movies', details: error },
      { status: 500 }
    );
  }
}