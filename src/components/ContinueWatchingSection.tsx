"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Clock, MoreHorizontal } from 'lucide-react';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ContinueWatchingSectionProps {
  className?: string;
  onMovieSelect: (movieId: number) => void;
  maxItems?: number;
}

export const ContinueWatchingSection: React.FC<ContinueWatchingSectionProps> = ({
  className = "",
  onMovieSelect,
  maxItems = 20
}) => {
  const { continueWatching, isLoading, error, removeFromContinueWatching, markAsCompleted } = useContinueWatching();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const formatWatchTime = useCallback((currentTime: number, totalDuration: number) => {
    const remainingTime = totalDuration - currentTime;
    const remainingMinutes = Math.floor(remainingTime / 60);
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;
    
    if (remainingHours > 0) {
      return `${remainingHours}h ${remainingMins}m left`;
    }
    return `${remainingMins}m left`;
  }, []);

  const formatLastWatched = useCallback((lastWatched: string) => {
    const date = new Date(lastWatched);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  const handleRemoveItem = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish', event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await removeFromContinueWatching(movieId, movieType);
      toast.success("Removed from continue watching");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  }, [removeFromContinueWatching]);

  const handleMarkCompleted = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish', event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await markAsCompleted(movieId, movieType);
      toast.success("Marked as completed");
    } catch (error) {
      toast.error("Failed to mark as completed");
    }
  }, [markAsCompleted]);

  const handleResumeWatch = useCallback((movieId: number) => {
    onMovieSelect(movieId);
  }, [onMovieSelect]);

  if (isLoading) {
    return (
      <section className={`continue-watching-section ${className}`}>
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <Skeleton className="w-[200px] h-[300px] rounded-lg mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`continue-watching-section ${className}`}>
        <div className="glass-card p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-gradient">Continue Watching</h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Unable to load continue watching data</p>
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <Button 
              variant="outline" 
              className="glass-button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const displayItems = continueWatching.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <section className={`continue-watching-section ${className}`}>
        <div className="glass-card p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-gradient">Continue Watching</h2>
          <div className="py-12">
            <div className="w-24 h-24 mx-auto mb-6 glass-panel-subtle rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No movies in progress</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start watching a movie to see your progress here. You can pick up right where you left off.
            </p>
            <Button 
              className="btn-netflix"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Browse Movies
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`continue-watching-section ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gradient">Continue Watching</h2>
        <p className="text-muted-foreground">
          Pick up right where you left off • {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {displayItems.map((item, index) => (
              <motion.div
                key={`${item.movieId}-${item.movieType}`}
                layout
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.1,
                  layout: { duration: 0.3 }
                }}
                className="flex-shrink-0 w-[200px] md:w-[240px]"
                onMouseEnter={() => setHoveredItem(item.movieId)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="relative movie-card cursor-pointer group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative overflow-hidden rounded-lg glass-card liquid-glow"
                    onClick={() => handleResumeWatch(item.movieId)}
                  >
                    {/* Movie Poster */}
                    <div className="relative aspect-[2/3] overflow-hidden">
                      {item.posterPath ? (
                        <img
                          src={item.posterPath.startsWith('http') ? item.posterPath : `https://image.tmdb.org/t/p/w500${item.posterPath}`}
                          alt={item.movieTitle}
                          className="w-full h-full object-cover movie-poster transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <MoreHorizontal className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/60">
                        <motion.div
                          className="h-full bg-gradient-to-r from-netflix-red to-netflix-gold"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(item.percentage, 100)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>

                      {/* Progress Percentage Badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs font-medium">
                        {Math.round(item.percentage)}%
                      </div>

                      {/* Hover Overlay */}
                      <AnimatePresence>
                        {hoveredItem === item.movieId && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"
                          >
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0.8 }}
                              className="flex flex-col items-center gap-3"
                            >
                              <div className="w-16 h-16 rounded-full glass-button flex items-center justify-center">
                                <Play className="w-8 h-8 ml-1" fill="currentColor" />
                              </div>
                              <p className="text-sm font-medium">Resume</p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action Buttons */}
                      <AnimatePresence>
                        {hoveredItem === item.movieId && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-2 right-2 flex gap-1"
                          >
                            {/* Mark Complete Button */}
                            {item.percentage > 80 && (
                              <button
                                className="w-8 h-8 rounded-full bg-green-600/80 backdrop-blur-sm flex items-center justify-center hover:bg-green-600 transition-colors"
                                onClick={(e) => handleMarkCompleted(item.movieId, item.movieType, e)}
                                aria-label="Mark as completed"
                                title="Mark as completed"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Remove Button */}
                            <button
                              className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center hover:bg-red-600 transition-colors"
                              onClick={(e) => handleRemoveItem(item.movieId, item.movieType, e)}
                              aria-label="Remove from continue watching"
                              title="Remove from continue watching"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Movie Info */}
                  <div className="mt-3 space-y-1">
                    <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                      {item.movieTitle}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{Math.round(item.percentage)}% complete</span>
                      <span>{formatWatchTime(item.currentTime, item.totalDuration)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatLastWatched(item.lastWatched)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Fade out effect at scroll edges */}
        <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
};