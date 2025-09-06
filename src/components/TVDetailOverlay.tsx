"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Heart, Star, Calendar, Users, Info, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useFavorites } from '@/hooks/useFavorites';
import { useSession } from '@/lib/auth-client';
import VideoPlayer from './VideoPlayer';

interface Episode {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_number: number;
  runtime: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
}

interface Season {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_count: number;
  poster_path: string | null;
  season_number: number;
  episodes: Episode[];
}

interface TVShow {
  id: number;
  name: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  genres: Array<{ id: number; name: string }>;
  number_of_episodes: number;
  number_of_seasons: number;
  status: string;
  seasons: Season[];
}

interface TVDetailOverlayProps {
  tvShowId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TVDetailOverlay: React.FC<TVDetailOverlayProps> = ({ 
  tvShowId, 
  isOpen, 
  onClose 
}) => {
  const { data: session } = useSession();
  const [tvShow, setTVShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    isMovieFavorited,
    addToFavorites,
    removeFromFavorites,
    isLoadingMovie: isFavoriteLoading,
  } = useFavorites();

  // Fetch TV show details
  useEffect(() => {
    if (!tvShowId || !isOpen) {
      setTVShow(null);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchTVShowDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        toast.loading("📺 Loading TV show details...", {
          id: `tv-details-${tvShowId}`
        });

        const response = await fetch(`/api/tv-shows/${tvShowId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch TV show details: ${response.status}`);
        }
        
        const data = await response.json();
        
        setTVShow(data);
        // Set default episode to first episode of first season
        if (data.seasons?.[0]?.episodes?.[0]) {
          setCurrentEpisode(data.seasons[0].episodes[0]);
        }

        toast.success("✅ TV show loaded!", {
          id: `tv-details-${tvShowId}`,
          description: `${data.name} • ${data.number_of_seasons} seasons`,
          duration: 2000
        });
      } catch (error: any) {
        console.error('Error fetching TV show details:', error);
        setError(error.message || 'Failed to load TV show details');
        
        toast.error("❌ Failed to load TV show", {
          id: `tv-details-${tvShowId}`,
          description: "Please try again"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTVShowDetails();
  }, [tvShowId, isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showVideoPlayer) {
          setShowVideoPlayer(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, showVideoPlayer, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Handle play episode
  const handlePlayEpisode = async (episode: Episode) => {
    try {
      toast.loading("🎬 Loading episode player...", {
        id: `episode-${episode.id}`,
        description: `S${episode.season_number}E${episode.episode_number}: ${episode.name}`
      });

      setCurrentEpisode(episode);
      setShowVideoPlayer(true);

      toast.success("▶️ Episode ready!", {
        id: `episode-${episode.id}`,
        duration: 2000
      });
    } catch (error) {
      console.error('Error playing episode:', error);
      toast.error("❌ Failed to load episode player");
    }
  };

  // Toggle favorites
  const handleFavoritesToggle = async () => {
    if (!tvShow || !tvShowId) return;
    
    const movieType = 'tmdb';
    const isFavorited = isMovieFavorited(tvShowId);
    const isLoading = isFavoriteLoading(tvShowId);
    
    if (isLoading) return;

    try {
      if (isFavorited) {
        await removeFromFavorites(tvShowId, movieType);
        toast.success('💔 Removed from favorites');
      } else {
        // Map TV show data to the format expected by favorites system
        const tvShowData = {
          title: tvShow.name, // Map name to title
          poster_path: tvShow.poster_path, // Already correct
          backdrop_path: tvShow.backdrop_path, // Already correct
          release_date: tvShow.first_air_date, // Map first_air_date to release_date
          vote_average: tvShow.vote_average, // Already correct
          overview: tvShow.overview, // Already correct
          genres: tvShow.genres || [], // Already correct
          id: tvShow.id // Already correct
        };
        
        await addToFavorites(tvShowId, movieType, tvShowData);
        toast.success('❤️ Added to favorites!');
      }
      
      window.dispatchEvent(new CustomEvent('favorites-updated'));
    } catch (error) {
      console.error('Toggle favorites error:', error);
    }
  };

  if (!isOpen) return null;

  // Video Player
  if (showVideoPlayer && currentEpisode && tvShow) {
    return (
      <VideoPlayer
        movieId={currentEpisode.id}
        title={`${tvShow.name} - S${currentEpisode.season_number}E${currentEpisode.episode_number}: ${currentEpisode.name}`}
        onClose={() => setShowVideoPlayer(false)}
      />
    );
  }

  if (loading) {
    return (
      <motion.div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white text-xl mb-2">Loading TV show...</p>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-white">Error Loading TV Show</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!tvShow) {
    return (
      <motion.div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-white">TV Show Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The requested TV show could not be found.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  const selectedSeasonData = tvShow.seasons.find(s => s.season_number === selectedSeason);
  const isFavorited = isMovieFavorited(tvShowId!);
  const isLoadingFavorite = isFavoriteLoading(tvShowId!);

  return (
    <motion.div 
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdropClick}
    >
      <motion.div 
        className="fixed inset-4 md:inset-8 lg:inset-12 xl:inset-16 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        <div className="h-full overflow-y-auto">
          {/* Hero Section */}
          <div className="relative h-[40vh] md:h-[50vh]">
            {tvShow.backdrop_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/original${tvShow.backdrop_path}`}
                alt={tvShow.name}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted-foreground/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No backdrop available</p>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            
            {/* Content Over Hero */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Poster */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 md:w-48 h-48 md:h-72 rounded-lg overflow-hidden shadow-2xl">
                    {tvShow.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${tvShow.poster_path}`}
                        alt={tvShow.name}
                        fill
                        sizes="(max-width: 768px) 128px, 192px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Play className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* TV Show Info */}
                <div className="flex-1 text-white">
                  <h1 className="text-2xl md:text-4xl font-bold mb-2">{tvShow.name}</h1>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-4 text-sm md:text-base text-gray-300">
                    {tvShow.first_air_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(tvShow.first_air_date).getFullYear()}
                      </div>
                    )}
                    {tvShow.number_of_seasons && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {tvShow.number_of_seasons} season{tvShow.number_of_seasons !== 1 ? 's' : ''}
                      </div>
                    )}
                    {tvShow.number_of_episodes && (
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        {tvShow.number_of_episodes} episodes
                      </div>
                    )}
                    {tvShow.vote_average > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {tvShow.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {currentEpisode && (
                      <button
                        onClick={() => handlePlayEpisode(currentEpisode)}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors"
                      >
                        <Play className="h-5 w-5" />
                        Play S{currentEpisode.season_number}E{currentEpisode.episode_number}
                      </button>
                    )}

                    <button
                      onClick={handleFavoritesToggle}
                      disabled={isLoadingFavorite}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-semibold ${
                        isFavorited
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      } disabled:opacity-50`}
                    >
                      {isLoadingFavorite ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          {isFavorited ? (
                            <>
                              <Heart className="h-5 w-5 fill-current" />
                              In Favorites
                            </>
                          ) : (
                            <>
                              <Heart className="h-5 w-5" />
                              Add to Favorites
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Overview */}
            {tvShow.overview && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-white">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">{tvShow.overview}</p>
              </div>
            )}

            {/* Seasons & Episodes */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-white">Seasons & Episodes</h2>
              
              {/* Season Selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {tvShow.seasons.map((season) => (
                  <button
                    key={season.season_number}
                    onClick={() => setSelectedSeason(season.season_number)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedSeason === season.season_number
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground hover:bg-accent/80'
                    }`}
                  >
                    Season {season.season_number}
                  </button>
                ))}
              </div>

              {/* Episodes List */}
              {selectedSeasonData?.episodes && (
                <div className="space-y-3">
                  {selectedSeasonData.episodes.map((episode) => (
                    <motion.div
                      key={episode.id}
                      className={`glass-card p-4 rounded-lg cursor-pointer transition-colors ${
                        currentEpisode?.id === episode.id 
                          ? 'bg-primary/20 border border-primary/50' 
                          : 'hover:bg-white/5'
                      }`}
                      onClick={() => handlePlayEpisode(episode)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex gap-4">
                        <div className="relative w-24 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                          {episode.still_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                              alt={episode.name}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Play className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {/* Current Episode Indicator */}
                          {currentEpisode?.id === episode.id && (
                            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                              <Play className="h-6 w-6 text-white" fill="currentColor" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-white">
                              {episode.episode_number}. {episode.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              {episode.vote_average > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {episode.vote_average.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {episode.overview || 'No description available for this episode.'}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              {episode.air_date && `Aired: ${new Date(episode.air_date).toLocaleDateString()}`}
                            </p>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-green-400">Ready to watch</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Genres */}
            {tvShow.genres && tvShow.genres.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {tvShow.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* FLKRD Studio Branding */}
            <div className="text-center pt-6 border-t border-border/50">
              <p className="text-xs text-gray-500">
                Created by <span className="text-white font-medium">Zana Faroq</span> • 
                Powered by <span className="text-primary font-medium">FLKRD STUDIO</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};