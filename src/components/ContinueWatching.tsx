"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, RotateCcw, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useContinueWatching } from '@/hooks/useContinueWatching';

interface ContinueWatchingProps {
  onMovieSelect: (movieId: number) => void;
  className?: string;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return 'Yesterday';
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return `${Math.floor(diffInDays / 7)}w ago`;
};

const formatRemainingTime = (currentTime: number, totalDuration: number): string => {
  const remainingSeconds = totalDuration - currentTime;
  const minutes = Math.floor(remainingSeconds / 60);
  
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
};

const ShimmerCard = () => (
  <div className="flex-shrink-0 w-64 md:w-80 glass-card rounded-xl overflow-hidden">
    <div className="relative aspect-[16/9] loading-shimmer" />
    <div className="p-4">
      <div className="h-4 loading-shimmer rounded mb-2" />
      <div className="h-3 loading-shimmer rounded w-2/3 mb-2" />
      <div className="h-2 loading-shimmer rounded w-full" />
    </div>
  </div>
);

export const ContinueWatching = ({ onMovieSelect, className = '' }: ContinueWatchingProps) => {
  const { continueWatching, isLoading, error, removeFromContinueWatching, markAsCompleted } = useContinueWatching();
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [showActions, setShowActions] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollButtons();
    container.addEventListener('scroll', checkScrollButtons);
    window.addEventListener('resize', checkScrollButtons);

    return () => {
      container.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [checkScrollButtons, continueWatching]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }, []);

  const handleResume = useCallback((movieId: number, title: string) => {
    toast.success(`Resuming "${title}"`);
    onMovieSelect(movieId);
  }, [onMovieSelect]);

  const handleRestart = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish', title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFromContinueWatching(movieId, movieType);
      toast.success(`"${title}" will restart from the beginning`);
      onMovieSelect(movieId);
    } catch (error) {
      toast.error('Failed to restart movie');
    }
  }, [removeFromContinueWatching, onMovieSelect]);

  const handleRemove = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish', title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFromContinueWatching(movieId, movieType);
      toast.success(`Removed "${title}" from Continue Watching`);
    } catch (error) {
      toast.error('Failed to remove from Continue Watching');
    }
  }, [removeFromContinueWatching]);

  const handleMarkCompleted = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish', title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsCompleted(movieId, movieType);
      toast.success(`Marked "${title}" as completed`);
    } catch (error) {
      toast.error('Failed to mark as completed');
    }
  }, [markAsCompleted]);

  // Don't render if no items and not loading
  if (!isLoading && (!continueWatching || continueWatching.length === 0)) {
    return null;
  }

  if (error) {
    return null; // Silently fail for better UX
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative w-full ${className}`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 px-4 md:px-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Continue Watching
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Pick up where you left off
          </p>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Scroll Buttons */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 glass-button rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
          )}
          
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 glass-button rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-4 touch-pan"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isLoading ? (
            // Loading shimmer cards
            Array.from({ length: 4 }, (_, i) => (
              <ShimmerCard key={`shimmer-${i}`} />
            ))
          ) : (
            continueWatching?.map((item) => (
              <motion.div
                key={item.movieId}
                className="flex-shrink-0 w-64 md:w-80 will-change-transform"
                style={{ scrollSnapAlign: 'start' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                whileHover={{ scale: 1.02, y: -8 }}
                onHoverStart={() => setHoveredItem(item.movieId)}
                onHoverEnd={() => {
                  setHoveredItem(null);
                  setShowActions(null);
                }}
              >
                <div className="glass-card rounded-xl overflow-hidden cursor-pointer movie-card group relative">
                  {/* Poster Container */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {item.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w780${item.posterPath}`}
                        alt={item.movieTitle}
                        className="w-full h-full object-cover movie-poster transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}

                    {/* Glassmorphism Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <motion.div
                        className="h-full bg-gradient-to-r from-netflix-red to-netflix-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>

                    {/* Play Button Overlay */}
                    <AnimatePresence>
                      {hoveredItem === item.movieId && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute inset-0 flex items-center justify-center glass-panel-subtle"
                        >
                          <motion.button
                            onClick={() => handleResume(item.movieId, item.movieTitle)}
                            className="glass-button rounded-full p-4 hover:bg-netflix-red/20 transition-colors duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Play className="w-8 h-8 text-white fill-white" />
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Menu Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActions(showActions === item.movieId ? null : item.movieId);
                      }}
                      className="absolute top-3 right-3 glass-button rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white/20"
                    >
                      <MoreHorizontal className="w-4 h-4 text-white" />
                    </button>

                    {/* Action Menu */}
                    <AnimatePresence>
                      {showActions === item.movieId && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          className="absolute top-12 right-3 glass-card rounded-lg p-2 min-w-[160px] z-20"
                        >
                          <button
                            onClick={(e) => handleRestart(item.movieId, item.movieType, item.movieTitle, e)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restart from beginning
                          </button>
                          <button
                            onClick={(e) => handleMarkCompleted(item.movieId, item.movieType, item.movieTitle, e)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Mark as completed
                          </button>
                          <button
                            onClick={(e) => handleRemove(item.movieId, item.movieType, item.movieTitle, e)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Remove from list
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-lg mb-2 line-clamp-1">
                      {item.movieTitle}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>{Math.round(item.percentage)}% watched</span>
                      <span>{formatTimeAgo(item.lastWatched)}</span>
                    </div>

                    {item.totalDuration > 0 && (
                      <div className="text-xs text-muted-foreground mb-3">
                        {formatRemainingTime(item.currentTime, item.totalDuration)}
                      </div>
                    )}

                    {/* Resume Button */}
                    <motion.button
                      onClick={() => handleResume(item.movieId, item.movieTitle)}
                      className="w-full btn-netflix text-sm py-2 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Resume Watching
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Gradient Fade Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
    </motion.section>
  );
};