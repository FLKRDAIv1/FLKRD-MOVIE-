"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Search, Star, Play, Heart, Film, Tv, Loader2, Info, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';
import { useLanguage } from '@/lib/language';
import { useFavorites } from '@/hooks/useFavorites';

interface TVShow {
  id: number;
  name: string;
  posterPath: string;
  backdropPath: string;
  overview: string;
  firstAirDate: string;
  voteAverage: number;
  genreIds: string;
  streamingService: string;
  totalSeasons: number;
  totalEpisodes: number;
  status: string;
  tmdbId?: number;
}

interface DramaSectionProps {
  className?: string;
  onMovieSelect?: (movieId: number) => void;
  onTVShowSelect?: (tvShowId: number) => void;
}

const SHOWS_PER_PAGE = 20;

export default function DramaSection({ 
  className, 
  onMovieSelect,
  onTVShowSelect
}: DramaSectionProps) {
  const { t } = useLanguage();
  const [shows, setShows] = useState<TVShow[]>([]);
  const [featuredShow, setFeaturedShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    addToFavorites,
    removeFromFavorites,
    isMovieFavorited,
    isLoadingMovie: isFavoriteLoading,
  } = useFavorites();

  // Fetch TV shows with enhanced error handling
  const fetchTVShows = useCallback(async (page = 1, append = false, search = '') => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params = new URLSearchParams({
        limit: SHOWS_PER_PAGE.toString(),
        page: page.toString(),
        ...(search && { search }),
        sort: 'voteAverage',
        order: 'desc'
      });

      const response = await fetch(`/api/tv-shows?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        if (append && page > 1) {
          setShows(prev => [...prev, ...data]);
        } else {
          setShows(data);
          // Set featured show as the first show
          if (data.length > 0 && !featuredShow) {
            setFeaturedShow(data[0]);
          }
        }
        
        setHasMore(data.length === SHOWS_PER_PAGE);
        setCurrentPage(page);
      } else {
        console.error('Unexpected API response format:', data);
        if (!append) setShows([]);
      }
    } catch (error) {
      console.error('Failed to fetch TV shows:', error);
      setError('Failed to load TV shows');
      toast.error('Failed to load TV shows');
      if (!append) setShows([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [featuredShow]);

  // Initial data fetch
  useEffect(() => {
    fetchTVShows(1, false);
  }, [fetchTVShows]);

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchTVShows(1, false, query);
    }, 500);
  }, [fetchTVShows]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Load more shows
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchTVShows(currentPage + 1, true, searchQuery);
    }
  };

  // Handle show selection with enhanced feedback
  const handleShowClick = (show: TVShow) => {
    toast.loading("🎬 Loading TV show...", {
      description: `Opening ${show.name}`,
      id: `show-${show.id}`
    });

    if (onTVShowSelect) {
      onTVShowSelect(show.id);
    } else if (onMovieSelect) {
      onMovieSelect(show.id);
    }

    // Clear toast after delay
    setTimeout(() => {
      toast.dismiss(`show-${show.id}`);
    }, 2000);
  };

  // Toggle favorites
  const toggleFavorites = useCallback(async (show: TVShow, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const showType = 'tmdb';
    const isFavorited = isMovieFavorited(show.id);
    const isLoading = isFavoriteLoading(show.id);
    
    if (isLoading) return;

    try {
      if (isFavorited) {
        await removeFromFavorites(show.id, showType);
        toast.success('Removed from favorites');
      } else {
        // Map TV show data to the format expected by favorites system
        const showData = {
          title: show.name, // Map name to title
          poster_path: show.posterPath, // Map posterPath to poster_path
          backdrop_path: show.backdropPath, // Map backdropPath to backdrop_path
          release_date: show.firstAirDate, // Map firstAirDate to release_date
          vote_average: show.voteAverage, // Already correct
          overview: show.overview, // Already correct
          genres: [], // TV shows don't have genres in the same format, but we can add this
          id: show.id // Already correct
        };
        
        await addToFavorites(show.id, showType, showData);
        toast.success('Added to favorites');
      }
      
      window.dispatchEvent(new CustomEvent('favorites-updated'));
    } catch (error) {
      console.error('Toggle favorites error:', error);
    }
  }, [isMovieFavorited, isFavoriteLoading, addToFavorites, removeFromFavorites]);

  // Parse genres helper
  const parseGenres = (genreIds: string) => {
    try {
      const ids = JSON.parse(genreIds || '[]');
      const genreMap: { [key: number]: string } = {
        18: 'Drama', 35: 'Comedy', 10759: 'Action', 16: 'Animation',
        80: 'Crime', 99: 'Documentary', 10751: 'Family', 9648: 'Mystery',
        10765: 'Sci-Fi', 10766: 'Soap', 10767: 'Talk', 37: 'Western'
      };
      return ids.map((id: number) => genreMap[id] || `Genre ${id}`).slice(0, 2);
    } catch {
      return [];
    }
  };

  // Enhanced hero section
  const renderHeroSection = () => {
    if (!featuredShow) return null;

    const isFavorited = isMovieFavorited(featuredShow.id);
    const isLoadingFavorite = isFavoriteLoading(featuredShow.id);
    const genres = parseGenres(featuredShow.genreIds);

    return (
      <div className="relative h-[60vh] min-h-[400px] mb-8 overflow-hidden rounded-xl">
        <div className="absolute inset-0">
          {featuredShow.backdropPath ? (
            <Image
              src={`https://image.tmdb.org/t/p/w1280${featuredShow.backdropPath}`}
              alt={featuredShow.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-2xl">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {featuredShow.name}
            </motion.h1>

            <motion.div 
              className="flex items-center gap-4 mb-4 text-white/90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{featuredShow.voteAverage.toFixed(1)}</span>
              </div>
              <span>{new Date(featuredShow.firstAirDate).getFullYear()}</span>
              <Badge className="bg-primary text-primary-foreground">
                {featuredShow.streamingService.toUpperCase()}
              </Badge>
              <div className="flex gap-2">
                {genres.map(genre => (
                  <span key={genre} className="px-2 py-1 bg-white/20 rounded text-sm">
                    {genre}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-4 mb-4 text-white/80 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span>{featuredShow.totalSeasons} Season{featuredShow.totalSeasons !== 1 ? 's' : ''}</span>
              <span>{featuredShow.totalEpisodes} Episodes</span>
              <Badge variant="outline" className="text-green-400 border-green-500/30">
                {featuredShow.status}
              </Badge>
            </motion.div>

            <motion.p 
              className="text-lg text-white/90 mb-8 line-clamp-3 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {featuredShow.overview}
            </motion.p>

            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button
                onClick={() => handleShowClick(featuredShow)}
                className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-lg hover:bg-white/90 font-semibold text-lg"
              >
                <Play className="h-6 w-6 fill-current" />
                Watch Now
              </Button>
              
              <Button
                onClick={() => handleShowClick(featuredShow)}
                variant="secondary"
                className="flex items-center gap-3 px-8 py-4 bg-white/20 text-white rounded-lg hover:bg-white/30 font-semibold backdrop-blur-sm"
              >
                <Info className="h-6 w-6" />
                More Info
              </Button>

              <Button
                onClick={(e) => toggleFavorites(featuredShow, e)}
                disabled={isLoadingFavorite}
                variant="secondary"
                size="icon"
                className="p-4 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-sm disabled:opacity-50"
              >
                {isLoadingFavorite ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Heart className={`h-6 w-6 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced show card
  const renderShowCard = (show: TVShow, index: number) => {
    const isFavorited = isMovieFavorited(show.id);
    const isLoadingFavorite = isFavoriteLoading(show.id);
    const genres = parseGenres(show.genreIds);
    
    return (
      <motion.div
        key={show.id}
        className="group relative cursor-pointer transition-transform duration-300 hover:scale-105"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
        onClick={() => handleShowClick(show)}
      >
        <Card className="glass-card border-0 overflow-hidden h-full bg-gray-900/50">
          <div className="relative aspect-[2/3] overflow-hidden">
            {show.posterPath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${show.posterPath}`}
                alt={show.name}
                fill
                sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 16vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                priority={index < 6}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <Tv className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Service Badge */}
            <div className="absolute top-2 right-2">
              <Badge className="bg-black/80 text-white text-xs">
                {show.streamingService.toUpperCase()}
              </Badge>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300" />
            
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowClick(show);
                  }}
                >
                  <Play className="h-5 w-5 mr-2 fill-current" />
                  Watch
                </Button>
                
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => toggleFavorites(show, e)}
                    disabled={isLoadingFavorite}
                    className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                  >
                    {isLoadingFavorite ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {show.name}
              </h3>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span>{show.voteAverage?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(show.firstAirDate).getFullYear()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  {show.totalSeasons}S • {show.totalEpisodes}E
                </span>
                <Badge 
                  variant="outline" 
                  className="text-xs border-green-500/30 text-green-400"
                >
                  {show.status}
                </Badge>
              </div>

              {genres.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {genres.map(genre => (
                    <span key={genre} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Search Bar */}
      <motion.div
        className="glass-card p-6 rounded-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Search TV shows..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-12 glass-panel border-white/20 text-white placeholder:text-gray-500 h-12"
          />
        </div>
      </motion.div>

      {/* Hero Section */}
      {!searchQuery && renderHeroSection()}

      {/* Main Results */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {searchQuery ? (
              <>
                <Search className="h-6 w-6" />
                Search Results for "{searchQuery}"
              </>
            ) : (
              <>
                <Tv className="h-6 w-6 text-blue-500" />
                Popular TV Shows
              </>
            )}
          </h2>
          
          {shows.length > 0 && (
            <span className="text-muted-foreground text-sm">
              {shows.length} shows
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : shows.length > 0 ? (
          <>
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {shows.map((show, index) => renderShowCard(show, index))}
            </motion.div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-8">
                {loadingMore ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading more shows...</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    className="px-8 py-3 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                  >
                    Load More Shows
                  </Button>
                )}
              </div>
            )}

            {!hasMore && shows.length > 10 && (
              <div className="text-center py-8">
                <div className="glass-card p-6 rounded-xl max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    All shows loaded! 📺
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Found {shows.length} shows
                  </p>
                </div>
              </div>
            )}
          </>
        ) : searchQuery ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No shows found
            </h3>
            <p className="text-muted-foreground">
              Try searching with different keywords
            </p>
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Tv className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No TV Shows Found</h3>
            <p className="text-gray-400 mb-6">Unable to load TV shows at this time</p>
            <Button
              onClick={() => fetchTVShows(1, false)}
              variant="outline" 
              className="glass-button border-white/20 text-white"
            >
              <Film className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          className="glass-card p-6 rounded-xl border border-destructive/50 bg-destructive/10 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              fetchTVShows(1, false);
            }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </Button>
        </motion.div>
      )}
    </div>
  );
}