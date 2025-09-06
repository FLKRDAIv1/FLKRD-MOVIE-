"use client";

import { useContinueWatching as useBaseContinueWatching } from './useContinueWatching';

interface TVEpisode {
  episodeId: number;
  episodeNumber: number;
  name: string;
  overview: string;
  still_path?: string;
  runtime?: number;
}

interface TVSeason {
  seasonId: number;
  seasonNumber: number;
  name: string;
  episode_count: number;
  poster_path?: string;
  episodes?: TVEpisode[];
}

interface TVShow {
  id: number;
  name: string;
  poster_path?: string;
  backdrop_path?: string;
  overview: string;
  first_air_date: string;
  seasons?: TVSeason[];
}

interface TVProgress {
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
  progress: number;
  timestamp: number;
  episodeId?: number;
  seasonId?: number;
}

interface ContinueWatchingItem {
  id: number;
  type: 'tv';
  currentEpisode?: {
    seasonNumber: number;
    episodeNumber: number;
  };
}

interface UseContinueWatchingReturn {
  continueWatching: ContinueWatchingItem[];
  addToContinueWatching: (
    showId: number,
    type: 'tv',
    episodeData: { seasonNumber: number; episodeNumber: number }
  ) => void;
  updateProgress: (showId: number, progress: number) => void;
  removeFromContinueWatching: (showId: number) => void;
}

export const useContinueWatching = (): UseContinueWatchingReturn => {
  const {
    continueWatching: baseContinueWatching,
    saveProgress,
    removeFromContinueWatching: removeBase,
    markAsCompleted
  } = useBaseContinueWatching();

  // Convert base continue watching to TV format
  const continueWatching: ContinueWatchingItem[] = baseContinueWatching.map(item => ({
    id: item.movieId,
    type: 'tv' as const,
    currentEpisode: {
      seasonNumber: 1, // Default values
      episodeNumber: 1
    }
  }));

  const addToContinueWatching = (
    showId: number,
    type: 'tv',
    episodeData: { seasonNumber: number; episodeNumber: number }
  ) => {
    // Use base implementation - will save to database if user is logged in
    saveProgress(showId, 0, 100, `S${episodeData.seasonNumber}E${episodeData.episodeNumber}`, undefined);
  };

  const updateProgress = (showId: number, progress: number) => {
    saveProgress(showId, progress, 100, undefined, undefined);
  };

  const removeFromContinueWatching = (showId: number) => {
    removeBase(showId, 'tmdb');
  };

  return {
    continueWatching,
    addToContinueWatching,
    updateProgress,
    removeFromContinueWatching
  };
};