"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Image from 'next/image';
import { useFavorites } from '@/hooks/useFavorites';
import { useSession } from '@/lib/auth-client';
import { 
  Watch, 
  CloudCheck, 
  CloudOff, 
  FolderSync, 
  CalendarSync,
  ArrowBigDownDash,
  ListVideo,
  CloudUpload,
  CloudDownload,
  CloudAlert,
  Clapperboard,
  HardDriveUpload,
  MonitorUp,
  Heart,
  Star,
  Play
} from "lucide-react";

interface WatchlistSectionProps {
  className?: string;
  onMovieSelect?: (movieId: number) => void;
}

interface SyncStatus {
  lastSync?: string;
  isOnline: boolean;
  isAuthenticated: boolean;
  isSyncing: boolean;
  conflicts: string[];
  queuedOperations: number;
}

export default function WatchlistSection({ className, onMovieSelect }: WatchlistSectionProps) {
  const { data: session } = useSession();
  const { favorites, isLoading, addToFavorites, removeFromFavorites, refetch } = useFavorites();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isAuthenticated: !!session?.user,
    isSyncing: false,
    conflicts: [],
    queuedOperations: 0
  });
  const [sortBy, setSortBy] = useState<"dateAdded" | "title" | "year" | "rating">("dateAdded");
  const [showWatched, setShowWatched] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [checkingProviders, setCheckingProviders] = useState<Set<number>>(new Set());

  // Update auth status when session changes
  useEffect(() => {
    setSyncStatus(prev => ({ 
      ...prev, 
      isAuthenticated: !!session?.user,
      lastSync: session?.user ? new Date().toISOString() : undefined
    }));
  }, [session?.user]);

  // Setup online listener
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const updateOnlineStatus = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };
    
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Listen for sync events
  useEffect(() => {
    const handleSyncRequested = () => {
      if (session?.user) {
        refetch();
        setSyncStatus(prev => ({ 
          ...prev, 
          lastSync: new Date().toISOString(),
          queuedOperations: 0 
        }));
      }
    };

    window.addEventListener('sync-requested', handleSyncRequested);
    window.addEventListener('favorites-sync-requested', handleSyncRequested);
    
    return () => {
      window.removeEventListener('sync-requested', handleSyncRequested);
      window.removeEventListener('favorites-sync-requested', handleSyncRequested);
    };
  }, [session?.user, refetch]);

  const handleRemoveItem = useCallback(async (movieId: number) => {
    try {
      await removeFromFavorites(movieId, 'tmdb');
      setSelectedItems(prev => {
        const updated = new Set(prev);
        updated.delete(movieId);
        return updated;
      });
      toast.success("Removed from favorites");
    } catch (error) {
      toast.error("Failed to remove from favorites");
    }
  }, [removeFromFavorites]);

  const handleToggleWatched = useCallback(async (movieId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/movies/mark-watched', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          movieId,
        }),
      });

      if (response.ok) {
        toast.success("Watch status updated");
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('movie-watched', { detail: { movieId } }));
      } else {
        toast.error("Failed to update watch status");
      }
    } catch (error) {
      toast.error("Failed to update watch status");
    }
  }, [session?.user?.id]);

  const handleCheckProviders = useCallback(async (movieId: number) => {
    setCheckingProviders(prev => new Set(prev).add(movieId));
    
    try {
      const response = await fetch(`/api/streaming/${movieId}`);
      if (response.ok) {
        const data = await response.json();
        toast.success(`Available on: ${data.providers?.join(', ') || 'No providers found'}`);
      } else {
        toast.error("Failed to check provider availability");
      }
    } catch (error) {
      toast.error("Failed to check provider availability");
    } finally {
      setCheckingProviders(prev => {
        const updated = new Set(prev);
        updated.delete(movieId);
        return updated;
      });
    }
  }, []);

  const handleBulkMarkWatched = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const token = localStorage.getItem('bearer_token');
      const promises = Array.from(selectedItems).map(movieId =>
        fetch('/api/movies/mark-watched', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session.user.id,
            movieId,
          }),
        })
      );
      
      await Promise.all(promises);
      setSelectedItems(new Set());
      toast.success(`Marked ${selectedItems.size} items as watched`);
      
      // Dispatch events for each watched movie
      selectedItems.forEach(movieId => {
        window.dispatchEvent(new CustomEvent('movie-watched', { detail: { movieId } }));
      });
    } catch (error) {
      toast.error("Failed to mark items as watched");
    }
  }, [selectedItems, session?.user?.id]);

  const handleExportList = useCallback(() => {
    const exportData = {
      favorites: favorites,
      exportDate: new Date().toISOString(),
      version: "1.0",
      user: session?.user?.id || 'anonymous'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flkrd-favorites-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Favorites list exported successfully");
  }, [favorites, session?.user?.id]);

  const performSync = useCallback(async () => {
    if (!session?.user || !syncStatus.isOnline) return;
    
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      await refetch();
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date().toISOString(),
        queuedOperations: 0
      }));
      
      toast.success("Favorites synced successfully");
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      toast.error("Failed to sync favorites");
    }
  }, [session?.user, syncStatus.isOnline, refetch]);

  const getSyncStatusIcon = () => {
    if (syncStatus.isSyncing || isLoading) return <FolderSync className="w-4 h-4 animate-spin" />;
    if (!syncStatus.isOnline) return <CloudOff className="w-4 h-4 text-destructive" />;
    if (!syncStatus.isAuthenticated) return <CloudAlert className="w-4 h-4 text-muted-foreground" />;
    if (syncStatus.conflicts.length > 0) return <CloudAlert className="w-4 h-4 text-yellow-500" />;
    return <CloudCheck className="w-4 h-4 text-green-500" />;
  };

  const getSyncStatusText = () => {
    if (syncStatus.isSyncing || isLoading) return "Syncing...";
    if (!syncStatus.isOnline) return "Offline";
    if (!syncStatus.isAuthenticated) return "Sign in to sync favorites";
    if (syncStatus.conflicts.length > 0) return "Conflicts detected";
    if (syncStatus.lastSync) {
      const lastSync = new Date(syncStatus.lastSync);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return "Just synced";
      if (diffMinutes < 60) return `Synced ${diffMinutes}m ago`;
      return `Synced ${Math.floor(diffMinutes / 60)}h ago`;
    }
    return "Ready to sync";
  };

  const sortedFavorites = [...favorites]
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "year":
          return (b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0) - 
                 (a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0);
        case "rating":
          return (b.voteAverage || 0) - (a.voteAverage || 0);
        case "dateAdded":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Show empty state for unauthenticated users
  if (!session?.user) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] px-4 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Sign in to view your favorites</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Create an account or sign in to save your favorite movies and TV shows across all your devices
        </p>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          Sign In
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] px-4 ${className}`}>
        <FolderSync className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading your favorites...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] px-4 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Your favorites list is empty</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Start adding movies and TV shows to your favorites by exploring trending content
        </p>
        <Button 
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => window.dispatchEvent(new CustomEvent('navigate-home'))}
        >
          <Clapperboard className="w-4 h-4 mr-2" />
          Browse Movies
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with sync status and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">My Favorites</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getSyncStatusIcon()}
            <span>{getSyncStatusText()}</span>
            {syncStatus.queuedOperations > 0 && (
              <Badge variant="secondary" className="text-xs">
                {syncStatus.queuedOperations} queued
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort by {sortBy === 'dateAdded' ? 'Date Added' : sortBy === 'voteAverage' ? 'Rating' : sortBy}
                <ArrowBigDownDash className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("dateAdded")}>
                Date added
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("title")}>
                Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("year")}>
                Year
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("rating")}>
                Rating
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={performSync}
            disabled={syncStatus.isSyncing || !syncStatus.isAuthenticated || !syncStatus.isOnline}
          >
            {syncStatus.isSyncing ? <FolderSync className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {selectedItems.size > 0 && (
        <Card className="p-4 bg-accent/10 border-accent/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkMarkWatched}
              >
                <Watch className="w-4 h-4 mr-2" />
                Mark watched
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportList}
              >
                <HardDriveUpload className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedItems(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Favorites items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {sortedFavorites.map((movie) => (
          <Card 
            key={movie.id} 
            className="group bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-all duration-200 overflow-hidden cursor-pointer"
            onClick={() => onMovieSelect?.(movie.movieId)}
          >
            <div className="relative aspect-[2/3]">
              <Image
                src={movie.posterUrl || `https://image.tmdb.org/t/p/w500/placeholder.jpg`}
                alt={`${movie.title} poster`}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAAAAAABAgMABAUGIWGBkaGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovieSelect?.(movie.movieId);
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="bg-red-500/80 hover:bg-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(movie.movieId);
                    }}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </Button>
                </div>
              </div>
              
              {/* Rating badge */}
              {movie.voteAverage && movie.voteAverage > 0 && (
                <Badge className="absolute top-2 right-2 bg-black/80 text-white border-0">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  {movie.voteAverage.toFixed(1)}
                </Badge>
              )}
              
              {/* Selection checkbox */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="checkbox"
                  checked={selectedItems.has(movie.movieId)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const updated = new Set(selectedItems);
                    if (e.target.checked) {
                      updated.add(movie.movieId);
                    } else {
                      updated.delete(movie.movieId);
                    }
                    setSelectedItems(updated);
                  }}
                  className="rounded border-border bg-black/50"
                />
              </div>
            </div>
            
            <div className="p-3">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">{movie.title}</h3>
              {movie.releaseDate && (
                <p className="text-xs text-muted-foreground">
                  {new Date(movie.releaseDate).getFullYear()}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}