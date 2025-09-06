"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Types
export type LanguageCode = 
  | "en"           // English
  | "ku-tr"        // Kurmanji (Turkey)
  | "ku-iq"        // Sorani (Iraq)
  | "ku-ir"        // Sorani (Iran)
  | "ku-sy";       // Kurmanji (Syria)

export type ScriptType = "latin" | "arabic";
export type TextDirection = "ltr" | "rtl";

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  script: ScriptType;
  direction: TextDirection;
  fontFamily: string;
  region: string;
  fallback?: LanguageCode;
}

export interface Translations {
  // Navigation
  nav: {
    home: string;
    search: string;
    watchlist: string;
    profile: string;
    settings: string;
    language: string;
    install: string;
  };
  
  // Movie & Content Terms
  movie: {
    title: string;
    movies: string;
    genre: string;
    genres: string;
    year: string;
    duration: string;
    rating: string;
    cast: string;
    director: string;
    plot: string;
    trailer: string;
    similar: string;
    recommended: string;
    trending: string;
    popular: string;
    topRated: string;
    upcoming: string;
    nowPlaying: string;
    addedToWatchlist: string;
    removedFromWatchlist: string;
  };
  
  // Genres
  genres: {
    action: string;
    adventure: string;
    animation: string;
    comedy: string;
    crime: string;
    documentary: string;
    drama: string;
    family: string;
    fantasy: string;
    history: string;
    horror: string;
    music: string;
    mystery: string;
    romance: string;
    scienceFiction: string;
    tvMovie: string;
    thriller: string;
    war: string;
    western: string;
  };
  
  // Streaming & Actions
  streaming: {
    watchNow: string;
    addToWatchlist: string;
    removeFromWatchlist: string;
    share: string;
    download: string;
    favorite: string;
    unfavorite: string;
    watchTrailer: string;
    moreInfo: string;
    playMovie: string;
    resume: string;
    startOver: string;
  };

  // Video Player
  video: {
    noStreamingSources: string;
    failedToLoadStreaming: string;
    failedToLoadVideo: string;
    loading: string;
    loadingStreamingSources: string;
    watchOn: string;
    linkCopied: string;
    retry: string;
    sources: string;
    quality: string;
    language: string;
    subtitles: string;
    selectSource: string;
    sourceNotAvailable: string;
    watchNow: string;
    embed: string;
  };
  
  // UI Actions
  ui: {
    search: string;
    filter: string;
    sort: string;
    clear: string;
    apply: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    loading: string;
    noResults: string;
    tryAgain: string;
    refresh: string;
    retry: string;
  };
  
  // Search & Discovery
  search: {
    placeholder: string;
    results: string;
    noResults: string;
    searchFor: string;
    recentSearches: string;
    suggestions: string;
    filters: string;
    sortBy: string;
    filterBy: string;
  };
  
  // Errors & Messages
  errors: {
    networkError: string;
    loadingError: string;
    notFound: string;
    serverError: string;
    tryAgain: string;
    offline: string;
    unavailable: string;
    failedToLoadTrending: string;
    failedToLoadDiscover: string;
    searchFailed: string;
  };
  
  // Content Warnings & Ratings
  content: {
    rated: string;
    contentWarning: string;
    adultContent: string;
    language: string;
    violence: string;
    suggestiveContent: string;
    ageRestriction: string;
  };
  
  // Time & Dates
  time: {
    minute: string;
    minutes: string;
    hour: string;
    hours: string;
    day: string;
    days: string;
    week: string;
    weeks: string;
    month: string;
    months: string;
    year: string;
    years: string;
    ago: string;
    justNow: string;
    today: string;
    yesterday: string;
    tomorrow: string;
  };
  
  // Sections & Categories
  sections: {
    discover: string;
    trending: string;
    newReleases: string;
    topPicks: string;
    categories: string;
    myWatchlist: string;
    favorites: string;
    recentlyWatched: string;
    continueWatching: string;
    recommended: string;
  };
  
  // Profile & Settings
  profile: {
    myProfile: string;
    settings: string;
    preferences: string;
    notifications: string;
    privacy: string;
    account: string;
    signOut: string;
    darkMode: string;
    lightMode: string;
    autoPlay: string;
    subtitles: string;
    audioLanguage: string;
  };
}

