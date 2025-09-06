"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Plus, Heart, HeartOff, Share, Download, Star, Calendar, Clock, Users, Film, ExternalLink, Loader2, PlayCircle, Info, ChevronDown, ChevronUp, RefreshCw, ArrowLeft, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { DetailOverlaySkeleton } from './LoadingComponents';
import VideoPlayer from './VideoPlayer';
import { useSession } from '@/lib/auth-client';
import { useFavorites } from '@/hooks/useFavorites';
import { usePersistentState } from '@/hooks/usePersistentState';

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  production_companies: Array<{ id: number; name: string; logo_path: string | null }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; english_name: string; name: string }>;
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  homepage: string;
  imdb_id: string;
  adult: boolean;
  belongs_to_collection: any;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

interface MovieDetails {
  // API returns movie data directly, not nested
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  production_companies?: Array<{ id: number; name: string; logo_path: string | null }>;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages?: Array<{ iso_639_1: string; english_name: string; name: string }>;
  budget?: number;
  revenue?: number;
  status?: string;
  tagline?: string;
  homepage?: string;
  imdb_id?: string;
  adult?: boolean;
  belongs_to_collection?: any;
  original_language?: string;
  original_title?: string;
  popularity?: number;
  video?: boolean;
  // Credits come as nested object
  credits?: {
    cast: Cast[];
    crew: Crew[];
  };
  // Additional fields that might be present (NO REVIEWS)
  streaming_providers?: any[];
  recommendations?: any[];
  videos?: any[];
}

interface DetailOverlayProps {
  movieId: number | null;
  isOpen: boolean;
  onClose: () => void;
  familyMode?: boolean;
}

