"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '@/lib/language';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  PictureInPicture2,
  Settings,
  Subtitles,
  SkipForward,
  SkipBack,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface StreamingSource {
  type: 'youtube' | 'embed' | 'official';
  url: string;
  quality?: string;
  provider?: string;
  isOfficial?: boolean;
  hasKurdishSubtitles?: boolean;
  hasKurdishAudio?: boolean;
  region?: string;
}

interface EnhancedVideoPlayerProps {
  movieId: number;
  title: string;
  sources: StreamingSource[];
  isOpen: boolean;
  onClose: () => void;
  autoplay?: boolean;
  startTime?: number;
  preferredSource?: 'trailer' | 'embed' | 'official';
  kurdishPreferences?: boolean;
}

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  movieId,
  title,
  sources,
  isOpen,
  onClose,
  autoplay = false,
  startTime = 0,
  preferredSource = 'official',
  kurdishPreferences = false
}) => {
  const { t, language } = useLanguage();
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentSource, setCurrentSource] = useState<StreamingSource | null>(null);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [subtitleLanguage, setSubtitleLanguage] = useState('kurdish');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);

  // Refs
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Select best source based on preferences
  const selectedSource = useMemo(() => {
    if (!sources.length) return null;

    // Priority: Kurdish content > official > quality > type preference
    const sortedSources = [...sources].sort((a, b) => {
      // Kurdish preferences
      if (kurdishPreferences) {
        const aKurdish = (a.hasKurdishSubtitles ? 1 : 0) + (a.hasKurdishAudio ? 1 : 0);
        const bKurdish = (b.hasKurdishSubtitles ? 1 : 0) + (b.hasKurdishAudio ? 1 : 0);
        if (aKurdish !== bKurdish) return bKurdish - aKurdish;
      }

      // Official sources first
      if (a.isOfficial !== b.isOfficial) {
        return (b.isOfficial ? 1 : 0) - (a.isOfficial ? 1 : 0);
      }

      // Type preference
      const typeOrder = { official: 3, youtube: 2, embed: 1 };
      const aScore = typeOrder[a.type] || 0;
      const bScore = typeOrder[b.type] || 0;
      
      return bScore - aScore;
    });

    return sortedSources[0];
  }, [sources, kurdishPreferences, preferredSource]);

  // Initialize source
  useEffect(() => {
    if (selectedSource && isOpen) {
      setCurrentSource(selectedSource);
      setIsLoading(true);
      setError(null);
      
      // Show warning for unofficial sources
      if (!selectedSource.isOfficial && selectedSource.type === 'embed') {
        setShowWarning(true);
      }
    }
  }, [selectedSource, isOpen]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Handle mouse movement
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Play/Pause functions
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Skip functions
  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  }, []);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10;
    }
  }, []);

  // Volume functions
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  // Fullscreen functions
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Picture-in-Picture
  const togglePictureInPicture = useCallback(async () => {
    if (videoRef.current) {
      try {
        if (!document.pictureInPictureElement) {
          await videoRef.current.requestPictureInPicture();
          setIsPictureInPicture(true);
        } else {
          await document.exitPictureInPicture();
          setIsPictureInPicture(false);
        }
      } catch (error) {
        console.error('Picture-in-picture failed:', error);
      }
    }
  }, []);

  // Progress scrubbing
  const handleProgressClick = useCallback((event: React.MouseEvent) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  // Format time
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Video event handlers
  const handleVideoLoad = useCallback(() => {
    setIsLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.currentTime = startTime;
    }
  }, [startTime]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleVideoError = useCallback(() => {
    setError(t('videoPlayer.error.failedToLoad', 'Failed to load video'));
    setIsLoading(false);
  }, [t]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          skipBackward();
          break;
        case 'ArrowRight':
          skipForward();
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, togglePlay, skipBackward, skipForward, toggleMute, toggleFullscreen, onClose]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const renderVideoContent = () => {
    if (!currentSource) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium mb-2">{t('videoPlayer.error.noSource', 'No video source available')}</p>
            <Button onClick={onClose} variant="outline">
              {t('common.close', 'Close')}
            </Button>
          </div>
        </div>
      );
    }

    if (currentSource.type === 'youtube') {
      const videoId = currentSource.url.includes('youtube.com') 
        ? new URL(currentSource.url).searchParams.get('v')
        : currentSource.url.split('/').pop();
      
      return (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&start=${startTime}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      );
    }

    if (currentSource.type === 'embed') {
      return (
        <iframe
          ref={iframeRef}
          src={currentSource.url}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={() => setError(t('videoPlayer.error.embedFailed', 'Failed to load embedded content'))}
        />
      );
    }

    return (
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={currentSource.url}
        autoPlay={autoplay}
        onLoadedMetadata={handleVideoLoad}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      <div
        ref={playerRef}
        className="relative w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
              <p className="text-white font-medium">{t('videoPlayer.loading', 'Loading video...')}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <div className="text-center max-w-md mx-4">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold text-white mb-2">{t('videoPlayer.error.title', 'Playback Error')}</h3>
              <p className="text-white/80 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.reload()} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('common.retry', 'Retry')}
                </Button>
                <Button onClick={onClose} variant="secondary">
                  {t('common.close', 'Close')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Warning Overlay */}
        {showWarning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm z-20">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md mx-4 border border-white/20">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t('videoPlayer.warning.title', 'Unofficial Source')}
                </h3>
                <p className="text-white/80 mb-4 text-sm">
                  {t('videoPlayer.warning.message', 'This content is from an unofficial source. Quality and availability may vary.')}
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowWarning(false)} 
                    className="flex-1"
                    size="sm"
                  >
                    {t('common.continue', 'Continue')}
                  </Button>
                  <Button 
                    onClick={onClose} 
                    variant="outline" 
                    className="flex-1"
                    size="sm"
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Content */}
        <div className="w-full h-full">
          {renderVideoContent()}
        </div>

        {/* Controls Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          } ${currentSource?.type !== 'youtube' ? 'pointer-events-none' : ''}`}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-auto">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">{title}</h2>
              <div className="flex items-center gap-2">
                {currentSource?.isOfficial && (
                  <Badge variant="secondary" className="text-xs">
                    {t('videoPlayer.official', 'Official')}
                  </Badge>
                )}
                {currentSource?.hasKurdishSubtitles && (
                  <Badge variant="outline" className="text-xs border-accent text-accent">
                    {t('videoPlayer.kurdishSubtitles', 'Kurdish Subtitles')}
                  </Badge>
                )}
                {currentSource?.hasKurdishAudio && (
                  <Badge variant="outline" className="text-xs border-accent text-accent">
                    {t('videoPlayer.kurdishAudio', 'Kurdish Audio')}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Center Play Button */}
          {currentSource?.type !== 'youtube' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <Button
                onClick={togglePlay}
                size="lg"
                className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-200 scale-100 hover:scale-110"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </Button>
            </div>
          )}

          {/* Bottom Controls */}
          {currentSource?.type !== 'youtube' && (
            <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
              {/* Progress Bar */}
              <div 
                ref={progressRef}
                className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-accent rounded-full transition-all duration-150"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={togglePlay}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>

                  <Button
                    onClick={skipBackward}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={skipForward}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>

                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      onClick={toggleMute}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                    <div className="w-20">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolumeChange}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <span className="text-white text-sm ml-4">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={playbackRate.toString()} onValueChange={(value) => setPlaybackRate(parseFloat(value))}>
                    <SelectTrigger className="w-20 h-8 text-white border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    variant="ghost"
                    size="sm"
                    className={`text-white hover:bg-white/20 ${showSubtitles ? 'bg-white/20' : ''}`}
                  >
                    <Subtitles className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={togglePictureInPicture}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <PictureInPicture2 className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={toggleFullscreen}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden absolute bottom-4 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-md rounded-xl p-3">
            <div className="flex items-center justify-between">
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="sm"
                className="text-white"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              
              <div className="flex-1 mx-4">
                <div 
                  className="w-full h-2 bg-white/20 rounded-full cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>

              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
                className="text-white"
              >
                <Maximize className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};