// Language configurations
export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  "en": {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    script: "latin",
    direction: "ltr",
    fontFamily: "Inter, system-ui, sans-serif",
    region: "Global"
  },
  "ku-tr": {
    code: "ku-tr",
    name: "Kurdish (Kurmanji - Turkey)",
    nativeName: "Kurdî (Kurmancî - Tirkiye)",
    flag: "🇹🇷",
    script: "latin",
    direction: "ltr",
    fontFamily: "Inter, 'Noto Sans Armenian', system-ui, sans-serif",
    region: "Turkey",
    fallback: "en"
  },
  "ku-iq": {
    code: "ku-iq",
    name: "Kurdish (Sorani - Iraq)",
    nativeName: "کوردی (سۆرانی - عێراق)",
    flag: "🇮🇶",
    script: "arabic",
    direction: "rtl",
    fontFamily: "'Noto Sans Arabic', 'Geeza Pro', system-ui, sans-serif",
    region: "Iraq",
    fallback: "en"
  },
  "ku-ir": {
    code: "ku-ir",
    name: "Kurdish (Sorani - Iran)",
    nativeName: "کوردی (سۆرانی - ئێران)",
    flag: "🇮🇷",
    script: "arabic",
    direction: "rtl",
    fontFamily: "'Noto Sans Arabic', 'Iranian Sans', system-ui, sans-serif",
    region: "Iran",
    fallback: "en"
  },
  "ku-sy": {
    code: "ku-sy",
    name: "Kurdish (Kurmanji - Syria)",
    nativeName: "Kurdî (Kurmancî - Sûriye)",
    flag: "🇸🇾",
    script: "latin",
    direction: "ltr",
    fontFamily: "Inter, 'Noto Sans Armenian', system-ui, sans-serif",
    region: "Syria",
    fallback: "en"
  }
};