export default function DetailOverlay({ movieId, isOpen, onClose, familyMode = false }: DetailOverlayProps) {
  const { data: session } = useSession();
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cast'>('overview');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  
  // Persistent state for UI preferences
  const [persistentUIState, setPersistentUIState] = usePersistentState('detailOverlay', {
    defaultTab: 'overview' as 'overview' | 'cast',
    showFullOverview: false
  });
  
  const overlayRef = useRef<HTMLDivElement>(null);

  // Enhanced favorites integration
  const {
    isLoading: favoritesLoading,
    addToFavorites,
    removeFromFavorites,
    isMovieFavorited,
    isLoadingMovie: isFavoriteLoading,
  } = useFavorites();

  // Add coming soon detection
  const isComingSoon = movieDetails?.status === 'Upcoming' || movieDetails?.status === 'In Production';

  // Fetch movie details
  useEffect(() => {
    if (!isOpen || !movieId) return;

    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/movie/${movieId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Movie not found. It may have been removed or is temporarily unavailable.');
          }
          throw new Error(`Failed to load movie details (${response.status})`);
        }

        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid movie data format received from server');
        }

        // Ensure no review data is included and clean the data
        const cleanedData = {
          ...data,
          // Remove any potential review-related fields
          reviews: undefined,
          user_reviews: undefined,
          movie_reviews: undefined,
          review_count: undefined,
          review_data: undefined
        };

        setMovieDetails(cleanedData);
        setRetryCount(0);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load movie details';
        setError(errorMessage);
        
        if (retryCount < maxRetries && !errorMessage.includes('not found')) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchMovieDetails();
          }, 1000 * (retryCount + 1));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId, isOpen, retryCount]);

  // Restore UI state from persistent storage
  useEffect(() => {
    if (isOpen && movieDetails) {
      setActiveTab(persistentUIState.defaultTab);
      setShowFullOverview(persistentUIState.showFullOverview);
    }
  }, [isOpen, movieDetails, persistentUIState]);

  // Save UI state changes
  useEffect(() => {
    if (isOpen) {
      setPersistentUIState(prev => ({
        ...prev,
        defaultTab: activeTab,
        showFullOverview
      }));
    }
  }, [activeTab, showFullOverview, isOpen, setPersistentUIState]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'Escape':
          if (showVideoPlayer) {
            setShowVideoPlayer(false);
          } else {
            onClose();
          }
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (movieDetails && !showVideoPlayer) {
            handlePlayMovie();
          }
          break;
        case 'f':
        case 'F':
          if (movieDetails) {
            handleToggleFavorites();
          }
          break;
        case 's':
        case 'S':
          if (movieDetails) {
            handleShare();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, showVideoPlayer, movieDetails, onClose]);

  // Auto-focus for accessibility
  useEffect(() => {
    if (isOpen && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [isOpen]);

  // Enhanced play movie handler for coming soon movies
  const handlePlayMovie = async () => {
    if (!movieDetails) return;

    // Handle coming soon movies differently
    if (isComingSoon) {
      toast.info("🎬 Coming Soon!", {
        description: "This movie isn't released yet. Add it to your favorites to get notified!",
        duration: 4000
      });
      return;
    }

    try {
      // Show immediate feedback
      toast.loading("🎬 Starting video player...", {
        id: `streaming-${movieId}`,
        description: "Setting up enhanced streaming sources"
      });

      // Always open video player - it has fallback sources built-in
      setShowVideoPlayer(true);
      
      toast.success("🎬 Video player ready!", {
        id: `streaming-${movieId}`,
        description: "Premium streaming sources loaded",
        duration: 2000
      });

      // Track movie as watched
      if (session?.user) {
        window.dispatchEvent(new CustomEvent('movie-watched', { 
          detail: { 
            movieId: movieDetails.id, 
            title: movieDetails.title,
            runtime: movieDetails.runtime || 0
          } 
        }));
      }
    } catch (error) {
      console.error('Error starting video player:', error);
      
      toast.error("❌ Failed to start video player", {
        id: `streaming-${movieId}`,
        description: "Please try again"
      });
    }
  };

  // Enhanced favorites toggle
  const handleToggleFavorites = async () => {
    if (!movieDetails) return;

    const movieType = 'tmdb';
    const isFavorited = isMovieFavorited(movieDetails.id);
    const isLoading = isFavoriteLoading(movieDetails.id);
    
    if (isLoading) return;

    try {
      if (isFavorited) {
        await removeFromFavorites(movieDetails.id, movieType);
        toast.success("💔 Removed from favorites", {
          description: movieDetails.title
        });
      } else {
        await addToFavorites(movieDetails.id, movieType, movieDetails);
        toast.success("❤️ Added to favorites!", {
          description: movieDetails.title
        });
      }
      
      // Update other components
      window.dispatchEvent(new CustomEvent('favorites-updated'));
    } catch (error) {
      console.error('Toggle favorites error:', error);
    }
  };

  // Add want to watch functionality
  const handleWantToWatch = async () => {
    if (!movieDetails) return;

    try {
      await addToFavorites(movieDetails.id, 'tmdb', movieDetails);
      toast.success("📅 Added to Want to Watch!", {
        description: "We'll notify you when this movie is available"
      });
      
      // Update other components
      window.dispatchEvent(new CustomEvent('favorites-updated'));
    } catch (error) {
      console.error('Want to watch error:', error);
      toast.error("Failed to add to Want to Watch");
    }
  };

  // Enhanced sharing functionality
  const handleShare = async () => {
    if (!movieDetails) return;

    const shareData = {
      title: `${movieDetails.title} - FLKRD Movies`,
      text: `Check out "${movieDetails.title}" on FLKRD Movies! ${movieDetails.overview ? movieDetails.overview.substring(0, 100) + '...' : ''}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("🎬 Movie shared successfully!");
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
        toast.success("🔗 Movie details copied to clipboard!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error("Failed to share movie");
      }
    }
  };

  // Enhanced error display with better UX and debugging info
  const renderErrorState = () => (
    <motion.div
      className="flex items-center justify-center min-h-screen p-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="glass-card p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Failed to Load</h2>
        <p className="text-gray-400 mb-2">{error}</p>
        
        {error?.includes('not found') ? (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-4">
              This movie may have been removed or is temporarily unavailable.
            </p>
            <div className="glass-panel-subtle p-3 rounded text-left">
              <p className="text-xs text-gray-400 mb-2">You can try:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Searching for the movie by name</li>
                <li>• Browsing similar movies</li>
                <li>• Checking back later</li>
              </ul>
            </div>
          </div>
        ) : error?.includes('Invalid movie data format') ? (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-4">
              The movie data appears to be corrupted or incomplete.
            </p>
            <div className="glass-panel-subtle p-3 rounded text-left">
              <p className="text-xs text-gray-400 mb-2">Try:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Refreshing the page</li>
                <li>• Clearing your browser cache</li>
                <li>• Trying a different movie</li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            {retryCount > 0 ? `Tried ${retryCount} times. ` : ''}
            Please check your internet connection and try again.
          </p>
        )}
        
        <div className="flex gap-3 justify-center">
          {!error?.includes('not found') && (
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Close
          </button>
        </div>
        
        {movieId && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500">Movie ID: {movieId}</p>
            {retryCount > 0 && (
              <p className="text-xs text-gray-500">Attempts: {retryCount}/{maxRetries}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  // Enhanced retry function
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setMovieDetails(null);
    
    // Force re-fetch by toggling loading
    setLoading(true);
    setTimeout(() => {
      // This will trigger the useEffect to fetch again
      const event = new Event('retry-fetch');
      window.dispatchEvent(event);
    }, 500);
  };

  // Enhanced cast section with better data access
  const renderCastSection = () => {
    const cast = movieDetails?.credits?.cast || [];
    const crew = movieDetails?.credits?.crew || [];

    return (
      <div className="space-y-6">
        {cast.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Cast</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {cast.slice(0, 12).map((actor) => (
                <motion.div
                  key={actor.id}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-full aspect-square rounded-full overflow-hidden mb-2 bg-gray-800">
                    {actor.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                        alt={actor.name}
                        fill
                        sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16vw, 12vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white truncate">{actor.name}</p>
                  <p className="text-xs text-gray-400 truncate">{actor.character}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {crew.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Key Crew</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crew
                .filter(member => ['Director', 'Producer', 'Writer', 'Screenplay', 'Story'].includes(member.job))
                .slice(0, 6)
                .map((member) => (
                  <div key={`${member.id}-${member.job}`} className="flex items-center gap-3 glass-panel-subtle p-3 rounded">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                      {member.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w200${member.profile_path}`}
                          alt={member.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.job}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced recommendations with better data access (NO REVIEWS)
  const renderRecommendations = () => {
    const recommendations = movieDetails?.recommendations || [];
    
    return recommendations.length > 0 && (
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-white mb-6">More Like This</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {recommendations.slice(0, 12).map((movie) => (
            <motion.div
              key={movie.id}
              className="group cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                // Close current and open new movie details
                setMovieDetails(null);
                // Trigger parent to update movieId
                window.dispatchEvent(new CustomEvent('movie-select', { detail: { movieId: movie.id } }));
              }}
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                {movie.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <Film className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-white/80">{movie.vote_average?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // Format runtime with safe handling
  const formatRuntime = (minutes?: number) => {
    if (!minutes || minutes <= 0) return 'Unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format currency with safe handling
  const formatCurrency = (amount?: number) => {
    if (!amount || amount <= 0) return 'Unknown';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Enhanced close handler
  const handleClose = () => {
    if (showVideoPlayer) {
      setShowVideoPlayer(false);
      return;
    }
    
    setMovieDetails(null);
    setError(null);
    setActiveTab('overview');
    setShowFullOverview(false);
    setRetryCount(0);
    onClose();
  };

  if (!isOpen) return null;

  // Video Player with enhanced error handling
  if (showVideoPlayer && movieDetails) {
    return (
      <VideoPlayer
        movieId={movieDetails.id}
        title={movieDetails.title}
        onClose={() => setShowVideoPlayer(false)}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-50 overflow-hidden bg-black/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div className="relative h-full overflow-y-auto custom-scrollbar">
          {loading && <DetailOverlaySkeleton />}
          
          {error && renderErrorState()}

          {movieDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Enhanced Backdrop Section with updated data access */}
              <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] min-h-[400px]">
                {movieDetails.backdrop_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w1280${movieDetails.backdrop_path}`}
                    alt={movieDetails.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

                {/* Enhanced Close Button */}
                <motion.button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close movie details"
                >
                  <X className="h-6 w-6" />
                </motion.button>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                  <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                    {/* Movie Poster */}
                    <motion.div
                      className="flex-shrink-0"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="relative w-48 md:w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                        {movieDetails.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`}
                            alt={movieDetails.title}
                            fill
                            sizes="(max-width: 768px) 192px, 256px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <Film className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Movie Info with updated data access */}
                    <motion.div
                      className="flex-1 min-w-0"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      {/* Title and Tagline */}
                      <div className="mb-4">
                        <h1 id="movie-title" className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                          {movieDetails.title}
                        </h1>
                        {movieDetails.tagline && (
                          <p className="text-lg md:text-xl text-gray-300 italic">
                            "{movieDetails.tagline}"
                          </p>
                        )}
                      </div>

                      {/* Enhanced Movie Metadata with safe handling */}
                      <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-300">
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{movieDetails.vote_average?.toFixed(1) || 'N/A'}</span>
                          <span className="text-sm">({movieDetails.vote_count?.toLocaleString() || '0'} votes)</span>
                        </div>
                        {movieDetails.release_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(movieDetails.release_date).getFullYear()}</span>
                          </div>
                        )}
                        {movieDetails.runtime && movieDetails.runtime > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatRuntime(movieDetails.runtime)}</span>
                          </div>
                        )}
                        {movieDetails.status && (
                          <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                            {movieDetails.status}
                          </span>
                        )}
                      </div>

                      {/* Enhanced Action Buttons with Coming Soon Support */}
                      <div className="flex flex-wrap items-center gap-3 mb-6">
                        {isComingSoon ? (
                          <>
                            <motion.button
                              onClick={handleWantToWatch}
                              disabled={isFavoriteLoading(movieDetails.id)}
                              className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-bold text-lg shadow-lg disabled:opacity-50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isFavoriteLoading(movieDetails.id) ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                              ) : (
                                <Plus className="h-6 w-6" />
                              )}
                              <span>Want to Watch</span>
                            </motion.button>

                            <motion.div
                              className="flex items-center gap-2 px-6 py-4 bg-orange-600/20 text-orange-400 rounded-lg backdrop-blur-sm border border-orange-500/30"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <Calendar className="h-5 w-5" />
                              <span className="font-semibold">Coming Soon</span>
                            </motion.div>
                          </>
                        ) : (
                          <motion.button
                            onClick={handlePlayMovie}
                            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-bold text-lg shadow-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <PlayCircle className="h-6 w-6" />
                            <span>Play Now</span>
                          </motion.button>
                        )}

                        <motion.button
                          onClick={handleToggleFavorites}
                          disabled={isFavoriteLoading(movieDetails.id)}
                          className={`flex items-center gap-2 px-6 py-4 rounded-lg transition-colors font-semibold ${
                            isMovieFavorited(movieDetails.id)
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                          } disabled:opacity-50`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isFavoriteLoading(movieDetails.id) ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : isMovieFavorited(movieDetails.id) ? (
                            <Heart className="h-5 w-5 fill-current" />
                          ) : (
                            <Heart className="h-5 w-5" />
                          )}
                          <span>
                            {isComingSoon 
                              ? (isMovieFavorited(movieDetails.id) ? 'Remove from List' : 'Add to List')
                              : (isMovieFavorited(movieDetails.id) ? 'Remove' : 'Favorite')
                            }
                          </span>
                        </motion.button>

                        <motion.button
                          onClick={handleShare}
                          className="flex items-center gap-2 px-6 py-4 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          title="Share this movie"
                        >
                          <Share2 className="h-5 w-5" />
                          <span>Share</span>
                        </motion.button>

                        {movieDetails.homepage && (
                          <motion.a
                            href={movieDetails.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-4 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ExternalLink className="h-5 w-5" />
                            <span>Official Site</span>
                          </motion.a>
                        )}
                      </div>

                      {/* Genre Tags with safe handling */}
                      {movieDetails.genres && movieDetails.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {movieDetails.genres.map((genre) => (
                            <span
                              key={genre.id}
                              className="px-3 py-1 bg-white/20 text-white rounded-full text-sm backdrop-blur-sm"
                            >
                              {genre.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Enhanced Content Section with safe data handling */}
              <div className="px-6 md:px-12 py-8">
                {/* Tab Navigation */}
                <div className="flex gap-6 mb-8 border-b border-white/10">
                  {[
                    { id: 'overview', label: 'Overview', icon: Info },
                    { id: 'cast', label: 'Cast & Crew', icon: Users }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as typeof activeTab)}
                      className={`flex items-center gap-2 pb-4 transition-colors ${
                        activeTab === id 
                          ? 'text-white border-b-2 border-primary' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    {/* Enhanced Overview with safe handling */}
                    {movieDetails.overview && movieDetails.overview.trim() && (
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Plot Summary</h3>
                        <div className="relative">
                          <p className={`text-gray-300 leading-relaxed ${
                            showFullOverview ? '' : 'line-clamp-4'
                          }`}>
                            {movieDetails.overview}
                          </p>
                          {movieDetails.overview.length > 300 && (
                            <button
                              onClick={() => setShowFullOverview(!showFullOverview)}
                              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors mt-2"
                            >
                              {showFullOverview ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  <span>Show Less</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  <span>Read More</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Production Details with safe handling */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {movieDetails.budget && movieDetails.budget > 0 && (
                        <div className="glass-panel-subtle p-4 rounded-lg">
                          <h4 className="text-white font-semibold mb-2">Budget</h4>
                          <p className="text-gray-300">{formatCurrency(movieDetails.budget)}</p>
                        </div>
                      )}
                      
                      {movieDetails.revenue && movieDetails.revenue > 0 && (
                        <div className="glass-panel-subtle p-4 rounded-lg">
                          <h4 className="text-white font-semibold mb-2">Box Office</h4>
                          <p className="text-gray-300">{formatCurrency(movieDetails.revenue)}</p>
                        </div>
                      )}

                      {movieDetails.production_countries && movieDetails.production_countries.length > 0 && (
                        <div className="glass-panel-subtle p-4 rounded-lg">
                          <h4 className="text-white font-semibold mb-2">Country</h4>
                          <p className="text-gray-300">
                            {movieDetails.production_countries.map(c => c.name).join(', ')}
                          </p>
                        </div>
                      )}

                      {movieDetails.spoken_languages && movieDetails.spoken_languages.length > 0 && (
                        <div className="glass-panel-subtle p-4 rounded-lg">
                          <h4 className="text-white font-semibold mb-2">Languages</h4>
                          <p className="text-gray-300">
                            {movieDetails.spoken_languages.map(l => l.english_name).join(', ')}
                          </p>
                        </div>
                      )}

                      {movieDetails.imdb_id && (
                        <div className="glass-panel-subtle p-4 rounded-lg">
                          <h4 className="text-white font-semibold mb-2">External Links</h4>
                          <a
                            href={`https://www.imdb.com/title/${movieDetails.imdb_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>IMDb</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Production Companies with safe handling */}
                    {movieDetails.production_companies && movieDetails.production_companies.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Production Companies</h3>
                        <div className="flex flex-wrap gap-4">
                          {movieDetails.production_companies.map((company) => (
                            <div
                              key={company.id}
                              className="flex items-center gap-3 glass-panel-subtle p-3 rounded-lg"
                            >
                              {company.logo_path ? (
                                <div className="relative w-12 h-12">
                                  <Image
                                    src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                                    alt={company.name}
                                    fill
                                    sizes="48px"
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                                  <Film className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <span className="text-white font-medium">{company.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'cast' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderCastSection()}
                  </motion.div>
                )}

                {/* Recommendations (NO REVIEWS SECTION) */}
                {renderRecommendations()}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}