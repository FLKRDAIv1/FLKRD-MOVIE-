"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, Globe, Heart, HeartOff, Loader2, Star, Play, Info, TrendingUp, Calendar, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useLanguage } from '@/lib/language';
import { useFavorites } from '@/hooks/useFavorites';
import { useSession } from '@/lib/auth-client';
import { MovieCardSkeleton, TrendingCarouselSkeleton, SearchBarSkeleton } from './LoadingComponents';
import { ContinueWatching } from '@/components/ContinueWatching';

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
}

interface TrendingResponse {
  results: Movie[];
  total_pages: number;
  total_results: number;
  page: number;
}

interface SearchResponse {
  results: Movie[];
  page: number;
  total_pages: number;
  total_results: number;
}

interface Genre {
  id: number;
  name: string;
}

interface HomeSectionProps {
  onMovieSelect?: (movieId: number) => void;
  className?: string;
  showSearchBox?: boolean;
}

const GENRES_MAP: { [key: number]: string } = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 18: 'Drama', 27: 'Horror',
  35: 'Comedy', 80: 'Crime', 99: 'Documentary', 10751: 'Family', 10749: 'Romance',
  14: 'Fantasy', 36: 'History', 10402: 'Music', 9648: 'Mystery', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', value: '' },
  { id: 'movie', label: 'Movies', value: 'movie' },
  { id: 'popular', label: 'Popular', value: 'popular' },
  { id: 'latest', label: 'Latest', value: 'latest' },
  { id: 'top_rated', label: 'Top Rated', value: 'top_rated' }
];