// Translation objects
const translations: Record<LanguageCode, Translations> = {
  "en": {
    nav: {
      home: "Home",
      search: "Search",
      watchlist: "Watchlist",
      profile: "Profile",
      settings: "Settings",
      language: "Language",
      install: "Install App"
    },
    movie: {
      title: "Title",
      movies: "Movies",
      genre: "Genre",
      genres: "Genres",
      year: "Year",
      duration: "Duration",
      rating: "Rating",
      cast: "Cast",
      director: "Director",
      plot: "Plot",
      trailer: "Trailer",
      similar: "Similar",
      recommended: "Recommended",
      trending: "Trending",
      popular: "Popular",
      topRated: "Top Rated",
      upcoming: "Upcoming",
      nowPlaying: "Now Playing",
      addedToWatchlist: "Added to watchlist",
      removedFromWatchlist: "Removed from watchlist"
    },
    genres: {
      action: "Action",
      adventure: "Adventure",
      animation: "Animation",
      comedy: "Comedy",
      crime: "Crime",
      documentary: "Documentary",
      drama: "Drama",
      family: "Family",
      fantasy: "Fantasy",
      history: "History",
      horror: "Horror",
      music: "Music",
      mystery: "Mystery",
      romance: "Romance",
      scienceFiction: "Science Fiction",
      tvMovie: "TV Movie",
      thriller: "Thriller",
      war: "War",
      western: "Western"
    },
    streaming: {
      watchNow: "Watch Now",
      addToWatchlist: "Add to Watchlist",
      removeFromWatchlist: "Remove from Watchlist",
      share: "Share",
      download: "Download",
      favorite: "Favorite",
      unfavorite: "Unfavorite",
      watchTrailer: "Watch Trailer",
      moreInfo: "More Info",
      playMovie: "Play Movie",
      resume: "Resume",
      startOver: "Start Over"
    },
    video: {
      noStreamingSources: "No streaming sources available",
      failedToLoadStreaming: "Failed to load streaming sources",
      failedToLoadVideo: "Failed to load video",
      loading: "Loading...",
      loadingStreamingSources: "Loading streaming sources...",
      watchOn: "Watch on",
      linkCopied: "Link copied to clipboard",
      retry: "Retry",
      sources: "Sources",
      quality: "Quality",
      language: "Language",
      subtitles: "Subtitles",
      selectSource: "Select Source",
      sourceNotAvailable: "Source not available",
      watchNow: "Watch Now",
      embed: "Embed"
    },
    ui: {
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      clear: "Clear",
      apply: "Apply",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      back: "Back",
      next: "Next",
      previous: "Previous",
      loading: "Loading",
      noResults: "No Results",
      tryAgain: "Try Again",
      refresh: "Refresh",
      retry: "Retry"
    },
    search: {
      placeholder: "Search movies...",
      results: "Results",
      noResults: "No movies found",
      searchFor: "Search for",
      recentSearches: "Recent Searches",
      suggestions: "Suggestions",
      filters: "Filters",
      sortBy: "Sort By",
      filterBy: "Filter By"
    },
    errors: {
      networkError: "Network error occurred",
      loadingError: "Error loading content",
      notFound: "Content not found",
      serverError: "Server error",
      tryAgain: "Try again",
      offline: "You're offline",
      unavailable: "Content unavailable",
      failedToLoadTrending: "Failed to load trending movies",
      failedToLoadDiscover: "Failed to load discover movies",
      searchFailed: "Search failed"
    },
    content: {
      rated: "Rated",
      contentWarning: "Content Warning",
      adultContent: "Adult Content",
      language: "Language",
      violence: "Violence",
      suggestiveContent: "Suggestive Content",
      ageRestriction: "Age Restriction"
    },
    time: {
      minute: "minute",
      minutes: "minutes",
      hour: "hour",
      hours: "hours",
      day: "day",
      days: "days",
      week: "week",
      weeks: "weeks",
      month: "month",
      months: "months",
      year: "year",
      years: "years",
      ago: "ago",
      justNow: "just now",
      today: "today",
      yesterday: "yesterday",
      tomorrow: "tomorrow"
    },
    sections: {
      discover: "Discover",
      trending: "Trending",
      newReleases: "New Releases",
      topPicks: "Top Picks",
      categories: "Categories",
      myWatchlist: "My Watchlist",
      favorites: "Favorites",
      recentlyWatched: "Recently Watched",
      continueWatching: "Continue Watching",
      recommended: "Recommended for You"
    },
    profile: {
      myProfile: "My Profile",
      settings: "Settings",
      preferences: "Preferences",
      notifications: "Notifications",
      privacy: "Privacy",
      account: "Account",
      signOut: "Sign Out",
      darkMode: "Dark Mode",
      lightMode: "Light Mode",
      autoPlay: "Auto Play",
      subtitles: "Subtitles",
      audioLanguage: "Audio Language"
    }
  },
  "ku-tr": {
    nav: {
      home: "Mal",
      search: "Lêgerîn",
      watchlist: "Lîsteya Temaşekirinê",
      profile: "Profîl",
      settings: "Mîhengî",
      language: "Ziman",
      install: "Sepanê Saz Bike"
    },
    movie: {
      title: "Sernav",
      movies: "Fîlm",
      genre: "Cure",
      genres: "Cure",
      year: "Sal",
      duration: "Dem",
      rating: "Nirx",
      cast: "Aktoran",
      director: "Derhenar",
      plot: "Çîrok",
      trailer: "Fragman",
      similar: "Hevşêwe",
      recommended: "Pêşniyarkirin",
      trending: "Populer",
      popular: "Populer",
      topRated: "Herî Baş",
      upcoming: "Tên",
      nowPlaying: "Niha Lêdidin",
      addedToWatchlist: "Li lîsteyê zêde kir",
      removedFromWatchlist: "Ji lîsteyê rakir"
    },
    genres: {
      action: "Şer",
      adventure: "Macera",
      animation: "Anîmasyon",
      comedy: "Komedî",
      crime: "Sûc",
      documentary: "Belgefîlm",
      drama: "Drama",
      family: "Malbat",
      fantasy: "Fantazî",
      history: "Dîrok",
      horror: "Tirsnak",
      music: "Muzîk",
      mystery: "Mîstîk",
      romance: "Evîndarî",
      scienceFiction: "Zanist-Xeyalî",
      tvMovie: "Fîlma Televîzyonê",
      thriller: "Heyecanî",
      war: "Şer",
      western: "Rojava"
    },
    streaming: {
      watchNow: "Niha Temaşe Bike",
      addToWatchlist: "Li Lîsteyê Zêde Bike",
      removeFromWatchlist: "Ji Lîsteyê Rake",
      share: "Parve Bike",
      download: "Daxe",
      favorite: "Bijarte",
      unfavorite: "Bijarteyê Rake",
      watchTrailer: "Fragmanê Temaşe Bike",
      moreInfo: "Zêdetir Agahî",
      playMovie: "Fîlmê Lêde",
      resume: "Bidomîne",
      startOver: "Ji Nû ve Dest Pê Bike"
    },
    video: {
      noStreamingSources: "Çavkaniyên weşanê tune ne",
      failedToLoadStreaming: "Çavkaniyên weşanê neanîn",
      failedToLoadVideo: "Vîdyo neanî",
      loading: "Tê barkirin...",
      loadingStreamingSources: "Çavkaniyên weşanê tên barkirin...",
      watchOn: "Li ser temaşe bike",
      linkCopied: "Girêk li panoya kopîkirinê hate kopîkirin",
      retry: "Dîsa biceribîne",
      sources: "Çavkanî",
      quality: "Kalîte",
      language: "Ziman",
      subtitles: "Jêrnivîs",
      selectSource: "Çavkanî Hilbijêre",
      sourceNotAvailable: "Çavkanî tune ye",
      watchNow: "Niha Temaşe Bike",
      embed: "Tevlî bike"
    },
    ui: {
      search: "Lêgerîn",
      filter: "Parzûn",
      sort: "Rêz bike",
      clear: "Paqij bike",
      apply: "Bicîh bîne",
      cancel: "Betal bike",
      save: "Tomar bike",
      delete: "Jê bibe",
      edit: "Guhertin",
      close: "Bigire",
      back: "Vegere",
      next: "Pêşve",
      previous: "Paşve",
      loading: "Tê barkirin",
      noResults: "Encam tune",
      tryAgain: "Dîsa biceribîne",
      refresh: "Nû bike",
      retry: "Dîsa biceribîne"
    },
    search: {
      placeholder: "Li fîlman bigere...",
      results: "Encam",
      noResults: "Tu fîlm nehate dîtin",
      searchFor: "Bigere bo",
      recentSearches: "Lêgerînên Dawî",
      suggestions: "Pêşniyar",
      filters: "Parzûn",
      sortBy: "Rêz bike li gorî",
      filterBy: "Parzûn li gorî"
    },
    errors: {
      networkError: "Çewtiya torê çêbû",
      loadingError: "Di barkirina naverokê de çewti",
      notFound: "Naveroka nehate dîtin",
      serverError: "Çewtiya server",
      tryAgain: "Dîsa biceribîne",
      offline: "Tu derketî",
      unavailable: "Naveroka tune ye",
      failedToLoadTrending: "Fîlmên populer neanîn",
      failedToLoadDiscover: "Fîlmên keşfkirinê neanîn",
      searchFailed: "Lêgerîn têk çû"
    },
    content: {
      rated: "Nirxandin",
      contentWarning: "Hişyariya Naverokê",
      adultContent: "Naverokê Mezin",
      language: "Ziman",
      violence: "Tundî",
      suggestiveContent: "Naverokê Îşaretî",
      ageRestriction: "Sînorkirina Temenî"
    },
    time: {
      minute: "xulek",
      minutes: "xulek",
      hour: "seet",
      hours: "seet",
      day: "roj",
      days: "roj",
      week: "hefte",
      weeks: "hefte",
      month: "meh",
      months: "meh",
      year: "sal",
      years: "sal",
      ago: "berî",
      justNow: "niha",
      today: "îro",
      yesterday: "duh",
      tomorrow: "sibe"
    },
    sections: {
      discover: "Vedîtin",
      trending: "Populer",
      newReleases: "Nû Derketî",
      topPicks: "Herî Baş Bijartî",
      categories: "Beş",
      myWatchlist: "Lîsteya Min a Temaşekirinê",
      favorites: "Bijarte",
      recentlyWatched: "Nû Temaşekirin",
      continueWatching: "Bidomîne Temaşekirinê",
      recommended: "Bo Te Pêşniyarkirin"
    },
    profile: {
      myProfile: "Profîla Min",
      settings: "Mîhengî",
      preferences: "Tercîhî",
      notifications: "Agahdarkirin",
      privacy: "Veşartî",
      account: "Hesab",
      signOut: "Derkeve",
      darkMode: "Moda Tarî",
      lightMode: "Moda Ronî",
      autoPlay: "Lêdana Xweber",
      subtitles: "Jêrnivîs",
      audioLanguage: "Zimana Dengî"
    }
  },
  "ku-iq": {
    nav: {
      home: "ماڵ",
      search: "گەڕان",
      watchlist: "لیستی تەماشاکردن",
      profile: "پرۆفایل",
      settings: "ڕێکخستن",
      language: "زمان",
      install: "دامەزراندنی ئەپ"
    },
    movie: {
      title: "ناونیشان",
      movies: "فیلم",
      genre: "جۆر",
      genres: "جۆرەکان",
      year: "ساڵ",
      duration: "ماوە",
      rating: "هەڵسەنگاندن",
      cast: "ئەکتەران",
      director: "دەرهێنەر",
      plot: "چیرۆک",
      trailer: "تریلەر",
      similar: "هاوشێوە",
      recommended: "پێشنیارکراو",
      trending: "بەناوبانگ",
      popular: "بەناوبانگ",
      topRated: "باشترین",
      upcoming: "داهاتوو",
      nowPlaying: "ئێستا لێدان",
      addedToWatchlist: "زیادکرا بۆ لیست",
      removedFromWatchlist: "لابرا لە لیست"
    },
    genres: {
      action: "شەڕ",
      adventure: "سەرگەرمی",
      animation: "ئەنیمەیشن",
      comedy: "کۆمیدی",
      crime: "تاوان",
      documentary: "بەڵگەنامە",
      drama: "درامی",
      family: "خێزانی",
      fantasy: "خەیاڵی",
      history: "مێژوو",
      horror: "ترسناک",
      music: "مۆسیقا",
      mystery: "نهێنی",
      romance: "ڕۆمانسی",
      scienceFiction: "زانستی-خەیاڵی",
      tvMovie: "فیلمی تەلەڤیزیۆنی",
      thriller: "هەیجانی",
      war: "شەڕ",
      western: "ڕۆژئاوایی"
    },
    streaming: {
      watchNow: "ئێستا تەماشا بکە",
      addToWatchlist: "زیادکردن بۆ لیست",
      removeFromWatchlist: "لابردن لە لیست",
      share: "هاوبەشکردن",
      download: "داگرتن",
      favorite: "دڵخواز",
      unfavorite: "لابردنی دڵخوازی",
      watchTrailer: "تەماشای تریلەر",
      moreInfo: "زانیاری زیاتر",
      playMovie: "لێدانی فیلم",
      resume: "بەردەوامبوون",
      startOver: "دەستپێکردنەوە"
    },
    video: {
      noStreamingSources: "سەرچاوەی پەخشکردن بەردەست نییە",
      failedToLoadStreaming: "سەرچاوەی پەخشکردن بارنەبوو",
      failedToLoadVideo: "ڤیدیۆ بارنەبوو",
      loading: "بارکردن...",
      loadingStreamingSources: "سەرچاوەی پەخشکردن بارکردن...",
      watchOn: "تەماشا بکە لە",
      linkCopied: "بەستەر کۆپی کرا",
      retry: "دووبارە هەوڵ بدە",
      sources: "سەرچاوەکان",
      quality: "کوالیتی",
      language: "زمان",
      subtitles: "ژێرنووس",
      selectSource: "سەرچاوە هەڵبژێرە",
      sourceNotAvailable: "سەرچاوە نییە",
      watchNow: "ئێستا تەماشا بکە",
      embed: "نیشتەجێ کردن"
    },
    ui: {
      search: "گەڕان",
      filter: "پاڵاوتن",
      sort: "ڕیزکردن",
      clear: "پاکردنەوە",
      apply: "جێبەجێکردن",
      cancel: "هەڵوەشاندنەوە",
      save: "پاشەکەوتکردن",
      delete: "سڕینەوە",
      edit: "دەستکاریکردن",
      close: "داخستن",
      back: "گەڕانەوە",
      next: "داهاتوو",
      previous: "پێشوو",
      loading: "بارکردن",
      noResults: "هیچ ئەنجامێک نییە",
      tryAgain: "دووبارە هەوڵ بدە",
      refresh: "نوێکردنەوە",
      retry: "دووبارە هەوڵ بدە"
    },
    search: {
      placeholder: "گەڕان بەدوای فیلم...",
      results: "ئەنجام",
      noResults: "هیچ فیلمێک نەدۆزراوە",
      searchFor: "گەڕان بۆ",
      recentSearches: "گەڕانە تازەکان",
      suggestions: "پێشنیارەکان",
      filters: "پاڵاوتن",
      sortBy: "ڕیزکردن بەگوێرەی",
      filterBy: "پاڵاوتن بەگوێرەی"
    },
    errors: {
      networkError: "هەڵەی تۆڕ ڕوویدا",
      loadingError: "هەڵە لە بارکردن",
      notFound: "ناوەرۆک نەدۆزراوە",
      serverError: "هەڵەی سێرڤەر",
      tryAgain: "دووبارە هەوڵ بدە",
      offline: "ئۆفلاینیت",
      unavailable: "ناوەرۆک بەردەست نییە",
      failedToLoadTrending: "فیلمە بەناوبانگەکان بارنەبوون",
      failedToLoadDiscover: "فیلمە دۆزینەوەکان بارنەبوون",
      searchFailed: "گەڕان سەرکەوتوو نەبوو"
    },
    content: {
      rated: "هەڵسەنگێندراو",
      contentWarning: "ئاگاداری ناوەرۆک",
      adultContent: "ناوەرۆکی گەورەسال",
      language: "زمان",
      violence: "توندوتیژی",
      suggestiveContent: "ناوەرۆکی ئاماژەیی",
      ageRestriction: "سنووردارکردنی تەمەن"
    },
    time: {
      minute: "خولەک",
      minutes: "خولەک",
      hour: "کاتژمێر",
      hours: "کاتژمێر",
      day: "ڕۆژ",
      days: "ڕۆژ",
      week: "هەفتە",
      weeks: "هەفتە",
      month: "مانگ",
      months: "مانگ",
      year: "ساڵ",
      years: "ساڵ",
      ago: "لەمەوپێش",
      justNow: "ئێستا",
      today: "ئەمڕۆ",
      yesterday: "دوێنێ",
      tomorrow: "سبەینێ"
    },
    sections: {
      discover: "دۆزینەوە",
      trending: "بەناوبانگ",
      newReleases: "بڵاوکراوەی نوێ",
      topPicks: "هەڵبژاردەکان",
      categories: "بەش",
      myWatchlist: "لیستەکەم",
      favorites: "دڵخوازەکان",
      recentlyWatched: "تازەگی تەماشاکراو",
      continueWatching: "بەردەوامبوون لە تەماشاکردن",
      recommended: "پێشنیارکراو بۆت"
    },
    profile: {
      myProfile: "پرۆفایلەکەم",
      settings: "ڕێکخستن",
      preferences: "ئارەزووەکان",
      notifications: "ئاگادارکردنەوەکان",
      privacy: "تایبەتی",
      account: "هەژمار",
      signOut: "دەرچوون",
      darkMode: "شێوازی تاریک",
      lightMode: "شێوازی ڕووناک",
      autoPlay: "لێدانی خودکار",
      subtitles: "ژێرنووس",
      audioLanguage: "زمانی دەنگ"
    }
  },
  "ku-ir": {
    nav: {
      home: "ماڵ",
      search: "گەڕان",
      watchlist: "لیستی تەماشا",
      profile: "پرۆفایل", 
      settings: "ڕێکخستن",
      language: "زمان",
      install: "دامەزراندن"
    },
    movie: {
      title: "سەرناو",
      movies: "فیلم",
      genre: "جۆر",
      genres: "جۆرەکان",
      year: "ساڵ",
      duration: "ماوە",
      rating: "نرخاندن",
      cast: "ئەکتەران",
      director: "دەرهێنەر",
      plot: "چیرۆک",
      trailer: "نمایش",
      similar: "هاوشێوە",
      recommended: "پێشنیارکراو",
      trending: "گەرم",
      popular: "بەناوبانگ",
      topRated: "باشترین",
      upcoming: "داهاتوو",
      nowPlaying: "ئێستا",
      addedToWatchlist: "زیادکرا بۆ لیست",
      removedFromWatchlist: "لابرا لە لیست"
    },
    genres: {
      action: "شەڕ",
      adventure: "سەرگەرمی",
      animation: "ئەنیمەیشن",
      comedy: "پێکەنین",
      crime: "تاوان",
      documentary: "بەڵگەنامە",
      drama: "درامی",
      family: "خێزانی",
      fantasy: "خەیاڵی",
      history: "مێژوو",
      horror: "ترسناک",
      music: "مۆسیقا",
      mystery: "نهێنی",
      romance: "ڕۆمانسی",
      scienceFiction: "زانستی خەیاڵی",
      tvMovie: "فیلمی تەلەڤیزیۆنی",
      thriller: "هەیجانی",
      war: "شەڕ",
      western: "ڕۆژئاوایی"
    },
    streaming: {
      watchNow: "ئێستا بینین",
      addToWatchlist: "زیادکردن",
      removeFromWatchlist: "لابردن",
      share: "هاوبەش",
      download: "داگرتن",
      favorite: "دڵخواز",
      unfavorite: "نادڵخواز",
      watchTrailer: "نمایش",
      moreInfo: "زیاتر",
      playMovie: "لێدان",
      resume: "بەردەوام",
      startOver: "نوێ"
    },
    video: {
      noStreamingSources: "سەرچاوەی پەخش نییە",
      failedToLoadStreaming: "سەرچاوەی پەخش نەهات",
      failedToLoadVideo: "ڤیدیۆ نەهات",
      loading: "بارکردن...",
      loadingStreamingSources: "سەرچاوەی پەخش...",
      watchOn: "بینین لە",
      linkCopied: "بەستەر کۆپی",
      retry: "دیسان",
      sources: "سەرچاوە",
      quality: "کوالیتی",
      language: "زمان",
      subtitles: "ژێرنووس",
      selectSource: "سەرچاوە هەڵبژێرە",
      sourceNotAvailable: "سەرچاوە نییە",
      watchNow: "ئێستا بینین",
      embed: "تێکردن"
    },
    ui: {
      search: "گەڕان",
      filter: "پاڵاوتن", 
      sort: "ڕیز",
      clear: "پاک",
      apply: "جێبەجێ",
      cancel: "هەڵوەشاندن",
      save: "پاشەکەوت",
      delete: "سڕین",
      edit: "گۆڕین",
      close: "داخستن",
      back: "گەڕان",
      next: "پاش",
      previous: "پێش",
      loading: "بارکردن",
      noResults: "هیچ",
      tryAgain: "دیسان",
      refresh: "نوێ",
      retry: "دیسان"
    },
    search: {
      placeholder: "گەڕان...",
      results: "ئەنجام",
      noResults: "نەدۆزرا",
      searchFor: "گەڕان بۆ",
      recentSearches: "تازە",
      suggestions: "پێشنیار",
      filters: "پاڵاوتن",
      sortBy: "ڕیز بە",
      filterBy: "پاڵاوتن بە"
    },
    errors: {
      networkError: "هەڵەی تۆڕ",
      loadingError: "هەڵەی بار",
      notFound: "نەدۆزرا",
      serverError: "هەڵەی سێرڤەر",
      tryAgain: "دووبارە",
      offline: "ئۆفلاین",
      unavailable: "نییە",
      failedToLoadTrending: "گەرمەکان نەهاتن",
      failedToLoadDiscover: "دۆزینەوەکان نەهاتن",
      searchFailed: "گەڕان تێنەکەوت"
    },
    content: {
      rated: "نرخاو",
      contentWarning: "ئاگاداری",
      adultContent: "گەورەسال",
      language: "زمان",
      violence: "توندی",
      suggestiveContent: "ئاماژە",
      ageRestriction: "تەمەن"
    },
    time: {
      minute: "خولەک",
      minutes: "خولەک",
      hour: "کاتژمێر",
      hours: "کاتژمێر",
      day: "ڕۆژ",
      days: "ڕۆژ",
      week: "هەفتە",
      weeks: "هەفتە",
      month: "مانگ",
      months: "مانگ",
      year: "ساڵ",
      years: "ساڵ",
      ago: "پێش",
      justNow: "ئێستا",
      today: "ئەمڕۆ",
      yesterday: "دوێنێ",
      tomorrow: "سبە"
    },
    sections: {
      discover: "دۆزین",
      trending: "گەرم",
      newReleases: "نوێ",
      topPicks: "هەڵبژێردراو",
      categories: "بەش",
      myWatchlist: "لیستم",
      favorites: "دڵخواز",
      recentlyWatched: "تازە",
      continueWatching: "بەردەوام",
      recommended: "پێشنیار"
    },
    profile: {
      myProfile: "پرۆفایلم",
      settings: "ڕێکخستن",
      preferences: "ئارەزوو",
      notifications: "ئاگاداری",
      privacy: "تایبەتی",
      account: "هەژمار",
      signOut: "دەرچوون",
      darkMode: "تاریک",
      lightMode: "ڕووناک",
      autoPlay: "خودکار",
      subtitles: "ژێرنووس",
      audioLanguage: "دەنگ"
    }
  },
  "ku-sy": {
    nav: {
      home: "Mal",
      search: "Lêgerîn",
      watchlist: "Lîsteya Temaşekirinê", 
      profile: "Profîl",
      settings: "Sazkarî",
      language: "Ziman",
      install: "Sepanê Saz Bike"
    },
    movie: {
      title: "Nav",
      movies: "Fîlm",
      genre: "Cure",
      genres: "Cure",
      year: "Sal",
      duration: "Dem",
      rating: "Nirx",
      cast: "Lîstikvan",
      director: "Derhêner",
      plot: "Çîrok",
      trailer: "Pêşdîtin",
      similar: "Hevşêwe",
      recommended: "Pêşniyar",
      trending: "Populer",
      popular: "Populer",
      topRated: "Herî Baş",
      upcoming: "Tên",
      nowPlaying: "Niha",
      addedToWatchlist: "Li lîsteyê zêde kir",
      removedFromWatchlist: "Ji lîsteyê rakir"
    },
    genres: {
      action: "Şer",
      adventure: "Macera",
      animation: "Anîmasyon",
      comedy: "Komedî",
      crime: "Sûc",
      documentary: "Belgefîlm",
      drama: "Drama",
      family: "Malbat",
      fantasy: "Xeyalî",
      history: "Dîrok",
      horror: "Tirsnak",
      music: "Muzîk",
      mystery: "Veşartî",
      romance: "Evîndarî",
      scienceFiction: "Zanist-Xeyalî",
      tvMovie: "Fîlma TV",
      thriller: "Heyecanî",
      war: "Şer",
      western: "Rojava"
    },
    streaming: {
      watchNow: "Niha Temaşe Bike",
      addToWatchlist: "Zêde Bike",
      removeFromWatchlist: "Rake",
      share: "Parve Bike",
      download: "Daxe",
      favorite: "Bijarte",
      unfavorite: "Ne Bijarte",
      watchTrailer: "Pêşdîtin",
      moreInfo: "Zêdetir",
      playMovie: "Lêde",
      resume: "Bidomîne",
      startOver: "Ji Nû ve"
    },
    video: {
      noStreamingSources: "Çavkaniyên weşanê tune ne",
      failedToLoadStreaming: "Çavkaniyên weşanê neanîn",
      failedToLoadVideo: "Vîdyo neanî",
      loading: "Tê barkirin...",
      loadingStreamingSources: "Çavkaniyên weşanê tên barkirin...",
      watchOn: "Li ser temaşe bike",
      linkCopied: "Girêk hat kopîkirin",
      retry: "Dîsa biceribîne",
      sources: "Çavkanî",
      quality: "Kalîte",
      language: "Ziman",
      subtitles: "Jêrnivîs",
      selectSource: "Çavkanî Hilbijêre",
      sourceNotAvailable: "Çavkanî tune ye",
      watchNow: "Niha Temaşe Bike",
      embed: "Tevlî bike"
    },
    ui: {
      search: "Lêgerîn",
      filter: "Parzûn",
      sort: "Rêz",
      clear: "Paqij",
      apply: "Bicîh Bîne",
      cancel: "Betal",
      save: "Tomar",
      delete: "Jê Bibe",
      edit: "Guhertin",
      close: "Bigire",
      back: "Vegere",
      next: "Pêş",
      previous: "Paş",
      loading: "Tê Barkirin",
      noResults: "Encam Tune",
      tryAgain: "Dîsa",
      refresh: "Nû Bike",
      retry: "Dîsa Biceribîne"
    },
    search: {
      placeholder: "Li fîlman bigere...",
      results: "Encam",
      noResults: "Tu fîlm nehate dîtin",
      searchFor: "Bigere bo",
      recentSearches: "Lêgerînên Dawî",
      suggestions: "Pêşniyar",
      filters: "Parzûn",
      sortBy: "Rêz bike li gorî",
      filterBy: "Parzûn li gorî"
    },
    errors: {
      networkError: "Çewtiya torê",
      loadingError: "Çewtiya barkirinê",
      notFound: "Nehate dîtin",
      serverError: "Çewtiya server",
      tryAgain: "Dîsa",
      offline: "Derketî",
      unavailable: "Tune",
      failedToLoadTrending: "Fîlmên populer neanîn",
      failedToLoadDiscover: "Fîlmên veditî neanîn",
      searchFailed: "Lêgerîn têk çû"
    },
    content: {
      rated: "Nirxandin",
      contentWarning: "Hişyarî",
      adultContent: "Mezin",
      language: "Ziman",
      violence: "Tundî",
      suggestiveContent: "Îşaret",
      ageRestriction: "Temen"
    },
    time: {
      minute: "xulek",
      minutes: "xulek",
      hour: "seet",
      hours: "seet",
      day: "roj",
      days: "roj",
      week: "hefte",
      weeks: "hefte",
      month: "meh",
      months: "meh",
      year: "sal",
      years: "sal",
      ago: "berî",
      justNow: "niha",
      today: "îro",
      yesterday: "duh",
      tomorrow: "sibe"
    },
    sections: {
      discover: "Vedit",
      trending: "Populer",
      newReleases: "Nû",
      topPicks: "Bijarte",
      categories: "Beş",
      myWatchlist: "Lîsteya Min",
      favorites: "Bijarte",
      recentlyWatched: "Dawî",
      continueWatching: "Bidomîne",
      recommended: "Pêşniyar"
    },
    profile: {
      myProfile: "Profîla Min",
      settings: "Sazkarî",
      preferences: "Tercîh",
      notifications: "Agahdarî",
      privacy: "Veşartî",
      account: "Hesab",
      signOut: "Derkeve",
      darkMode: "Tarî",
      lightMode: "Ronî",
      autoPlay: "Xweber",
      subtitles: "Jêrnivîs",
      audioLanguage: "Deng"
    }
  }
};

