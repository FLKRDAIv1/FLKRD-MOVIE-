"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

interface FavoriteRecord {
  id: number;
  userId: string;
  movieId: number;
  movieType: 'tmdb' | 'kurdish';
  createdAt: string;
  // Movie metadata
  title: string;
  posterUrl: string;
  releaseDate: string;
  voteAverage: number;
  overview?: string;
  genres?: string[];
}

interface UseFavoritesReturn {
  favorites: FavoriteRecord[];
  favoriteMovieIds: Set<number>;
  isLoading: boolean;
  loadingStates: Map<number, boolean>;
  error: string | null;
  addToFavorites: (movieId: number, movieType: 'tmdb' | 'kurdish', movieData?: any) => Promise<void>;
  removeFromFavorites: (movieId: number, movieType: 'tmdb' | 'kurdish') => Promise<void>;
  isMovieFavorited: (movieId: number) => boolean;
  isLoadingMovie: (movieId: number) => boolean;
  refreshFavorites: () => Promise<void>;
  refetch: () => Promise<void>;
}

const STORAGE_KEY = 'flkrd_favorites';

export const useFavorites = (): UseFavoritesReturn => {
  const { data: session, isPending } = useSession();
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<Map<number, boolean>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // Memoized favorite movie IDs set for O(1) lookups
  const favoriteMovieIds = useMemo(() => {
    return new Set(favorites.map(fav => fav.movieId));
  }, [favorites]);

  // Helper to manage localStorage fallback
  const getLocalStorageFavorites = useCallback((): FavoriteRecord[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const setLocalStorageFavorites = useCallback((favs: FavoriteRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    } catch (error) {
      console.warn('Failed to save favorites to localStorage:', error);
    }
  }, []);

  // Set loading state for specific movie
  const setMovieLoading = useCallback((movieId: number, loading: boolean) => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      if (loading) {
        newMap.set(movieId, true);
      } else {
        newMap.delete(movieId);
      }
      return newMap;
    });
  }, []);

  // Debounced operation tracker to prevent rapid successive calls
  const operationTimeouts = useMemo(() => new Map<string, NodeJS.Timeout>(), []);

  // Fetch movie details from TMDB API
  const fetchMovieDetails = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish') => {
    try {
      const endpoint = movieType === 'kurdish' 
        ? `/api/kurdish-movies` 
        : `/api/movie/${movieId}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      
      const movieData = await response.json();
      
      // Normalize the data structure
      if (movieType === 'kurdish') {
        // Find the specific movie in Kurdish movies
        const kurdishMovie = Array.isArray(movieData) 
          ? movieData.find((m: any) => m.id === movieId)
          : movieData;
        
        return {
          title: kurdishMovie?.title || `Kurdish Movie ${movieId}`,
          posterUrl: kurdishMovie?.poster_path 
            ? `https://image.tmdb.org/t/p/w500${kurdishMovie.poster_path}`
            : '',
          releaseDate: kurdishMovie?.release_date || '',
          voteAverage: kurdishMovie?.vote_average || 0,
          overview: kurdishMovie?.overview || '',
          genres: kurdishMovie?.genres?.map((g: any) => g.name) || []
        };
      } else {
        // TMDB movie
        return {
          title: movieData.title || `Movie ${movieId}`,
          posterUrl: movieData.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
            : '',
          releaseDate: movieData.release_date || '',
          voteAverage: movieData.vote_average || 0,
          overview: movieData.overview || '',
          genres: movieData.genres?.map((g: any) => g.name) || []
        };
      }
    } catch (error) {
      console.error('Failed to fetch movie details:', error);
      // Return minimal data if fetch fails
      return {
        title: `Movie ${movieId}`,
        posterUrl: '',
        releaseDate: '',
        voteAverage: 0,
        overview: '',
        genres: []
      };
    }
  }, []);

  // Fetch favorites from API
  const fetchFavorites = useCallback(async () => {
    if (!session?.user) return;

    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/user-favorites?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // If data doesn't have movie metadata, fetch it
      const favoritesWithMetadata = await Promise.all(
        data.map(async (fav: any) => {
          if (fav.title && fav.posterUrl) {
            // Already has metadata
            return fav;
          } else {
            // Fetch movie metadata
            const movieDetails = await fetchMovieDetails(fav.movieId, fav.movieType);
            return {
              ...fav,
              ...movieDetails
            };
          }
        })
      );
      
      setFavorites(favoritesWithMetadata);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch favorites';
      setError(errorMessage);
      console.error('Fetch favorites error:', err);
      
      // Fallback to localStorage if authenticated but API fails
      if (session?.user) {
        const localFavs = getLocalStorageFavorites();
        setFavorites(localFavs);
        toast.error('Using offline favorites. Some features may be limited.');
      }
    }
  }, [session?.user, getLocalStorageFavorites, fetchMovieDetails]);

  // Migrate localStorage favorites to database when user logs in
  const migrateFavorites = useCallback(async () => {
    if (!session?.user) return;

    const localFavs = getLocalStorageFavorites();
    if (localFavs.length === 0) return;

    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) return;

      // Add each local favorite to database
      const migrationPromises = localFavs.map(async (fav) => {
        try {
          const response = await fetch('/api/user-favorites', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              movieId: fav.movieId,
              movieType: fav.movieType,
              title: fav.title,
              posterUrl: fav.posterUrl,
              releaseDate: fav.releaseDate,
              voteAverage: fav.voteAverage,
              overview: fav.overview,
              genres: fav.genres
            }),
          });

          if (response.status === 409) {
            // Already exists, ignore
            return;
          }

          if (!response.ok) {
            throw new Error(`Failed to migrate favorite ${fav.movieId}`);
          }
        } catch (error) {
          console.warn(`Failed to migrate favorite ${fav.movieId}:`, error);
        }
      });

      await Promise.all(migrationPromises);
      
      // Clear localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY);
      
      // Refresh favorites to get updated data
      await fetchFavorites();
      
      toast.success('Favorites synced successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }, [session?.user, getLocalStorageFavorites, fetchFavorites]);

  // Initial load and migration
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      
      if (isPending) {
        return; // Wait for session to load
      }

      if (session?.user) {
        // User is authenticated - fetch from API and migrate if needed
        await Promise.all([fetchFavorites(), migrateFavorites()]);
      } else {
        // User not authenticated - use localStorage
        const localFavs = getLocalStorageFavorites();
        setFavorites(localFavs);
        setError(null);
      }
      
      setIsLoading(false);
    };

    loadFavorites();
  }, [session?.user, isPending, fetchFavorites, migrateFavorites, getLocalStorageFavorites]);

  // Add to favorites
  const addToFavorites = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish', movieData?: any) => {
    // Debounce rapid operations
    const operationKey = `add_${movieId}_${movieType}`;
    if (operationTimeouts.has(operationKey)) {
      clearTimeout(operationTimeouts.get(operationKey)!);
    }

    const timeoutId = setTimeout(async () => {
      operationTimeouts.delete(operationKey);

      // Prevent duplicate operations
      if (loadingStates.has(movieId) || favoriteMovieIds.has(movieId)) {
        return;
      }

      setMovieLoading(movieId, true);

      try {
        // Get or fetch movie details
        let movieDetails;
        if (movieData) {
          movieDetails = {
            title: movieData.title || movieData.name || `Movie ${movieId}`,
            posterUrl: movieData.poster_path 
              ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
              : movieData.posterUrl || '',
            releaseDate: movieData.release_date || movieData.releaseDate || '',
            voteAverage: movieData.vote_average || movieData.voteAverage || 0,
            overview: movieData.overview || '',
            genres: movieData.genres?.map((g: any) => typeof g === 'string' ? g : g.name) || []
          };
        } else {
          movieDetails = await fetchMovieDetails(movieId, movieType);
        }

        const newFavorite: FavoriteRecord = {
          id: Date.now(), // Temporary ID for optimistic update
          userId: session?.user?.id || 'local',
          movieId,
          movieType,
          createdAt: new Date().toISOString(),
          ...movieDetails
        };

        // Optimistic update
        setFavorites(prev => [newFavorite, ...prev]);

        if (session?.user) {
          // User authenticated - use API
          const token = localStorage.getItem("bearer_token");
          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch('/api/user-favorites', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              movieId,
              movieType,
              ...movieDetails
            }),
          });

          if (response.status === 401) {
            throw new Error('Authentication required');
          }

          if (response.status === 409) {
            toast.info('Movie is already in your favorites');
            return;
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const savedFavorite = await response.json();
          
          // Update with real data from server
          setFavorites(prev => prev.map(fav => 
            fav.movieId === movieId && fav.movieType === movieType 
              ? savedFavorite 
              : fav
          ));

          toast.success('Added to favorites!');
        } else {
          // User not authenticated - use localStorage
          const currentFavs = getLocalStorageFavorites();
          const updatedFavs = [newFavorite, ...currentFavs];
          setLocalStorageFavorites(updatedFavs);
          toast.success('Added to favorites! Sign in to sync across devices.');
        }

        setError(null);
        
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('favorites-updated'));
      } catch (err) {
        // Revert optimistic update
        setFavorites(prev => prev.filter(fav => 
          !(fav.movieId === movieId && fav.movieType === movieType)
        ));

        const errorMessage = err instanceof Error ? err.message : 'Failed to add favorite';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Add favorite error:', err);
      } finally {
        setMovieLoading(movieId, false);
      }
    }, 100);

    operationTimeouts.set(operationKey, timeoutId);
  }, [session?.user, loadingStates, favoriteMovieIds, setMovieLoading, getLocalStorageFavorites, setLocalStorageFavorites, operationTimeouts, fetchMovieDetails]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (movieId: number, movieType: 'tmdb' | 'kurdish') => {
    // Debounce rapid operations
    const operationKey = `remove_${movieId}_${movieType}`;
    if (operationTimeouts.has(operationKey)) {
      clearTimeout(operationTimeouts.get(operationKey)!);
    }

    const timeoutId = setTimeout(async () => {
      operationTimeouts.delete(operationKey);

      // Prevent duplicate operations
      if (loadingStates.has(movieId) || !favoriteMovieIds.has(movieId)) {
        return;
      }

      setMovieLoading(movieId, true);

      try {
        const favoriteToRemove = favorites.find(fav => 
          fav.movieId === movieId && fav.movieType === movieType
        );

        if (!favoriteToRemove) {
          toast.info('Movie is not in favorites');
          return;
        }

        // Optimistic update
        const previousFavorites = favorites;
        setFavorites(prev => prev.filter(fav => 
          !(fav.movieId === movieId && fav.movieType === movieType)
        ));

        if (session?.user) {
          // User authenticated - use API
          const token = localStorage.getItem("bearer_token");
          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch(`/api/user-favorites?id=${favoriteToRemove.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.status === 401) {
            throw new Error('Authentication required');
          }

          if (response.status === 404) {
            toast.info('Favorite not found');
            return;
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          toast.success('Removed from favorites!');
        } else {
          // User not authenticated - use localStorage
          const currentFavs = getLocalStorageFavorites();
          const updatedFavs = currentFavs.filter(fav => 
            !(fav.movieId === movieId && fav.movieType === movieType)
          );
          setLocalStorageFavorites(updatedFavs);
          toast.success('Removed from favorites!');
        }

        setError(null);
        
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('favorites-updated'));
      } catch (err) {
        // Revert optimistic update
        setFavorites(favorites);

        const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorite';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Remove favorite error:', err);
      } finally {
        setMovieLoading(movieId, false);
      }
    }, 100);

    operationTimeouts.set(operationKey, timeoutId);
  }, [session?.user, loadingStates, favoriteMovieIds, favorites, setMovieLoading, getLocalStorageFavorites, setLocalStorageFavorites, operationTimeouts]);

  // Check if movie is favorited
  const isMovieFavorited = useCallback((movieId: number): boolean => {
    return favoriteMovieIds.has(movieId);
  }, [favoriteMovieIds]);

  // Check if movie operation is loading
  const isLoadingMovie = useCallback((movieId: number): boolean => {
    return loadingStates.has(movieId);
  }, [loadingStates]);

  // Refresh favorites
  const refreshFavorites = useCallback(async () => {
    if (session?.user) {
      await fetchFavorites();
    } else {
      const localFavs = getLocalStorageFavorites();
      setFavorites(localFavs);
    }
  }, [session?.user, fetchFavorites, getLocalStorageFavorites]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      operationTimeouts.forEach(timeout => clearTimeout(timeout));
      operationTimeouts.clear();
    };
  }, [operationTimeouts]);

  return {
    favorites,
    favoriteMovieIds,
    isLoading,
    loadingStates,
    error,
    addToFavorites,
    removeFromFavorites,
    isMovieFavorited,
    isLoadingMovie,
    refreshFavorites,
    refetch: refreshFavorites,
  };
};