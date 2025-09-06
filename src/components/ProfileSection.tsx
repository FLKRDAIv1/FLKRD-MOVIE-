"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Trophy, 
  Clock, 
  Film, 
  Play, 
  Calendar,
  TrendingUp,
  Star,
  BarChart3,
  History,
  Settings,
  LogOut,
  Loader2,
  Eye,
  Pause,
  Camera,
  Upload,
  X,
  Check,
  AlertCircle,
  Edit3,
  Award,
  Target,
  Zap,
  Crown,
  Medal,
  Gift,
  Flame,
  ChevronRight,
  PieChart,
  Activity
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UserStats {
  totalMoviesWatched: number;
  totalWatchTime: number;
  favoriteGenre: string;
  totalWatchTimeFormatted: string;
  averageRating: number | null;
  completionRate: number;
}

interface WatchedMovie {
  movieId: number;
  movieTitle: string;
  moviePoster: string;
  watchedAt: string;
  rating: number | null;
}

interface ContinueWatchingMovie {
  movieId: number;
  movieTitle: string;
  moviePoster: string;
  currentTime: number;
  totalDuration: number;
  progressPercentage: number;
  lastWatchedAt: string;
  completed: boolean;
}

interface Achievement {
  id: number;
  userId: string;
  achievementType: string;
  title: string;
  description: string;
  iconType: string;
  progress: number;
  target: number;
  isCompleted: boolean;
  unlockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MovieAnalytics {
  totalMovies: number;
  totalViews: number;
  totalReviews: number;
  averageRating: number;
  popularGenres: { genre: string; count: number }[];
  monthlyStats: { month: string; views: number; reviews: number }[];
  topMovies: { 
    movieId: number; 
    movieTitle: string; 
    views: number; 
    reviews: number; 
    averageRating: number; 
  }[];
}

interface ProfileSectionProps {
  className?: string;
}

export default function ProfileSection({ className = "" }: ProfileSectionProps) {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingMovie[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [movieAnalytics, setMovieAnalytics] = useState<MovieAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'watched' | 'continue' | 'achievements' | 'analytics'>('overview');

  // Profile image state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [loadingProfileImage, setLoadingProfileImage] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Load profile image
  useEffect(() => {
    const loadProfileImage = async () => {
      if (!session?.user?.id) return;

      try {
        setLoadingProfileImage(true);
        const token = localStorage.getItem("bearer_token");
        if (!token) return;

        const profileResponse = await fetch('/api/user/profile-image', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.profileImage) {
            setProfileImage(profileData.profileImage);
          }
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
      } finally {
        setLoadingProfileImage(false);
      }
    };

    loadProfileImage();
  }, [session?.user?.id]);

  // Load user data with enhanced analytics and achievements
  useEffect(() => {
    const loadUserData = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("bearer_token");
        
        // Fetch user stats
        const statsResponse = await fetch(`/api/watched-movies?userId=${session.user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch continue watching
        const continueResponse = await fetch(`/api/movies/continue-watching/${session.user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch achievements
        const achievementsResponse = await fetch('/api/user-achievements', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch movie analytics
        const analyticsResponse = await fetch('/api/movie-analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          if (statsData.basicStats) {
            setUserStats({
              totalMoviesWatched: statsData.basicStats.totalMoviesWatched || 0,
              totalWatchTime: statsData.basicStats.totalWatchTime || 0,
              favoriteGenre: statsData.basicStats.favoriteGenre || 'Not Set',
              totalWatchTimeFormatted: statsData.basicStats.totalWatchTimeFormatted || '0m',
              averageRating: statsData.basicStats.averageRating,
              completionRate: statsData.basicStats.completionRate || 0
            });
            setWatchedMovies(statsData.recentMovies || []);
          } else if (Array.isArray(statsData)) {
            setWatchedMovies(statsData);
            
            const totalMovies = statsData.length;
            const avgRating = statsData.filter((m: any) => m.rating)
              .reduce((sum: number, m: any) => sum + m.rating, 0) / 
              Math.max(statsData.filter((m: any) => m.rating).length, 1);
            
            setUserStats({
              totalMoviesWatched: totalMovies,
              totalWatchTime: 0,
              favoriteGenre: 'Not Set',
              totalWatchTimeFormatted: '0m',
              averageRating: avgRating || null,
              completionRate: 0
            });
          }
        }

        if (continueResponse.ok) {
          const continueData = await continueResponse.json();
          const transformedContinue = continueData.map((item: any) => ({
            id: item.id || item.movieId,
            movieId: item.movieId,
            movieTitle: item.movieTitle || `Movie ${item.movieId}`,
            moviePoster: item.moviePoster || '',
            currentTime: item.currentTime || 0,
            totalDuration: item.totalDuration || 0,
            progressPercentage: Math.round(item.progressPercentage || 0),
            lastWatchedAt: item.lastWatchedAt || new Date().toISOString(),
            completed: item.completed || false
          }));
          setContinueWatching(transformedContinue);
        }

        // Load achievements
        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json();
          setAchievements(achievementsData);
        }

        // Load movie analytics
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setMovieAnalytics(analyticsData);
        }

      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Listen for movie watched events
    const handleMovieWatched = () => loadUserData();
    window.addEventListener('movie-watched', handleMovieWatched);
    
    return () => {
      window.removeEventListener('movie-watched', handleMovieWatched);
    };
  }, [session?.user?.id]);

  const handleImageUpload = async () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    try {
      setImageLoading(true);
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        toast.error("Please log in to update profile image");
        return;
      }

      const method = profileImage ? 'PUT' : 'POST';
      const response = await fetch('/api/user/profile-image', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: imageUrl.trim() })
      });

      if (response.ok) {
        const result = await response.json();
        setProfileImage(result.imageUrl);
        setShowImageModal(false);
        setImageUrl('');
        toast.success("Profile image updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update profile image");
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      toast.error("Failed to update profile image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleImageRemove = async () => {
    if (!profileImage) return;

    try {
      setImageLoading(true);
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        toast.error("Please log in to remove profile image");
        return;
      }

      const response = await fetch('/api/user/profile-image', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProfileImage(null);
        setShowImageModal(false);
        toast.success("Profile image removed successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to remove profile image");
      }
    } catch (error) {
      console.error('Error removing profile image:', error);
      toast.error("Failed to remove profile image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await authClient.signOut();
      if (error?.code) {
        toast.error(error.code);
      } else {
        localStorage.removeItem("bearer_token");
        refetch();
        toast.success("Signed out successfully");
        router.push("/");
      }
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Enhanced achievement icon mapping
  const getAchievementIcon = (iconType: string) => {
    const iconMap = {
      trophy: Trophy,
      star: Star,
      crown: Crown,
      medal: Medal,
      award: Award,
      target: Target,
      zap: Zap,
      gift: Gift,
      flame: Flame,
      film: Film,
      play: Play,
      clock: Clock
    };
    return iconMap[iconType as keyof typeof iconMap] || Trophy;
  };

  if (isPending || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'watched', label: 'Watched Movies', icon: Trophy },
    { key: 'continue', label: 'Continue Watching', icon: Play },
    { key: 'achievements', label: 'Achievements', icon: Award },
    { key: 'analytics', label: 'Analytics', icon: PieChart }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="glass-card p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Movies Watched</h3>
              <p className="text-2xl font-bold text-yellow-500">
                {userStats?.totalMoviesWatched || 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Total movies completed
          </p>
        </motion.div>

        <motion.div
          className="glass-card p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Watch Time</h3>
              <p className="text-2xl font-bold text-blue-500">
                {userStats?.totalWatchTimeFormatted || '0m'}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Total time spent watching
          </p>
        </motion.div>

        <motion.div
          className="glass-card p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Film className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Favorite Genre</h3>
              <p className="text-lg font-bold text-purple-500">
                {userStats?.favoriteGenre || 'Not Set'}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Most watched genre
          </p>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        className="glass-card p-6 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Activity
        </h3>

        {watchedMovies.length === 0 && continueWatching.length === 0 ? (
          <div className="text-center py-12">
            <Film className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No movie activity yet</p>
            <p className="text-gray-500 text-sm">Start watching movies to see your activity here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recent Watched Movies */}
            {watchedMovies.slice(0, 3).map((movie) => (
              <div key={`watched-${movie.movieId}`} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="relative w-16 h-24 flex-shrink-0">
                  {movie.moviePoster ? (
                    <Image
                      src={movie.moviePoster.startsWith('http') ? movie.moviePoster : `https://image.tmdb.org/t/p/w200${movie.moviePoster}`}
                      alt={movie.movieTitle}
                      fill
                      sizes="64px"
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
                      <Film className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{movie.movieTitle}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-green-500" />
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(movie.watchedAt)}</span>
                    </div>
                    {movie.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{movie.rating}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Watching */}
            {continueWatching.slice(0, 2).map((movie) => (
              <div key={`continue-${movie.movieId}`} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="relative w-16 h-24 flex-shrink-0">
                  {movie.moviePoster ? (
                    <Image
                      src={movie.moviePoster.startsWith('http') ? movie.moviePoster : `https://image.tmdb.org/t/p/w200${movie.moviePoster}`}
                      alt={movie.movieTitle}
                      fill
                      sizes="64px"
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
                      <Film className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  {/* Progress overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 rounded-b-lg">
                    <div 
                      className="h-full bg-primary rounded-b-lg transition-all duration-300"
                      style={{ width: `${movie.progressPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{movie.movieTitle}</h4>
                  
                  <div className="space-y-2">
                    {/* Progress bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${movie.progressPercentage}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {Math.round(movie.progressPercentage)}% completed
                      </span>
                      <span className="text-gray-400">
                        {formatDate(movie.lastWatchedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderWatchedMovies = () => (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Watched Movies ({watchedMovies.length})
        </h3>
      </div>

      {watchedMovies.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No movies watched yet</p>
          <p className="text-gray-500 text-sm">Complete watching movies to build your collection!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {watchedMovies.map((movie) => (
            <motion.div
              key={movie.movieId}
              className="group relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800">
                {movie.moviePoster ? (
                  <Image
                    src={movie.moviePoster.startsWith('http') ? movie.moviePoster : `https://image.tmdb.org/t/p/w500${movie.moviePoster}`}
                    alt={movie.movieTitle}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="h-12 w-12 text-gray-500" />
                  </div>
                )}
                
                {/* Watched indicator */}
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                  <Trophy className="h-3 w-3" />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-3 w-full">
                    <h4 className="font-medium text-white text-sm mb-1 line-clamp-2">
                      {movie.movieTitle}
                    </h4>
                    <p className="text-xs text-gray-300">
                      {formatDate(movie.watchedAt)}
                    </p>
                    {movie.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-white">{movie.rating}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderContinueWatching = () => (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Continue Watching ({continueWatching.length})
        </h3>
      </div>

      {continueWatching.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No movies in progress</p>
          <p className="text-gray-500 text-sm">Start watching movies to see them here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {continueWatching.map((movie) => (
            <motion.div
              key={movie.movieId}
              className="glass-card p-4 rounded-xl hover:bg-white/10 transition-colors group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-30 flex-shrink-0">
                  {movie.moviePoster ? (
                    <Image
                      src={movie.moviePoster.startsWith('http') ? movie.moviePoster : `https://image.tmdb.org/t/p/w200${movie.moviePoster}`}
                      alt={movie.movieTitle}
                      fill
                      sizes="80px"
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
                      <Film className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-2 group-hover:text-primary transition-colors">
                    {movie.movieTitle}
                  </h4>
                  
                  <div className="space-y-2">
                    {/* Progress bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${movie.progressPercentage}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {Math.round(movie.progressPercentage)}% completed
                      </span>
                      <span className="text-gray-400">
                        {formatDate(movie.lastWatchedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  // Enhanced achievements section
  const renderAchievementsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Achievements ({achievements.filter(a => a.isCompleted).length}/{achievements.length})
        </h3>
      </div>

      {achievements.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No achievements yet</p>
          <p className="text-gray-500 text-sm">Start watching movies to unlock achievements!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const IconComponent = getAchievementIcon(achievement.iconType);
            const progressPercentage = Math.min((achievement.progress / achievement.target) * 100, 100);
            
            return (
              <motion.div
                key={achievement.id}
                className={`glass-panel p-6 rounded-xl transition-all duration-300 ${
                  achievement.isCompleted 
                    ? 'border border-yellow-500/30 bg-yellow-500/5' 
                    : 'hover:bg-white/5'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    achievement.isCompleted 
                      ? 'bg-yellow-500/20 text-yellow-500' 
                      : 'bg-gray-600/20 text-gray-400'
                  }`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`font-semibold ${
                        achievement.isCompleted ? 'text-yellow-500' : 'text-white'
                      }`}>
                        {achievement.title}
                      </h4>
                      {achievement.isCompleted && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3">
                      {achievement.description}
                    </p>
                    
                    {!achievement.isCompleted && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">
                            Progress: {achievement.progress}/{achievement.target}
                          </span>
                          <span className="text-primary font-medium">
                            {Math.round(progressPercentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {achievement.isCompleted && achievement.unlockedAt && (
                      <p className="text-xs text-green-400 font-medium">
                        Unlocked {formatDate(achievement.unlockedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  // Enhanced analytics section  
  const renderAnalyticsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Movie Analytics
        </h3>
      </div>

      {!movieAnalytics ? (
        <div className="glass-panel p-12 rounded-xl text-center">
          <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No analytics data</p>
          <p className="text-gray-500 text-sm">Watch more movies to see detailed analytics!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl text-center">
              <Film className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{movieAnalytics.totalMovies || 0}</p>
              <p className="text-sm text-gray-400">Total Movies</p>
            </div>
            
            <div className="glass-panel p-4 rounded-xl text-center">
              <Eye className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{movieAnalytics.totalViews || 0}</p>
              <p className="text-sm text-gray-400">Total Views</p>
            </div>
            
            <div className="glass-panel p-4 rounded-xl text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{movieAnalytics.totalReviews || 0}</p>
              <p className="text-sm text-gray-400">Reviews Written</p>
            </div>
            
            <div className="glass-panel p-4 rounded-xl text-center">
              <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {movieAnalytics.averageRating != null ? movieAnalytics.averageRating.toFixed(1) : '0.0'}
              </p>
              <p className="text-sm text-gray-400">Avg Rating</p>
            </div>
          </div>

          {/* Popular Genres */}
          {movieAnalytics.popularGenres && movieAnalytics.popularGenres.length > 0 && (
            <div className="glass-panel p-6 rounded-xl">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Popular Genres
              </h4>
              <div className="space-y-3">
                {movieAnalytics.popularGenres.slice(0, 5).map((genre, index) => {
                  const maxCount = Math.max(...movieAnalytics.popularGenres.map(g => g.count));
                  const percentage = maxCount > 0 ? (genre.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={genre.genre} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-gray-300 font-medium">
                        {genre.genre}
                      </div>
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-400 text-right">
                        {genre.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Movies */}
          {movieAnalytics.topMovies && movieAnalytics.topMovies.length > 0 && (
            <div className="glass-panel p-6 rounded-xl">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Most Watched Movies
              </h4>
              <div className="space-y-4">
                {movieAnalytics.topMovies.slice(0, 5).map((movie, index) => (
                  <div key={movie.movieId} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-white">{movie.movieTitle}</h5>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{movie.views || 0} views</span>
                        <span>{movie.reviews || 0} reviews</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{movie.averageRating != null ? movie.averageRating.toFixed(1) : '0.0'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className={`min-h-screen pb-32 lg:pb-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Enhanced Profile Image Section */}
              <div className="relative group">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                  {loadingProfileImage ? (
                    <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
                  ) : profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-primary-foreground" />
                  )}
                </div>
                
                {/* Edit overlay */}
                <button
                  onClick={() => setShowImageModal(true)}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {session.user.name || 'Movie Enthusiast'}
                </h1>
                <p className="text-gray-400">{session.user.email}</p>
                {userStats && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-white font-medium">{userStats.totalMoviesWatched}</span>
                      <span className="text-gray-400">movies</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-white font-medium">{userStats.totalWatchTimeFormatted}</span>
                      <span className="text-gray-400">watched</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Award className="h-4 w-4 text-green-500" />
                      <span className="text-white font-medium">{achievements.filter(a => a.isCompleted).length}</span>
                      <span className="text-gray-400">achievements</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'watched' && renderWatchedMovies()}
          {activeTab === 'continue' && renderContinueWatching()}
          {activeTab === 'achievements' && renderAchievementsSection()}
          {activeTab === 'analytics' && renderAnalyticsSection()}
        </AnimatePresence>

        {/* Profile Image Modal */}
        <AnimatePresence>
          {showImageModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.target === e.currentTarget && setShowImageModal(false)}
            >
              <motion.div
                className="glass-card p-6 rounded-2xl max-w-md w-full mx-4"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Profile Image</h3>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Current Image Preview */}
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="Profile"
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-primary-foreground" />
                    )}
                  </div>
                </div>

                {/* Image URL Input */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full p-3 bg-input text-white rounded-lg border border-border focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Enter a direct URL to your profile image (JPG, PNG, WebP)
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleImageUpload}
                      disabled={imageLoading || !imageUrl.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {imageLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {profileImage ? 'Update' : 'Upload'}
                    </button>

                    {profileImage && (
                      <button
                        onClick={handleImageRemove}
                        disabled={imageLoading}
                        className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Help Text */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-400 font-medium mb-1">Tips for best results:</p>
                        <ul className="text-xs text-blue-300 space-y-1">
                          <li>• Use square images (1:1 aspect ratio)</li>
                          <li>• Minimum size: 200x200 pixels</li>
                          <li>• Supported formats: JPG, PNG, WebP</li>
                          <li>• Use HTTPS URLs for security</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Branding */}
        <motion.div
          className="mt-16 pt-8 border-t border-white/10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-gray-500 mb-2">Your personal movie tracking experience</p>
          <p className="text-xs text-gray-600">
            Created by <span className="text-white font-medium">Zana Faroq</span> • 
            Powered by <span className="text-primary font-medium">FLKRD STUDIO</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}