// Language context
interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string) => string;
  config: LanguageConfig;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Utility functions
export const detectBrowserLanguage = (): LanguageCode => {
  if (typeof window === "undefined") return "en";
  
  const browserLang = navigator.language.toLowerCase();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Kurdish region detection based on timezone and browser language
  if (browserLang.includes("ku") || browserLang.includes("kur")) {
    // Detect region by timezone
    if (timeZone.includes("Baghdad") || timeZone.includes("Erbil")) {
      return "ku-iq"; // Iraq
    }
    if (timeZone.includes("Tehran") || timeZone.includes("Iran")) {
      return "ku-ir"; // Iran  
    }
    if (timeZone.includes("Damascus") || timeZone.includes("Syria")) {
      return "ku-sy"; // Syria
    }
    if (timeZone.includes("Istanbul") || timeZone.includes("Turkey")) {
      return "ku-tr"; // Turkey
    }
    
    // Default to Iraq Sorani if Kurdish but region unclear
    return "ku-iq";
  }
  
  // Check for supported languages
  for (const [code, config] of Object.entries(SUPPORTED_LANGUAGES)) {
    if (browserLang.startsWith(config.code) || browserLang.includes(config.code)) {
      return code as LanguageCode;
    }
  }
  
  return "en";
};

export const getTextDirection = (language: LanguageCode): TextDirection => {
  return SUPPORTED_LANGUAGES[language].direction;
};

