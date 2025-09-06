import { NextRequest, NextResponse } from 'next/server';

// Cache for generated subtitles
const subtitleCache = new Map();

// Sample Kurdish translations for popular movie quotes
const sampleContent = {
  sorani: {
    "The Shawshank Redemption": [
      { start: 300, end: 304, text: "ئومێد شتێکی باشە، لەوانەیە باشترین شت بێت" },
      { start: 305, end: 309, text: "هیچ شتێکی باش نامرێت" },
      { start: 7200, end: 7206, text: "یا بژی، یا بمری. هەڵبژاردە خۆتە" },
      { start: 7800, end: 7804, text: "ئازادی یاخود مردن" }
    ],
    "The Godfather": [
      { start: 180, end: 185, text: "داوایەکم لێت دەکەم کە نەیتوانی ڕەتی بکەیتەوە" },
      { start: 1200, end: 1206, text: "ئەوە پیشکەشکردنێکە کە ناتوانی ڕەتی بکەیتەوە" },
      { start: 2400, end: 2405, text: "ڕێز و سەروەری گرنگە لە ئێمەدا" }
    ],
    "Pulp Fiction": [
      { start: 420, end: 425, text: "ڕێگای ئەو پیاوە ڕاستەقینەی کە بە خۆشەویستی دەوری دەکات" },
      { start: 1800, end: 1805, text: "جیاوازی نێوان تۆ و من ئەوەیە من مۆزیک گوێ دەگرم" },
      { start: 3600, end: 3605, text: "بە زمانی ئینگلیزی قسە دەکەیت؟" }
    ]
  },
  kurmanji: {
    "The Shawshank Redemption": [
      { start: 300, end: 304, text: "Hêvî tiştekî baş e, dibe ku baştirîn tişt be" },
      { start: 305, end: 309, text: "Tu tiştî baş namire" },
      { start: 7200, end: 7206, text: "Bijî yan bimire. Hilbijartinek te ye" },
      { start: 7800, end: 7804, text: "Azadî yan mirin" }
    ],
    "The Godfather": [
      { start: 180, end: 185, text: "Daxwazek ji te dikim ku nikarî red bikî" },
      { start: 1200, end: 1206, text: "Ev pêşkêşkirinek e ku nikarî red bikî" },
      { start: 2400, end: 2405, text: "Rêz û seruwerî girîng e li cem me" }
    ],
    "Pulp Fiction": [
      { start: 420, end: 425, text: "Rêya wî mirovî rastîn ê ku bi xoşewîstiyê derdor dike" },
      { start: 1800, end: 1805, text: "Ciyawaziya di navbera te û min de ew e ku ez mûzîk guhdarî dikim" },
      { start: 3600, end: 3605, text: "Tu bi zimanî înglîzî dipeyivî?" }
    ]
  }
};

// Common Kurdish phrases for fallback content
const commonPhrases = {
  sorani: [
    "سڵاو چۆنیت؟",
    "زۆر سوپاست",
    "ببورە",
    "چاوەڕوان بە",
    "با بڕۆین",
    "ئەمە باشە",
    "نەخێر، سوپاس",
    "بەڵێ، ئەو ڕاستە",
    "چۆن دەتوانم یارمەتیت بدەم؟",
    "تکایە وەستە"
  ],
  kurmanji: [
    "Silav, çawa yî?",
    "Gelek sipas",
    "Bibore",
    "Bendîne be",
    "Bila herin",
    "Ev baş e",
    "Na, sipas",
    "Erê, ew rast e",
    "Çawa dikarim alîkariya te bikim?",
    "Ji kerema xwe raweste"
  ]
};

function generateVTTContent(subtitles, dialect) {
  let vtt = "WEBVTT\n\n";
  
  subtitles.forEach((subtitle, index) => {
    const startTime = formatVTTTime(subtitle.start);
    const endTime = formatVTTTime(subtitle.end);
    
    vtt += `${index + 1}\n`;
    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${subtitle.text}\n\n`;
  });
  
  return vtt;
}

function formatVTTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

function generateFallbackSubtitles(title, dialect, duration = 7200) {
  const phrases = commonPhrases[dialect] || commonPhrases.kurmanji;
  const subtitles = [];
  const segmentDuration = 4; // 4 seconds per subtitle
  const numSegments = Math.floor(duration / segmentDuration);
  
  for (let i = 0; i < Math.min(numSegments, 100); i++) {
    const start = i * segmentDuration;
    const end = start + segmentDuration - 0.5;
    const phraseIndex = i % phrases.length;
    
    subtitles.push({
      start,
      end,
      text: phrases[phraseIndex]
    });
  }
  
  return subtitles;
}

function getSampleSubtitles(title, dialect) {
  const dialectContent = sampleContent[dialect];
  if (dialectContent && dialectContent[title]) {
    return dialectContent[title];
  }
  
  // Check if title contains any keywords from sample content
  for (const sampleTitle in dialectContent || {}) {
    if (title.toLowerCase().includes(sampleTitle.toLowerCase()) || 
        sampleTitle.toLowerCase().includes(title.toLowerCase())) {
      return dialectContent[sampleTitle];
    }
  }
  
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const movieId = searchParams.get('movieId');
    const tvShowId = searchParams.get('tvShowId');
    const season = searchParams.get('season');
    const episode = searchParams.get('episode');
    const title = searchParams.get('title') || 'Unknown Title';
    const dialect = searchParams.get('dialect') || 'kurmanji';
    const type = searchParams.get('type') || 'movie';
    
    // Validate parameters
    if (!movieId && !tvShowId) {
      return NextResponse.json(
        { error: 'Either movieId or tvShowId is required' },
        { status: 400 }
      );
    }
    
    if (!['sorani', 'kurmanji'].includes(dialect)) {
      return NextResponse.json(
        { error: 'Dialect must be either "sorani" or "kurmanji"' },
        { status: 400 }
      );
    }
    
    if (!['movie', 'tv'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "movie" or "tv"' },
        { status: 400 }
      );
    }
    
    // For TV shows, validate season and episode
    if (type === 'tv' && (!season || !episode)) {
      return NextResponse.json(
        { error: 'Season and episode are required for TV shows' },
        { status: 400 }
      );
    }
    
    // Generate cache key
    const cacheKey = type === 'movie' 
      ? `${movieId}-${dialect}-${title}`
      : `${tvShowId}-${season}-${episode}-${dialect}-${title}`;
    
    // Check cache first
    if (subtitleCache.has(cacheKey)) {
      const cachedContent = subtitleCache.get(cacheKey);
      
      const response = new NextResponse(cachedContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/vtt; charset=utf-8',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}_${dialect}.vtt"`,
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
      
      return response;
    }
    
    // Generate subtitles
    let subtitles = getSampleSubtitles(title, dialect);
    
    if (!subtitles) {
      // Generate fallback content
      subtitles = generateFallbackSubtitles(title, dialect);
    }
    
    // Convert to VTT format
    const vttContent = generateVTTContent(subtitles, dialect);
    
    // Cache the generated content
    subtitleCache.set(cacheKey, vttContent);
    
    // Clean cache if it gets too large (keep only last 100 items)
    if (subtitleCache.size > 100) {
      const firstKey = subtitleCache.keys().next().value;
      subtitleCache.delete(firstKey);
    }
    
    // Return VTT file
    const response = new NextResponse(vttContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}_${dialect}.vtt"`,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
    return response;
    
  } catch (error) {
    console.error('Subtitle generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate subtitles',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}