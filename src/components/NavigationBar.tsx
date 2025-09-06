"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  Bookmark, 
  User, 
  Menu, 
  X, 
  RefreshCw,
  Trophy,
  Clock,
  Film,
  LogOut,
  Settings
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import Image from 'next/image';

interface UserStats {
  totalMoviesWatched: number;
  totalWatchTime: number;
  favoriteGenre: string;
}

interface NavigationBarProps {
  activeRoute: "home" | "search" | "watchlist" | "profile";
  onRouteChange: (route: "home" | "search" | "watchlist" | "profile") => void;
  onSync: () => void;
  watchlistBadgeCount?: number;
  onShowSignIn: () => void;
  onShowSignUp: () => void;
}

export default function NavigationBar({ 
  activeRoute, 
  onRouteChange, 
  onSync,
  watchlistBadgeCount = 0,
  onShowSignIn,
  onShowSignUp
}: NavigationBarProps) {
  const { data: session, isPending, refetch } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Load user stats
  useEffect(() => {
    const loadUserStats = async () => {
      if (!session?.user?.id) return;

      try {
        const token = localStorage.getItem("bearer_token");
        const response = await fetch(`/api/user/stats/${session.user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const stats = await response.json();
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };

    loadUserStats();
    
    // Listen for movie watched events to refresh stats
    const handleMovieWatched = () => loadUserStats();
    window.addEventListener('movie-watched', handleMovieWatched);
    
    return () => {
      window.removeEventListener('movie-watched', handleMovieWatched);
    };
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    try {
      const { error } = await authClient.signOut();
      if (error?.code) {
        toast.error(error.code);
      } else {
        localStorage.removeItem("bearer_token");
        refetch(); // Update session state
        toast.success("Signed out successfully");
      }
    } catch (error) {
      toast.error("Failed to sign out");
    }
    setShowUserMenu(false);
  };

  const navigationItems = [
    {
      key: "home" as const,
      label: "Home",
      icon: Home,
      badge: null,
    },
    {
      key: "search" as const,
      label: "Search",
      icon: Search,
      badge: null,
    },
    {
      key: "watchlist" as const,
      label: "Favorites",
      icon: Bookmark,
      badge: watchlistBadgeCount > 0 ? watchlistBadgeCount : null,
    },
    {
      key: "profile" as const,
      label: "Profile",
      icon: User,
      badge: null,
    },
  ];

  const handleNavClick = (route: "home" | "search" | "watchlist" | "profile") => {
    onRouteChange(route);
    setIsOpen(false);
  };

  // User stats display component
  const UserStatsDisplay = () => {
    if (!session?.user || !userStats) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-3 border-t border-white/10"
      >
        <div className="text-xs text-gray-400 mb-2">Your Stats</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-white">{userStats.totalMoviesWatched}</span>
            <span className="text-gray-400">movies watched</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-white">{Math.round(userStats.totalWatchTime / 3600)}h</span>
            <span className="text-gray-400">total watch time</span>
          </div>
          {userStats.favoriteGenre && (
            <div className="flex items-center gap-2 text-sm">
              <Film className="h-4 w-4 text-purple-500" />
              <span className="text-white">{userStats.favoriteGenre}</span>
              <span className="text-gray-400">favorite genre</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Auth section for mobile menu
  const AuthSection = () => {
    if (isPending) {
      return (
        <div className="px-4 py-3 border-t border-white/10">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      );
    }

    if (!session?.user) {
      return (
        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          <button
            onClick={() => {
              onShowSignIn();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              onShowSignUp();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
          >
            Sign Up
          </button>
        </div>
      );
    }

    return (
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session.user.name || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session.user.email}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => {
              onRouteChange("profile");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            Profile Settings
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Navigation - Left Sidebar */}
      <motion.nav
        className="fixed left-0 top-0 h-full w-28 lg:w-32 bg-black/80 backdrop-blur-xl border-r border-white/10 z-40 hidden lg:flex flex-col"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Enhanced Bigger Logo */}
        <div className="p-6 border-b border-white/10">
          <motion.div
            className="relative w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-2xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg"
              alt="FLKRD Movies"
              fill
              sizes="80px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
          {/* App Name */}
          <motion.div 
            className="text-center mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-lg font-bold text-white tracking-tight">FLKRD</h1>
            <p className="text-xs text-gray-400 font-medium">MOVIES</p>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-8">
          <div className="space-y-4">
            {navigationItems.map((item) => (
              <motion.button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`relative w-full flex flex-col items-center gap-2 p-4 rounded-xl mx-4 transition-all duration-200 group ${
                  activeRoute === item.key
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <item.icon className="w-7 h-7" />
                  {item.badge && (
                    <motion.span
                      className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full min-w-6 h-6 flex items-center justify-center font-bold shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.span>
                  )}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Desktop User Stats & Actions */}
        <div className="p-4 border-t border-white/10 space-y-4">
          {/* Sync Button */}
          <motion.button
            onClick={onSync}
            className="w-full p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Sync Data"
          >
            <RefreshCw className="w-6 h-6 mx-auto group-hover:animate-spin" />
          </motion.button>

          {/* User Stats Badge */}
          {session?.user && userStats && (
            <motion.div
              className="p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-bold text-white">{userStats.totalMoviesWatched}</span>
                </div>
                <div className="text-xs text-gray-400">movies</div>
              </div>
            </motion.div>
          )}

          {/* User Menu */}
          {session?.user && (
            <div className="relative">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full p-3 bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <User className="w-6 h-6 mx-auto text-primary-foreground" />
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="absolute bottom-full left-0 mb-2 w-64 glass-card rounded-lg shadow-xl border border-white/20 overflow-hidden"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{session.user.name}</p>
                          <p className="text-xs text-gray-400">{session.user.email}</p>
                        </div>
                      </div>
                      
                      {userStats && (
                        <div className="space-y-2 mb-4 p-3 bg-white/5 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Movies Watched</span>
                            <span className="text-white font-medium">{userStats.totalMoviesWatched}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Watch Time</span>
                            <span className="text-white font-medium">{Math.round(userStats.totalWatchTime / 3600)}h</span>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Sign In Button for non-authenticated users */}
          {!session?.user && !isPending && (
            <motion.button
              onClick={onShowSignIn}
              className="w-full p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <User className="w-6 h-6 mx-auto" />
            </motion.button>
          )}
        </div>

        {/* Enhanced Branding Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-3 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg"
                alt="FLKRD"
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
            <p className="text-xs text-gray-500 mb-1">Created by</p>
            <p className="text-sm text-white font-bold">Zana Faroq</p>
            <p className="text-xs text-primary font-semibold tracking-wide">FLKRD STUDIO</p>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Enhanced Mobile Header with Bigger Logo */}
        <motion.header
          className="fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-b border-white/10 z-40 flex items-center justify-between px-6"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="relative w-12 h-12 rounded-xl overflow-hidden shadow-xl"
              whileHover={{ scale: 1.05 }}
            >
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg"
                alt="FLKRD Movies"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">FLKRD</h1>
              <p className="text-sm text-gray-400 font-medium -mt-1">MOVIES</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Stats Badge for Mobile */}
            {session?.user && userStats && (
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-bold text-white">{userStats.totalMoviesWatched}</span>
              </motion.div>
            )}

            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="p-3 text-white hover:bg-white/10 rounded-xl transition-colors shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </motion.button>
          </div>
        </motion.header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 z-30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
              <motion.div
                className="absolute top-20 left-0 right-0 bg-black/90 backdrop-blur-xl border-b border-white/10"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Navigation Items */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {navigationItems.map((item) => (
                      <motion.button
                        key={item.key}
                        onClick={() => handleNavClick(item.key)}
                        className={`relative flex items-center gap-3 p-5 rounded-xl transition-all duration-200 ${
                          activeRoute === item.key
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="relative">
                          <item.icon className="w-6 h-6" />
                          {item.badge && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-bold">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Sync Button */}
                  <motion.button
                    onClick={() => {
                      onSync();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <RefreshCw className="w-6 h-6" />
                    <span className="text-sm font-medium">Sync Data</span>
                  </motion.button>
                </div>

                {/* User Stats */}
                <UserStatsDisplay />

                {/* Auth Section */}
                <AuthSection />

                {/* Mobile Branding with Bigger Logo */}
                <div className="px-6 py-4 border-t border-white/10">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                      <Image
                        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/735a2959-da91-4320-9442-c926d9386954/generated_images/modern-3d-metallic-app-icon-for-flkrd-mo-b2e0e91e-20250905082424.jpg"
                        alt="FLKRD"
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">FLKRD MOVIES</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Created by <span className="text-white font-semibold">Zana Faroq</span> • 
                      Powered by <span className="text-primary font-semibold">FLKRD STUDIO</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Click outside to close */}
        {showUserMenu && (
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </div>
    </>
  );
}