export const getFontFamily = (language: LanguageCode): string => {
  return SUPPORTED_LANGUAGES[language].fontFamily;
};

// Translation function with dot notation support
const createTranslationFunction = (translations: Translations, fallback: Translations) => {
  return (key: string): string => {
    const keys = key.split('.');
    let value: any = translations;
    let fallbackValue: any = fallback;
    
    for (const k of keys) {
      value = value?.[k];
      fallbackValue = fallbackValue?.[k];
    }
    
    // FIXED: Ensure only strings are returned, never objects
    if (typeof value === 'string') {
      return value;
    }
    if (typeof fallbackValue === 'string') {
      return fallbackValue;
    }
    
    // Return the key as fallback if no string translation found
    return key;
  };
};

// Language Provider Component
interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: LanguageCode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flkrd-language") as LanguageCode;
      if (saved && SUPPORTED_LANGUAGES[saved]) {
        return saved;
      }
    }
    return defaultLanguage || detectBrowserLanguage();
  });

  const config = SUPPORTED_LANGUAGES[currentLanguage];
  const isRTL = config.direction === "rtl";
  
  const t = createTranslationFunction(
    translations[currentLanguage],
    translations["en"]
  );

  const setLanguage = (language: LanguageCode) => {
    setCurrentLanguage(language);
    if (typeof window !== "undefined") {
      localStorage.setItem("flkrd-language", language);
    }
  };

  // Update document properties when language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = config.direction;
      document.documentElement.lang = config.code;
      document.documentElement.style.fontFamily = config.fontFamily;
    }
  }, [config]);

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    config,
    isRTL
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hooks
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const useTranslations = () => {
  const { t } = useLanguage();
  return t;
};

// Utility exports
export const formatDate = (date: Date, language: LanguageCode): string => {
  const config = SUPPORTED_LANGUAGES[language];
  
  try {
    return new Intl.DateTimeFormat(config.code, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }).format(date);
  }
};

export const formatTime = (date: Date, language: LanguageCode): string => {
  const config = SUPPORTED_LANGUAGES[language];
  
  try {
    return new Intl.DateTimeFormat(config.code, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
};