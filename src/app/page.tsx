"use client";

import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Toaster } from 'sonner';
import NavigationBar from '@/components/NavigationBar';
import HomeSection from '@/components/HomeSection';
import ProfileSection from '@/components/ProfileSection';
import { LanguageProvider } from '@/lib/language';
import { DetailOverlaySkeleton, MovieCardSkeleton } from '@/components/LoadingComponents';
import { motion } from 'framer-motion';
import { useSession } from '@/lib/auth-client';
import { AuthModal } from '@/components/auth/AuthModal';

// Lazy load heavy components that aren't immediately needed (except ProfileSection)
const DetailOverlay = lazy(() => import('@/components/DetailOverlay'));
const TVDetailOverlay = lazy(() => import('@/components/TVDetailOverlay').then(module => ({ default: module.TVDetailOverlay })));
const WatchlistSection = lazy(() => import('@/components/WatchlistSection'));
const DramaSection = lazy(() => import('@/components/DramaSection'));

// Fallback components for lazy loaded sections
const SectionFallback = () => (
  <div className="min-h-screen p-8">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </div>
  </div>
);

const LoadingSpinner = () => (
  <motion.div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="glass-card p-8 text-center">
      <motion.div 
        className="inline-block h-8 w-8 border-2 border-current border-t-transparent rounded-full mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-muted-foreground">Loading...</p>
      <div className="mt-4 text-xs text-gray-500">
        <p>Powered by <span className="text-primary font-medium">FLKRD STUDIO</span></p>
      </div>
    </div>
  </motion.div>
);

