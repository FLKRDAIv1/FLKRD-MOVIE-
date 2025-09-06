"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

export interface ContinueWatchingItem {
  movieId: number;
  movieTitle: string;
  posterPath: string;
  percentage: number; // percentage (0-100)
  currentTime: number; // in seconds
  totalDuration: number; // in seconds
  lastWatched: string; // ISO date string
  movieType: 'tmdb' | 'kurdish';
}

export const useContinueWatching = () => {
  const { data: session } = useSession();
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContinueWatching = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/movies/continue-watching/${session.user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match expected format
        const transformedData = data.map((item: any) => ({
          movieId: item.movieId,
          movieTitle: item.movieTitle || `Movie ${item.movieId}`,
          posterPath: item.moviePoster || '',
          percentage: Math.round(item.progressPercentage || 0),
          currentTime: item.currentTime || 0,
          totalDuration: item.totalDuration || 0,
          lastWatched: item.lastWatchedAt || new Date().toISOString(),
          movieType: 'tmdb' as const
        }));
        setContinueWatching(transformedData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch continue watching data');
      }
    } catch (error) {
      console.error('Failed to fetch continue watching:', error);
      setError('Failed to fetch continue watching data');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const saveProgress = useCallback(async (
    movieId: number, 
    movieType: 'tmdb' | 'kurdish',
    currentTime: number, 
    totalDuration: number, 
    movieTitle?: string, 
    posterPath?: string
  ) => {
    if (!session?.user?.id) return;
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/movies/save-progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId,
          currentTime: Math.floor(currentTime), // Ensure integer
          totalDuration: Math.floor(totalDuration), // Ensure integer
          movieTitle,
          moviePoster: posterPath,
        }),
      });
      
      if (response.ok) {
        await fetchContinueWatching(); // Refresh the list
      } else {
        const errorData = await response.json();
        console.error('Save progress error:', errorData);
        toast.error('Failed to save watch progress');
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save watch progress');
    }
  }, [session?.user?.id, fetchContinueWatching]);

  const removeFromContinueWatching = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish') => {
    if (!session?.user?.id) return;
    
    try {
      const token = localStorage.getItem('bearer_token');
      await fetch(`/api/streaming/watch-progress`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId,
          movieType,
        }),
      });
      
      setContinueWatching(prev => prev.filter(item => item.movieId !== movieId));
      toast.success('Removed from continue watching');
    } catch (error) {
      console.error('Failed to remove from continue watching:', error);
      toast.error('Failed to remove from continue watching');
    }
  }, [session?.user?.id]);

  const markAsCompleted = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish') => {
    if (!session?.user?.id) return;
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/movies/mark-watched', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId,
          movieTitle: continueWatching.find(item => item.movieId === movieId)?.movieTitle || `Movie ${movieId}`,
        }),
      });
      
      if (response.ok) {
        setContinueWatching(prev => prev.filter(item => item.movieId !== movieId));
        toast.success('Marked as completed');
        
        // Dispatch event for other components to update
        window.dispatchEvent(new CustomEvent('movie-watched', { 
          detail: { movieId, movieType } 
        }));
      } else {
        const errorData = await response.json();
        console.error('Mark completed error:', errorData);
        toast.error('Failed to mark as completed');
      }
    } catch (error) {
      console.error('Failed to mark as completed:', error);
      toast.error('Failed to mark as completed');
    }
  }, [session?.user?.id, continueWatching]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchContinueWatching();
    }
  }, [session?.user?.id, fetchContinueWatching]);

  return {
    continueWatching,
    isLoading,
    error,
    saveProgress,
    removeFromContinueWatching,
    markAsCompleted,
    refetch: fetchContinueWatching,
  };
};