export default function HomeSection({ onMovieSelect, className = '', showSearchBox = false }: HomeSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [discoverMovies, setDiscoverMovies] = useState<Movie[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  
  // Enhanced hero carousel state
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [isCarouselTransitioning, setIsCarouselTransitioning] = useState(false);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredMovie, setHoveredMovie] = useState<number | null>(null);
  
  // Infinite scroll state
  const [hasMoreMovies, setHasMoreMovies] = useState(true);
  const [isInfiniteScrollEnabled, setIsInfiniteScrollEnabled] = useState(true);
  
  const { t } = useLanguage();

  // Use the new favorites hook instead of localStorage watchlist
  const {
    favorites,
    favoriteMovieIds,
    isLoading: favoritesLoading,
    loadingStates: favoriteLoadingStates,
    error: favoritesError,
    addToFavorites,
    removeFromFavorites,
    isMovieFavorited,
    isLoadingMovie: isFavoriteLoading,
    refreshFavorites,
  } = useFavorites();

  // Refs for cleanup and infinite scroll
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const movieSelectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadMoreObserverRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Get session data properly
  const { data: session, isPending: sessionPending } = useSession();

  // Enhanced cleanup with carousel interval
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (movieSelectionTimeoutRef.current) {
        clearTimeout(movieSelectionTimeoutRef.current);
      }
      if (loadMoreObserverRef.current) {
        loadMoreObserverRef.current.disconnect();
      }
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, []);

  // Fetch newest movies for hero carousel
  const fetchNewestMovies = async () => {
    try {
      // Fetch multiple pages of trending and latest movies
      const [trendingResponse, discoverResponse] = await Promise.all([
        fetch('/api/trending?page=1'),
        fetch('/api/discover?page=1&sort_by=release_date.desc')
      ]);

      const trendingData = await trendingResponse.json();
      const discoverData = await discoverResponse.json();

      // Combine and sort by release date (newest first)
      const allMovies = [
        ...(trendingData.results || []),
        ...(discoverData.results || [])
      ];

      // Remove duplicates and filter movies
      const uniqueMovies = allMovies
        .filter((movie, index, self) => 
          index === self.findIndex(m => m.id === movie.id)
        )
        .filter(movie => movie.backdrop_path) // Only movies with backdrop images
        .filter(movie => {
          // Allow movies up to 2025, but not higher (not 2026+)
          const releaseYear = new Date(movie.release_date).getFullYear();
          return releaseYear <= 2025; // Show movies up to 2025, not higher
        })
        .sort((a, b) => {
          // Sort by release date (newest first)
          return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        })
        .slice(0, 8); // Take top 8 movies

      setHeroMovies(uniqueMovies);
      if (uniqueMovies.length > 0) {
        setFeaturedMovie(uniqueMovies[0]);
      }
    } catch (error) {
      console.error('Error fetching newest movies:', error);
    }
  };

  // Auto-carousel functionality
  const startCarousel = useCallback(() => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
    }

    carouselIntervalRef.current = setInterval(() => {
      if (!isCarouselPaused && heroMovies.length > 1) {
        setIsCarouselTransitioning(true);
        setCurrentHeroIndex(prev => {
          const nextIndex = (prev + 1) % heroMovies.length;
          setFeaturedMovie(heroMovies[nextIndex]);
          return nextIndex;
        });
        
        // Reset transition state after animation
        setTimeout(() => setIsCarouselTransitioning(false), 800);
      }
    }, 5000); // Change every 5 seconds
  }, [isCarouselPaused, heroMovies.length]);

  // Start carousel when hero movies are loaded
  useEffect(() => {
    if (heroMovies.length > 1) {
      startCarousel();
    }
    
    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [heroMovies.length, startCarousel]);

  // Manual carousel navigation
  const goToSlide = (index: number) => {
    if (index !== currentHeroIndex && !isCarouselTransitioning) {
      setIsCarouselTransitioning(true);
      setCurrentHeroIndex(index);
      setFeaturedMovie(heroMovies[index]);
      setTimeout(() => setIsCarouselTransitioning(false), 800);
    }
  };

  const nextSlide = () => {
    const nextIndex = (currentHeroIndex + 1) % heroMovies.length;
    goToSlide(nextIndex);
  };

  const prevSlide = () => {
    const prevIndex = currentHeroIndex === 0 ? heroMovies.length - 1 : currentHeroIndex - 1;
    goToSlide(prevIndex);
  };

  // Infinite scroll setup
  useEffect(() => {
    if (!isInfiniteScrollEnabled || !loadMoreTriggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMoreMovies && !loadingMore && !loading) {
          if (searchQuery) {
            loadMoreSearchResults();
          } else {
            loadMoreDiscoverMovies();
          }
        }
      },
      {
        rootMargin: '100px', // Trigger 100px before the element comes into view
        threshold: 0.1
      }
    );

    observer.observe(loadMoreTriggerRef.current);
    loadMoreObserverRef.current = observer;

    return () => {
      if (loadMoreObserverRef.current) {
        loadMoreObserverRef.current.disconnect();
      }
    };
  }, [isInfiniteScrollEnabled, hasMoreMovies, loadingMore, loading, searchQuery]);

  // Debounced search function with proper cleanup
  const debouncedSearch = useCallback((query: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        searchMovies(query, 1); // Reset to page 1 for new search
      } else {
        setSearchResults([]);
        setSearchLoading(false);
        setSearchPage(1);
        setSearchTotalPages(1);
      }
    }, 300);
  }, []);

  // Enhanced movie selection with instant feedback
  const handleMovieSelection = useCallback((movieId: number) => {
    // Prevent rapid clicking on the same movie
    if (selectedMovieId === movieId) {
      return;
    }
    
    // Clear any existing timeout
    if (movieSelectionTimeoutRef.current) {
      clearTimeout(movieSelectionTimeoutRef.current);
    }
    
    // Set the selected movie immediately with visual feedback
    setSelectedMovieId(movieId);
    
    // Show instant loading feedback
    toast.loading("🎬 Loading player...", {
      description: "Preparing streaming sources",
      id: `movie-${movieId}` // Unique ID to prevent duplicates
    });
    
    // Call the parent handler
    onMovieSelect?.(movieId);
    
    // Reset after a short delay to allow for new selections
    movieSelectionTimeoutRef.current = setTimeout(() => {
      setSelectedMovieId(null);
      toast.dismiss(`movie-${movieId}`);
    }, 3000); // Increased timeout for better UX
  }, [onMovieSelect, selectedMovieId]);

  // Fetch trending movies (extended to get more movies)
  const fetchTrendingMovies = async () => {
    try {
      setTrendingLoading(true);
      setError(null);
      
      // Fetch multiple pages of trending movies
      const pages = [1, 2, 3]; // Get first 3 pages for more variety
      const allMovies: Movie[] = [];
      
      for (const page of pages) {
        const response = await fetch(`/api/trending?page=${page}`, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: TrendingResponse = await response.json();
        
        if (data && Array.isArray(data.results)) {
          allMovies.push(...data.results);
        }
      }
      
      setTrendingMovies(allMovies);
      
      // Set featured movie as the first trending movie
      if (allMovies.length > 0 && !featuredMovie) {
        setFeaturedMovie(allMovies[0]);
      }
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      setError('Failed to load trending movies');
      toast.error(t('errors.failedToLoadTrending'));
    } finally {
      setTrendingLoading(false);
    }
  };

  // Fetch discover movies with pagination
  const fetchDiscoverMovies = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setDiscoverLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const response = await fetch(`/api/discover?page=${page}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TrendingResponse = await response.json();
      
      if (data && Array.isArray(data.results)) {
        if (append) {
          setDiscoverMovies(prev => [...prev, ...data.results]);
        } else {
          setDiscoverMovies(data.results);
        }
        
        setCurrentPage(data.page || page);
        setTotalPages(data.total_pages || 1);
        setTotalResults(data.total_results || 0);
        setHasMoreMovies(page < (data.total_pages || 1));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching discover movies:', error);
      setError('Failed to load discover movies');
      toast.error(t('errors.failedToLoadDiscover'));
    } finally {
      setDiscoverLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more discover movies
  const loadMoreDiscoverMovies = useCallback(async () => {
    if (loadingMore || !hasMoreMovies || currentPage >= totalPages) return;
    
    const nextPage = currentPage + 1;
    await fetchDiscoverMovies(nextPage, true);
  }, [loadingMore, hasMoreMovies, currentPage, totalPages]);

  // Search movies with pagination
  const searchMovies = async (query: string, page: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    try {
      if (!append) {
        setSearchLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      
      if (data && Array.isArray(data.results)) {
        if (append) {
          setSearchResults(prev => [...prev, ...data.results]);
        } else {
          setSearchResults(data.results);
        }
        
        setSearchPage(data.page || page);
        setSearchTotalPages(data.total_pages || 1);
        setHasMoreMovies(page < (data.total_pages || 1));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      setError('Search failed');
      toast.error(t('errors.searchFailed'));
      if (!append) {
        setSearchResults([]);
      }
    } finally {
      setSearchLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more search results
  const loadMoreSearchResults = useCallback(async () => {
    if (loadingMore || !hasMoreMovies || !searchQuery || searchPage >= searchTotalPages) return;
    
    const nextPage = searchPage + 1;
    await searchMovies(searchQuery, nextPage, true);
  }, [loadingMore, hasMoreMovies, searchQuery, searchPage, searchTotalPages]);

  // Manual load more function for button
  const handleLoadMore = () => {
    if (searchQuery) {
      loadMoreSearchResults();
    } else {
      loadMoreDiscoverMovies();
    }
  };

  // Initial data fetch with newest movies
  useEffect(() => {
    fetchNewestMovies();
    fetchTrendingMovies();
    fetchDiscoverMovies(1, false);
  }, []);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      setSearchLoading(true);
    } else {
      // Reset to discover movies when search is cleared
      setHasMoreMovies(currentPage < totalPages);
    }
    
    debouncedSearch(query);
  };

  // Enhanced toggle favorites with database integration
  const toggleFavorites = useCallback(async (movie: Movie, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const movieType = 'tmdb'; // All movies from TMDB API are 'tmdb' type
    const isFavorited = isMovieFavorited(movie.id);
    const isLoading = isFavoriteLoading(movie.id);
    
    if (isLoading) {
      return; // Prevent action if already loading
    }

    try {
      if (isFavorited) {
        await removeFromFavorites(movie.id, movieType);
      } else {
        await addToFavorites(movie.id, movieType, movie);
      }
      
      // Dispatch event for other components to update
      window.dispatchEvent(new CustomEvent('favorites-updated'));
    } catch (error) {
      console.error('Toggle favorites error:', error);
      // Error is already handled in the hook with toast messages
    }
  }, [isMovieFavorited, isFavoriteLoading, addToFavorites, removeFromFavorites]);

  // Listen for favorites updates from other components
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      refreshFavorites();
    };

    window.addEventListener('favorites-updated', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('favorites-updated', handleFavoritesUpdate);
    };
  }, [refreshFavorites]);

  // Enhanced movie card with instant play functionality
  const renderMovieCard = (movie: Movie, index: number, priority = false, featured = false) => {
    const isFavorited = isMovieFavorited(movie.id);
    const isLoadingFavorite = isFavoriteLoading(movie.id);
    const isSelected = selectedMovieId === movie.id;
    
    return (
      <motion.div
        key={movie.id}
        className={`group relative cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 ${
          isSelected ? 'scale-105 ring-2 ring-primary ring-opacity-50' : ''
        } ${featured ? 'col-span-2 row-span-2' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.01 }}
        onClick={() => handleMovieSelection(movie.id)}
        onMouseEnter={() => setHoveredMovie(movie.id)}
        onMouseLeave={() => setHoveredMovie(null)}
      >
        <div className={`relative rounded-lg overflow-hidden bg-gray-800 ${
          featured ? 'aspect-[3/2]' : 'aspect-[2/3]'
        } ${isSelected ? 'animate-pulse' : ''}`}>
          {movie.poster_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/${featured ? 'w780' : 'w500'}${featured && movie.backdrop_path ? movie.backdrop_path : movie.poster_path}`}
              alt={movie.title}
              fill
              sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 16vw"}
              className={`object-cover transition-all duration-300 group-hover:scale-110 ${
                isSelected ? 'scale-110 blur-sm' : ''
              }`}
              priority={priority}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAAAAAABAgMABAUGIWGBkaGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <span className="text-gray-400 text-center p-4 text-sm">{movie.title}</span>
            </div>
          )}

          {/* Loading overlay for selected movie */}
          {isSelected && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  className="inline-block h-8 w-8 border-2 border-white border-t-transparent rounded-full mb-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-white text-sm font-medium">Loading...</p>
              </div>
            </div>
          )}

          {/* Featured movie overlay with instant play */}
          {featured && !isSelected && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/90 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                  <span>{new Date(movie.release_date).getFullYear()}</span>
                </div>
                <p className="text-white/80 text-sm line-clamp-2 mb-3">
                  {movie.overview}
                </p>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMovieSelection(movie.id);
                    }}
                    className="p-2 bg-white text-black rounded-full hover:bg-white/90 transition-colors flex items-center gap-2 px-4"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">Play</span>
                  </motion.button>
                  
                  <button
                    onClick={(e) => toggleFavorites(movie, e)}
                    disabled={isLoadingFavorite}
                    className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm disabled:opacity-50"
                  >
                    {isLoadingFavorite ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {isFavorited ? (
                          <Heart className="h-4 w-4 fill-current text-red-500" />
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regular movie hover overlay with enhanced UX */}
          {!featured && !isSelected && (
            <>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

              <AnimatePresence>
                {hoveredMovie === movie.id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 flex flex-col justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-white font-semibold text-xs sm:text-sm mb-2 line-clamp-2">
                      {movie.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-white/80 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{movie.vote_average.toFixed(1)}</span>
                      </div>
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovieSelection(movie.id);
                        }}
                        className="p-1.5 sm:p-2 bg-white text-black rounded-full hover:bg-white/90 transition-colors flex items-center gap-1 px-3"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                        <span className="text-xs font-medium hidden sm:inline">Play</span>
                      </motion.button>
                      
                      <button
                        onClick={(e) => toggleFavorites(movie, e)}
                        disabled={isLoadingFavorite}
                        className="p-1.5 sm:p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm disabled:opacity-50"
                      >
                        {isLoadingFavorite ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            {isFavorited ? (
                              <Heart className="h-3 w-3 fill-current text-red-500" />
                            ) : (
                              <Heart className="h-3 w-3" />
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // Enhanced cinematic hero carousel
  const renderCinematicHeroCarousel = () => {
    if (!heroMovies.length) return null;

    const currentMovie = heroMovies[currentHeroIndex];
    const isFavorited = isMovieFavorited(currentMovie.id);
    const isLoadingFavorite = isFavoriteLoading(currentMovie.id);
    const isSelected = selectedMovieId === currentMovie.id;

    return (
      <div 
        className="relative h-[40vh] sm:h-[45vh] md:h-[55vh] lg:h-[65vh] xl:h-[70vh] min-h-[300px] max-h-[500px] mb-4 sm:mb-6 overflow-hidden rounded-lg sm:rounded-xl group safe-area-padding-top"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
      >
        {/* Background Images with Cinematic Transitions */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMovie.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ 
                opacity: 1, 
                scale: isCarouselTransitioning ? 1.01 : 1,
                filter: isSelected ? 'blur(2px)' : 'blur(0px)'
              }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              {currentMovie.backdrop_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w1280${currentMovie.backdrop_path}`}
                  alt={currentMovie.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAAAAAABAgMABAUGIWGBkaGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* iPhone-Optimized Loading Overlay */}
        {isSelected && (
          <motion.div 
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center px-3">
              <motion.div
                className="inline-block h-8 w-8 sm:h-10 sm:w-10 border-2 border-white border-t-transparent rounded-full mb-2 sm:mb-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              <motion.p 
                className="text-white text-xs sm:text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Loading...
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Optimized Gradient Overlays for iPhone */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />

        {/* iPhone Touch-Optimized Navigation */}
        <div className="absolute inset-y-0 left-1 sm:left-2 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            onClick={prevSlide}
            className="p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all touch-manipulation"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </motion.button>
        </div>
        
        <div className="absolute inset-y-0 right-1 sm:right-2 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            onClick={nextSlide}
            className="p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all touch-manipulation"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </motion.button>
        </div>

        {/* Compact Status Indicator for iPhone */}
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs">
            {isCarouselPaused ? (
              <Pause className="h-2 w-2 sm:h-3 sm:w-3" />
            ) : (
              <Play className="h-2 w-2 sm:h-3 sm:w-3" />
            )}
          </div>
        </div>

        {/* iPhone Landscape-Optimized Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8 z-15 safe-area-padding-bottom">
          <div className="max-w-lg md:max-w-xl lg:max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMovie.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* iPhone-Optimized Title */}
                <motion.h1 
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-1 sm:mb-2 leading-tight"
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {currentMovie.title}
                </motion.h1>

                {/* Ultra-Compact Info for iPhone Landscape */}
                <motion.div 
                  className="flex items-center gap-1 sm:gap-2 mb-2 text-white/90 flex-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-yellow-500/20 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5">
                    <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-xs sm:text-sm">{currentMovie.vote_average.toFixed(1)}</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5">
                    <span className="font-semibold text-xs sm:text-sm">{new Date(currentMovie.release_date).getFullYear()}</span>
                  </div>
                  <div className="bg-red-500/20 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5">
                    <span className="font-semibold text-red-200 text-xs sm:text-sm">Latest</span>
                  </div>
                </motion.div>

                {/* Compact Overview for iPhone */}
                <motion.p 
                  className="text-xs sm:text-sm md:text-base text-white/90 mb-2 sm:mb-3 line-clamp-2 max-w-md leading-relaxed"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {currentMovie.overview}
                </motion.p>

                {/* iPhone-Optimized Action Buttons */}
                <motion.div 
                  className="flex items-center gap-1.5 sm:gap-2 flex-wrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.button
                    onClick={() => handleMovieSelection(currentMovie.id)}
                    disabled={isSelected}
                    className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black rounded-md sm:rounded-lg hover:bg-white/90 transition-all font-bold text-xs sm:text-sm disabled:opacity-50 shadow-lg touch-manipulation"
                    whileHover={{ scale: isSelected ? 1 : 1.02 }}
                    whileTap={{ scale: isSelected ? 1 : 0.98 }}
                  >
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                    <span>{isSelected ? 'Loading...' : 'Play'}</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleMovieSelection(currentMovie.id)}
                    disabled={isSelected}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 text-white rounded-md sm:rounded-lg hover:bg-white/20 transition-all font-semibold backdrop-blur-md disabled:opacity-50 border border-white/30 touch-manipulation text-xs sm:text-sm"
                    whileHover={{ scale: isSelected ? 1 : 1.02 }}
                    whileTap={{ scale: isSelected ? 1 : 0.98 }}
                  >
                    <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Info</span>
                  </motion.button>

                  <motion.button
                    onClick={(e) => toggleFavorites(currentMovie, e)}
                    disabled={isLoadingFavorite}
                    className="p-1.5 sm:p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all backdrop-blur-md disabled:opacity-50 border border-white/30 shadow-lg touch-manipulation"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isLoadingFavorite ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <>
                        {isFavorited ? (
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4 fill-current text-red-500" />
                        ) : (
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* iPhone-Optimized Carousel Indicators */}
        <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 z-20">
          {heroMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-200 touch-manipulation ${
                index === currentHeroIndex 
                  ? 'bg-white w-4 sm:w-6' 
                  : 'bg-white/40 w-1 sm:w-1.5 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Thin Progress Bar for iPhone */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-20">
          <motion.div
            className="h-full bg-red-500"
            initial={{ width: '0%' }}
            animate={{ 
              width: isCarouselPaused ? '0%' : '100%' 
            }}
            transition={{ 
              duration: isCarouselPaused ? 0 : 5,
              ease: 'linear',
              repeat: isCarouselPaused ? 0 : Infinity
            }}
            key={`progress-${currentHeroIndex}-${isCarouselPaused}`}
          />
        </div>
      </div>
    );
  };

  // Enhanced horizontal scrolling section with more compact design
  const renderMovieSection = (title: string, movies: Movie[], loading: boolean, icon?: React.ReactNode) => (
    <div className="mb-8 sm:mb-12">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        {icon}
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{title}</h2>
      </div>
      
      {loading ? (
        <TrendingCarouselSkeleton />
      ) : (
        <div className="relative">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {movies.map((movie, index) => (
              <div key={movie.id} className="flex-shrink-0 w-32 sm:w-40 lg:w-48">
                {renderMovieCard(movie, index, index < 6)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const displayMovies = searchQuery ? searchResults : discoverMovies;
  const isSearching = searchQuery.length > 0;
  const currentTotalResults = isSearching ? searchResults.length : discoverMovies.length;

  return (
    <section className={`home-section ${className}`}>
      {/* Continue Watching Hero Section - Show at the top for authenticated users */}
      {!sessionPending && session?.user && !isSearching && !showSearchBox && (
        <div className="mb-8 sm:mb-12">
          <ContinueWatching 
            onMovieSelect={onMovieSelect}
            className="hero-section"
          />
        </div>
      )}

      {/* Enhanced Search Bar - Only show when showSearchBox is true */}
      {showSearchBox && (
        <motion.div
          className="glass-card p-4 sm:p-6 rounded-xl mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-lg"
              />
            </div>
            
            <div className="flex items-center gap-2 sm:shrink-0">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-3 sm:px-4 py-3 sm:py-4 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base min-w-0 flex-1 sm:flex-initial"
              >
                {FILTER_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {searchLoading && (
            <div className="mt-3 sm:mt-4 flex items-center gap-2 text-muted-foreground text-sm">
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              <span>Searching...</span>
            </div>
          )}

          {/* Favorites error display */}
          {favoritesError && (
            <div className="mt-3 sm:mt-4 flex items-center gap-2 text-yellow-600 text-sm">
              <Heart className="h-4 w-4" />
              <span>Favorites sync offline - changes saved locally</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Cinematic Hero Carousel - Only show when not searching */}
      {!isSearching && !showSearchBox && renderCinematicHeroCarousel()}

      {/* Trending Section - Only show when not searching */}
      {!isSearching && !showSearchBox && renderMovieSection(
        "Trending Now", 
        trendingMovies, 
        trendingLoading,
        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
      )}

      {/* Main Results Section with Enhanced Mobile Grid */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            {isSearching || showSearchBox ? (
              <>
                <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="hidden sm:inline">
                  {isSearching ? `Search Results for "${searchQuery}"` : 'Search Movies'}
                </span>
                <span className="sm:hidden">
                  {isSearching ? 'Results' : 'Search'}
                </span>
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                <span className="hidden sm:inline">Discover Movies</span>
                <span className="sm:hidden">Discover</span>
              </>
            )}
          </h2>
          
          {displayMovies.length > 0 && (
            <div className="text-right">
              <span className="text-muted-foreground text-sm">
                {currentTotalResults.toLocaleString()} {currentTotalResults === 1 ? 'movie' : 'movies'}
              </span>
              {isSearching && (
                <div className="text-xs text-muted-foreground/80">
                  Page {searchPage} of {searchTotalPages}
                </div>
              )}
              {!isSearching && !showSearchBox && (
                <div className="text-xs text-muted-foreground/80">
                  Page {currentPage} of {totalPages} • {totalResults.toLocaleString()} total
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Results Grid with Mixed Sizes */}
        {loading || (isSearching && searchLoading) || discoverLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
            {Array.from({ length: 40 }).map((_, index) => (
              <MovieCardSkeleton key={index} />
            ))}
          </div>
        ) : displayMovies.length > 0 ? (
          <>
            <motion.div 
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6 auto-rows-max"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {displayMovies.map((movie, index) => {
                // Make every 7th movie (starting from index 6) featured on larger screens - but only when not in search mode
                const isFeatured = !isSearching && !showSearchBox && index > 0 && (index + 1) % 7 === 0 && typeof window !== 'undefined' && window.innerWidth >= 1024;
                return renderMovieCard(movie, index, index < 20, isFeatured);
              })}
            </motion.div>

            {/* Infinite Scroll Trigger */}
            <div 
              ref={loadMoreTriggerRef} 
              className="h-4"
            />

            {/* Load More Button and Loading States */}
            {hasMoreMovies && (
              <div className="flex flex-col items-center gap-4 py-8">
                {loadingMore ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading more movies...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Load More Movies
                  </button>
                )}
                
                <div className="text-center text-sm text-muted-foreground">
                  {isSearching ? (
                    <p>Showing {searchResults.length} results • Page {searchPage} of {searchTotalPages}</p>
                  ) : (
                    <p>Showing {discoverMovies.length} of {totalResults.toLocaleString()} movies • Page {currentPage} of {totalPages}</p>
                  )}
                </div>
              </div>
            )}

            {!hasMoreMovies && displayMovies.length > 20 && (
              <div className="text-center py-8">
                <div className="glass-card p-6 rounded-xl max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    You've reached the end! 🎬
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {isSearching 
                      ? `Found ${searchResults.length} movies for "${searchQuery}"`
                      : `Browsed ${discoverMovies.length} of ${totalResults.toLocaleString()} movies`
                    }
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (isSearching || showSearchBox) ? (
          <motion.div 
            className="text-center py-12 sm:py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Search className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {isSearching ? 'No results found' : 'Start searching for movies'}
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isSearching ? 'Try searching with different keywords' : 'Type in the search box above to find movies'}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-12 sm:py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground text-sm sm:text-base">Loading movies...</p>
          </motion.div>
        )}
      </div>

      {/* Error Handling */}
      {error && (
        <motion.div
          className="glass-card p-4 sm:p-6 rounded-xl border border-destructive/50 bg-destructive/10 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-destructive font-medium mb-4 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchTrendingMovies();
              fetchDiscoverMovies(1, false);
            }}
            className="px-4 sm:px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
          >
            {t('ui.retry')}
          </button>
        </motion.div>
      )}
    </section>
  );
}