export default function HomePage() {
  const { data: session, refetch } = useSession();
  const [activeRoute, setActiveRoute] = useState<"home" | "search" | "watchlist" | "profile">("home");
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedTVShowId, setSelectedTVShowId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isTVDetailOpen, setIsTVDetailOpen] = useState(false);
  const [familyMode, setFamilyMode] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  // Initialize app state
  useEffect(() => {
    // Check online status
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Load family mode preference
    const savedFamilyMode = localStorage.getItem('familyMode');
    if (savedFamilyMode) {
      setFamilyMode(JSON.parse(savedFamilyMode));
    }

    // Load favorites count for unauthenticated users
    if (!session?.user) {
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        try {
          const favorites = JSON.parse(savedFavorites);
          setFavoritesCount(Array.isArray(favorites) ? favorites.length : 0);
        } catch (error) {
          console.error('Failed to parse favorites:', error);
        }
      }
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [session?.user]);

  // Handle mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update CSS variables for parallax
  useEffect(() => {
    if (backgroundRef.current) {
      backgroundRef.current.style.setProperty('--mouse-x', `${mousePosition.x}%`);
      backgroundRef.current.style.setProperty('--mouse-y', `${mousePosition.y}%`);
      backgroundRef.current.style.setProperty('--scroll-y', `${scrollPosition * 0.5}px`);
    }
  }, [mousePosition, scrollPosition]);

  // Handle route changes with auth check
  const handleRouteChange = (route: "home" | "search" | "watchlist" | "profile") => {
    // Check if user needs to be authenticated for this route
    if (!session?.user && (route === "watchlist" || route === "profile")) {
      setAuthModalTab('signin');
      setIsAuthModalOpen(true);
      return;
    }

    setActiveRoute(route);
    
    // Close detail overlays when changing routes
    if (isDetailOpen) {
      setIsDetailOpen(false);
      setSelectedMovieId(null);
    }
    if (isTVDetailOpen) {
      setIsTVDetailOpen(false);
      setSelectedTVShowId(null);
    }
  };

  // Handle auth modal actions
  const handleShowSignIn = () => {
    setAuthModalTab('signin');
    setIsAuthModalOpen(true);
  };

  const handleShowSignUp = () => {
    setAuthModalTab('signup');
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    refetch(); // Refresh session
    // If user was trying to access protected route, navigate there
    if (activeRoute === "home") {
      // User might want to go to watchlist or profile after signing in
      // We'll just stay on home for now
    }
  };

  // Handle movie selection
  const handleMovieSelect = (movieId: number) => {
    setSelectedMovieId(movieId);
    setIsDetailOpen(true);
    // Close TV detail if open
    if (isTVDetailOpen) {
      setIsTVDetailOpen(false);
      setSelectedTVShowId(null);
    }
  };

  // Handle TV show selection
  const handleTVShowSelect = (tvShowId: number) => {
    setSelectedTVShowId(tvShowId);
    setIsTVDetailOpen(true);
    // Close movie detail if open
    if (isDetailOpen) {
      setIsDetailOpen(false);
      setSelectedMovieId(null);
    }
  };

  // Handle detail overlay close
  const handleDetailClose = () => {
    setIsDetailOpen(false);
    setSelectedMovieId(null);
  };

  // Handle TV detail overlay close
  const handleTVDetailClose = () => {
    setIsTVDetailOpen(false);
    setSelectedTVShowId(null);
  };

  // Handle sync action
  const handleSync = () => {
    // Trigger sync across components
    window.dispatchEvent(new CustomEvent('sync-requested'));
  };

  // Listen for favorites and movie tracking changes
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      // Load favorites count from localStorage for unauthenticated users
      // or trigger a refresh for authenticated users
      if (session?.user) {
        // For authenticated users, the useFavorites hook will handle this
        // Just dispatch an event to refresh components
        window.dispatchEvent(new CustomEvent('favorites-sync-requested'));
      } else {
        // For unauthenticated users, check localStorage
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
          try {
            const favorites = JSON.parse(savedFavorites);
            setFavoritesCount(Array.isArray(favorites) ? favorites.length : 0);
          } catch (error) {
            console.error('Failed to parse favorites:', error);
          }
        }
      }
    };

    const handleMovieWatched = (event: CustomEvent) => {
      // Refresh favorites count and other components when a movie is watched
      handleFavoritesUpdate();
      
      // Track movie watched event for statistics
      console.log('Movie watched:', event.detail);
    };

    // Updated event listeners for new favorites system
    window.addEventListener('storage', handleFavoritesUpdate);
    window.addEventListener('favorites-updated', handleFavoritesUpdate);
    window.addEventListener('watchlist-updated', handleFavoritesUpdate); // Keep backward compatibility
    window.addEventListener('movie-watched', handleMovieWatched as EventListener);
    
    // Initial load
    handleFavoritesUpdate();
    
    return () => {
      window.removeEventListener('storage', handleFavoritesUpdate);
      window.removeEventListener('favorites-updated', handleFavoritesUpdate);
      window.removeEventListener('watchlist-updated', handleFavoritesUpdate);
      window.removeEventListener('movie-watched', handleMovieWatched as EventListener);
    };
  }, [session?.user]);

  // Render current section content with lazy loading
  const renderMainContent = () => {
    switch (activeRoute) {
      case "home":
        return (
          <HomeSection 
            onMovieSelect={handleMovieSelect}
            className="min-h-screen"
            showSearchBox={false}
          />
        );
      
      case "search":
        return (
          <HomeSection 
            onMovieSelect={handleMovieSelect}
            className="min-h-screen"
            showSearchBox={true}
          />
        );
      
      case "watchlist":
        return (
          <Suspense fallback={<SectionFallback />}>
            <WatchlistSection 
              className="min-h-screen"
              onMovieSelect={handleMovieSelect}
            />
          </Suspense>
        );
      
      case "profile":
        return (
          <ProfileSection className="min-h-screen" />
        );
      
      default:
        return (
          <HomeSection 
            onMovieSelect={handleMovieSelect}
            className="min-h-screen"
            showSearchBox={false}
          />
        );
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen relative overflow-x-hidden">
        {/* Enhanced Glass Background Layer */}
        <div 
          ref={backgroundRef}
          className="fixed inset-0 -z-10"
          style={{
            background: `
              radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
                rgba(229, 9, 20, 0.15) 0%, 
                rgba(139, 69, 19, 0.1) 25%, 
                rgba(75, 85, 99, 0.08) 50%, 
                rgba(17, 24, 39, 0.9) 100%
              ),
              linear-gradient(135deg, 
                rgba(229, 9, 20, 0.12) 0%, 
                rgba(147, 51, 234, 0.08) 25%,
                rgba(236, 72, 153, 0.06) 50%,
                rgba(245, 158, 11, 0.08) 75%,
                rgba(34, 197, 94, 0.06) 100%
              ),
              linear-gradient(45deg, 
                rgba(0, 0, 0, 0.95) 0%, 
                rgba(15, 23, 42, 0.98) 100%
              )
            `,
            transform: `translateY(var(--scroll-y, 0px))`,
            willChange: 'transform',
          }}
        />
        
        {/* Enhanced backdrop blur overlay */}
        <div className="fixed inset-0 -z-10 backdrop-blur-sm bg-black/20" />

        {/* Navigation */}
        <NavigationBar
          activeRoute={activeRoute}
          onRouteChange={handleRouteChange}
          onSync={handleSync}
          watchlistBadgeCount={favoritesCount}
          onShowSignIn={handleShowSignIn}
          onShowSignUp={handleShowSignUp}
        />

        {/* Main Content Area */}
        <main className="relative z-10">
          <div className="lg:ml-24 lg:mr-8 mx-4 pb-32 lg:pb-8">
            <div className="pt-8 lg:pt-12">
              {renderMainContent()}
            </div>
          </div>
        </main>

        {/* Lazy Loaded Detail Overlay with Enhanced Props */}
        <Suspense fallback={<DetailOverlaySkeleton />}>
          <DetailOverlay
            movieId={selectedMovieId}
            isOpen={isDetailOpen}
            onClose={handleDetailClose}
            familyMode={familyMode}
          />
        </Suspense>

        {/* Lazy Loaded TV Detail Overlay */}
        <Suspense fallback={<DetailOverlaySkeleton />}>
          <TVDetailOverlay
            tvShowId={selectedTVShowId}
            isOpen={isTVDetailOpen}
            onClose={handleTVDetailClose}
          />
        </Suspense>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          defaultTab={authModalTab}
        />

        {/* Enhanced Toast Notifications with Branding */}
        <Toaster 
          position="bottom-center"
          toastOptions={{
            className: "glass-card border-border/50 text-foreground",
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }
          }}
        />

        {/* Enhanced Offline Indicator */}
        {!isOnline && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-card bg-destructive/90 text-destructive-foreground px-6 py-3 rounded-full text-sm font-medium backdrop-blur-xl border border-destructive/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
              You're offline
            </div>
          </div>
        )}

        {/* Global Footer Branding (Visible on all pages) */}
        <div className="fixed bottom-4 left-4 z-30 lg:left-28">
          <motion.div
            className="glass-card px-3 py-2 text-xs text-gray-500 backdrop-blur-xl border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            <p>
              Created by <span className="text-white font-medium">Zana Faroq</span> • 
              Powered by <span className="text-primary font-medium">FLKRD STUDIO</span>
            </p>
          </motion.div>
        </div>

        {/* Performance optimization: Preload critical resources */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://api.themoviedb.org" />
        
        {/* Enhanced metadata for SEO and branding */}
        <div style={{ display: 'none' }}>
          <meta name="author" content="Zana Faroq" />
          <meta name="creator" content="FLKRD STUDIO" />
          <meta name="application-name" content="FLKRD Movies" />
          <meta name="description" content="Premium movie streaming experience with advanced tracking and content filtering. Created by Zana Faroq, powered by FLKRD STUDIO." />
        </div>
      </div>
    </LanguageProvider>
  );
}