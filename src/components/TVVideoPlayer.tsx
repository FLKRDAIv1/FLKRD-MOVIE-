"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RefreshCw, Settings, Maximize, VolumeX, Volume2, Play, Pause, SkipBack, SkipForward, AlertCircle, MonitorSpeaker, Tv, Languages, Subtitles, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface TVVideoPlayerProps {
  tvShowId: number;
  season: number;
  episode: number;
  title: string;
  onClose: () => void;
}

interface TVStreamingSource {
  name: string;
  url: string;
  type: 'embed' | 'direct';
  priority: number;
  hasKurdishSubtitles?: boolean;
  hasKurdishAudio?: boolean;
  quality?: string;
}

interface KurdishSubtitle {
  language: 'ku' | 'ku-arab' | 'ku-latn';
  name: string;
  url: string;
  format: 'vtt' | 'srt';
  dialect: 'sorani' | 'kurmanji' | 'pehlewani';
}

export const TVVideoPlayer: React.FC<TVVideoPlayerProps> = ({
  tvShowId,
  season,
  episode,
  title,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState([50]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [streamingData, setStreamingData] = useState<any>(null);
  const [autoSwitchAttempts, setAutoSwitchAttempts] = useState(0);

  // Enhanced video controls
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Kurdish subtitle states
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [selectedSubtitleLang, setSelectedSubtitleLang] = useState<'ku-sorani' | 'ku-kurmanji' | 'en' | 'off'>('ku-sorani');
  const [kurdishSubtitles, setKurdishSubtitles] = useState<KurdishSubtitle[]>([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');
  const [subtitleCues, setSubtitleCues] = useState<any[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate enhanced TV streaming sources with Kurdish support
  const generateTVSources = useCallback((): TVStreamingSource[] => {
    return [
      {
        name: '2Embed CC (Primary)',
        url: `https://www.2embed.cc/embedtv/${tvShowId}&s=${season}&e=${episode}`,
        type: 'embed',
        priority: 1,
        hasKurdishSubtitles: true,
        quality: 'HD'
      },
      {
        name: 'VidSrc Pro',
        url: `https://vidsrc.pro/embed/tv/${tvShowId}/${season}/${episode}`,
        type: 'embed',
        priority: 2,
        hasKurdishSubtitles: true,
        quality: '4K'
      },
      {
        name: 'VidSrc',
        url: `https://vidsrc.to/embed/tv/${tvShowId}/${season}/${episode}`,
        type: 'embed',
        priority: 3,
        hasKurdishSubtitles: true,
        quality: 'HD'
      },
      {
        name: 'AutoEmbed',
        url: `https://autoembed.co/tv/tmdb/${tvShowId}-${season}-${episode}`,
        type: 'embed',
        priority: 4,
        hasKurdishSubtitles: true,
        quality: 'HD'
      },
      {
        name: 'SuperEmbed',
        url: `https://multiembed.mov/directstream.php?video_id=${tvShowId}&s=${season}&e=${episode}`,
        type: 'embed',
        priority: 5,
        hasKurdishSubtitles: false,
        quality: 'HD'
      },
      {
        name: 'EmbedSu',
        url: `https://embed.su/embed/tv/${tvShowId}/${season}/${episode}`,
        type: 'embed',
        priority: 6,
        hasKurdishSubtitles: true,
        quality: 'HD'
      },
      {
        name: 'VidSrc XYZ',
        url: `https://vidsrc.xyz/embed/tv/${tvShowId}/${season}/${episode}`,
        type: 'embed',
        priority: 7,
        hasKurdishSubtitles: false,
        quality: 'HD'
      },
      {
        name: 'MoviesAPI',
        url: `https://moviesapi.club/tv/${tvShowId}/${season}/${episode}`,
        type: 'embed',
        priority: 8,
        hasKurdishSubtitles: false,
        quality: 'HD'
      }
    ].sort((a, b) => a.priority - b.priority);
  }, [tvShowId, season, episode]);

  const [sources] = useState<TVStreamingSource[]>(generateTVSources());
  const currentSource = sources[currentSourceIndex];

  // Fetch Kurdish subtitles for TV shows
  const fetchKurdishSubtitles = async (tvShowId: number, season: number, episode: number, title: string): Promise<KurdishSubtitle[]> => {
    const subtitles: KurdishSubtitle[] = [];
    
    try {
      const response = await fetch(`/api/kurdish-subtitles?tvShowId=${tvShowId}&season=${season}&episode=${episode}&title=${encodeURIComponent(title)}&type=tv`);
      if (response.ok) {
        const data = await response.json();
        subtitles.push(...(data.subtitles || []));
      }

      // Add fallback Kurdish subtitles generation for TV
      if (subtitles.length === 0) {
        subtitles.push({
          language: 'ku-arab',
          name: 'Kurdish Sorani (Generated)',
          url: `/api/generate-kurdish-subtitles?tvShowId=${tvShowId}&season=${season}&episode=${episode}&dialect=sorani&type=tv`,
          format: 'vtt',
          dialect: 'sorani'
        });
      }

      return subtitles;
    } catch (error) {
      console.error('Error fetching Kurdish subtitles for TV:', error);
      return [];
    }
  };

  // Parse VTT subtitle format
  const parseVTTSubtitles = (vttText: string) => {
    const cues = [];
    const lines = vttText.split('\n');
    let currentCue: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === 'WEBVTT' || line === '') continue;
      
      if (line.includes('-->')) {
        const [start, end] = line.split('-->').map(t => t.trim());
        currentCue = {
          startTime: parseTimeCode(start),
          endTime: parseTimeCode(end),
          text: ''
        };
      }
      else if (currentCue && line && !line.includes('-->')) {
        currentCue.text += (currentCue.text ? '\n' : '') + line;
      }
      else if (currentCue && line === '') {
        cues.push(currentCue);
        currentCue = null;
      }
    }
    
    if (currentCue) {
      cues.push(currentCue);
    }
    
    return cues;
  };

  // Parse time code (00:00:00.000)
  const parseTimeCode = (timeStr: string): number => {
    const parts = timeStr.split(':');
    const seconds = parts[2].split('.')[0];
    const milliseconds = parts[2].split('.')[1] || '0';
    
    return (
      parseInt(parts[0]) * 3600 + // hours
      parseInt(parts[1]) * 60 +   // minutes
      parseInt(seconds) +         // seconds
      parseInt(milliseconds) / 1000 // milliseconds
    );
  };

  // Load subtitle file and parse it
  const loadSubtitleFile = async (subtitleUrl: string) => {
    try {
      const response = await fetch(subtitleUrl);
      const subtitleText = await response.text();
      
      const cues = parseVTTSubtitles(subtitleText);
      setSubtitleCues(cues);
      
      toast.success('🏛️ Kurdish subtitles loaded', {
        description: `S${season}E${episode} - Kurdish Sorani support active`
      });
    } catch (error) {
      console.error('Error loading subtitle file:', error);
      toast.error('Failed to load Kurdish subtitles');
    }
  };

  // Update current subtitle based on video time
  const updateCurrentSubtitle = (currentTime: number) => {
    const currentCue = subtitleCues.find(
      cue => currentTime >= cue.startTime && currentTime <= cue.endTime
    );
    
    setCurrentSubtitleText(currentCue ? currentCue.text : '');
  };

  // Frame-by-frame navigation
  const skipFrameForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 1/30; // Skip 1 frame (assuming 30fps)
    }
  };

  const skipFrameBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 1/30; // Go back 1 frame
    }
  };

  // Fetch TV streaming data
  const fetchStreamingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch Kurdish subtitles
      const kurdishSubs = await fetchKurdishSubtitles(tvShowId, season, episode, title);
      setKurdishSubtitles(kurdishSubs);

      // Simulate API call for TV streaming data
      const response = await fetch(`/api/tv-streaming/${tvShowId}?season=${season}&episode=${episode}`);
      
      if (response.ok) {
        const data = await response.json();
        setStreamingData(data);
      }
      
      toast.success(`Loading S${season}E${episode} - ${title}`, {
        description: `${kurdishSubs.length} Kurdish subtitle options available`
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load TV episode';
      setError(errorMessage);
      toast.error(`Error loading S${season}E${episode}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [tvShowId, season, episode, title]);

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setAutoSwitchAttempts(0);
    toast.success(`S${season}E${episode} loaded successfully`);
  }, [season, episode]);

  // Handle iframe errors and auto-switch sources
  const handleIframeError = useCallback(() => {
    const nextIndex = currentSourceIndex + 1;
    
    if (nextIndex < sources.length && autoSwitchAttempts < 3) {
      setAutoSwitchAttempts(prev => prev + 1);
      setCurrentSourceIndex(nextIndex);
      toast.info(`Source failed, trying ${sources[nextIndex].name}...`);
    } else {
      setError(`Unable to load S${season}E${episode}. All sources failed or are restricted.`);
      setIsLoading(false);
      toast.error(`All sources failed for S${season}E${episode}`);
    }
  }, [currentSourceIndex, sources, autoSwitchAttempts, season, episode]);

  // Manual source switching
  const switchSource = useCallback((sourceIndex: number) => {
    if (sourceIndex >= 0 && sourceIndex < sources.length) {
      setCurrentSourceIndex(sourceIndex);
      setIsLoading(true);
      setError(null);
      setAutoSwitchAttempts(0);
      toast.info(`Switching to ${sources[sourceIndex].name}...`);
    }
  }, [sources]);

  // Fullscreen controls
  const toggleFullscreen = useCallback(() => {
    if (!playerRef.current) return;

    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Control visibility
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Enhanced video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume([newVolume]);
    setIsMuted(newVolume === 0);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.volume = newMuted ? 0 : volume[0] / 100;
    }
  };

  // Handle time update for subtitle sync
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      setCurrentTime(currentTime);
      
      if (subtitlesEnabled && subtitleCues.length > 0) {
        updateCurrentSubtitle(currentTime);
      }
    }
  };

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress bar click handler
  const handleProgressClick = (event: React.MouseEvent) => {
    if (videoRef.current && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Keyboard shortcuts
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        setIsPlaying(prev => !prev);
        break;
      case 'KeyF':
        event.preventDefault();
        toggleFullscreen();
        break;
      case 'KeyM':
        event.preventDefault();
        setIsMuted(prev => !prev);
        break;
      case 'Escape':
        if (isFullscreen) {
          toggleFullscreen();
        } else {
          onClose();
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentSourceIndex > 0) {
          switchSource(currentSourceIndex - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (currentSourceIndex < sources.length - 1) {
          switchSource(currentSourceIndex + 1);
        }
        break;
    }
  }, [isFullscreen, toggleFullscreen, onClose, currentSourceIndex, sources.length, switchSource]);

  // Effects
  useEffect(() => {
    fetchStreamingData();
  }, [fetchStreamingData]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyPress);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleKeyPress]);

  useEffect(() => {
    if (currentSource) {
      setIsLoading(true);
      setError(null);
    }
  }, [currentSourceIndex, currentSource]);

  // Render Kurdish subtitle overlay
  const renderSubtitleOverlay = () => {
    if (!subtitlesEnabled || !currentSubtitleText) return null;

    return (
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30 max-w-4xl px-4">
        <div className="bg-black/80 text-white px-6 py-3 rounded-lg text-center backdrop-blur-sm border border-white/20">
          <p className="text-lg font-medium leading-relaxed" style={{ fontFamily: 'Arial, "Segoe UI", sans-serif' }}>
            {currentSubtitleText}
          </p>
        </div>
      </div>
    );
  };

  // Render enhanced video player controls
  const renderEnhancedControls = () => (
    <div
      className={`glass-nav p-4 flex items-center justify-between transition-all duration-300 ${
        showControls || !isFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
      }`}
    >
      <div className="flex items-center space-x-4">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        {/* Frame-by-frame controls */}
        <Button
          onClick={skipFrameBackward}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          title="Previous frame"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          onClick={skipFrameForward}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          title="Next frame"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={isMuted ? [0] : volume}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-20"
          />
        </div>

        {/* Time Display */}
        <span className="text-white text-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {/* Kurdish Subtitle Controls */}
        <Select
          value={selectedSubtitleLang}
          onValueChange={(value) => setSelectedSubtitleLang(value as typeof selectedSubtitleLang)}
        >
          <SelectTrigger className="w-40 h-8 text-white border-white/20 bg-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Subtitles Off</SelectItem>
            <SelectItem value="ku-sorani">🏛️ Kurdish Sorani</SelectItem>
            <SelectItem value="ku-kurmanji">🏛️ Kurdish Kurmanji</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
          variant="ghost"
          size="sm"
          className={`text-white hover:bg-white/10 ${subtitlesEnabled ? 'bg-white/20' : ''}`}
          title="Toggle subtitles"
        >
          <Subtitles className="h-4 w-4" />
        </Button>

        {/* Playback Speed */}
        <Select
          value={playbackRate.toString()}
          onValueChange={(value) => {
            const rate = parseFloat(value);
            setPlaybackRate(rate);
            if (videoRef.current) {
              videoRef.current.playbackRate = rate;
            }
          }}
        >
          <SelectTrigger className="w-16 h-8 text-white border-white/20 bg-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.25">0.25x</SelectItem>
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="0.75">0.75x</SelectItem>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="1.25">1.25x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => currentSourceIndex > 0 && switchSource(currentSourceIndex - 1)}
          disabled={currentSourceIndex === 0}
          className="text-white hover:bg-white/10 disabled:opacity-50"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <span className="text-sm text-gray-400 px-2">
          {currentSourceIndex + 1} / {sources.length}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => currentSourceIndex < sources.length - 1 && switchSource(currentSourceIndex + 1)}
          disabled={currentSourceIndex === sources.length - 1}
          className="text-white hover:bg-white/10 disabled:opacity-50"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div
      ref={playerRef}
      className={`fixed inset-0 z-50 bg-black flex flex-col ${
        isFullscreen ? 'fullscreen' : ''
      }`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Header */}
      <div
        className={`glass-nav p-4 flex items-center justify-between transition-all duration-300 ${
          showControls || !isFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
        }`}
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Tv className="h-5 w-5 text-netflix-red" />
            <div>
              <h2 className="text-lg font-semibold text-white truncate max-w-64">
                {title}
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <p className="text-gray-400">
                  Season {season} • Episode {episode}
                </p>
                {kurdishSubtitles.length > 0 && (
                  <div className="flex items-center gap-1 text-green-400">
                    <Languages className="h-3 w-3" />
                    <span className="text-xs">Kurdish</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Source Selector */}
          <Select
            value={currentSourceIndex.toString()}
            onValueChange={(value) => switchSource(parseInt(value))}
          >
            <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sources.map((source, index) => (
                <SelectItem key={index} value={index.toString()}>
                  <div className="flex items-center space-x-2">
                    <MonitorSpeaker className="h-4 w-4" />
                    <span>{source.name}</span>
                    {source.hasKurdishSubtitles && (
                      <Languages className="h-3 w-3 text-green-400" />
                    )}
                    {index === 0 && (
                      <span className="text-xs bg-netflix-red text-white px-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/10"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <div className="loading-shimmer w-16 h-16 rounded-full mb-4 mx-auto"></div>
              <p className="text-white text-lg font-medium">
                Loading S{season}E{episode}...
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {currentSource?.name} • Enhanced player with Kurdish support
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center max-w-md mx-auto p-6">
              <AlertCircle className="h-16 w-16 text-netflix-red mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Playback Error
              </h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <div className="space-y-3">
                <Button
                  onClick={() => switchSource(0)}
                  className="w-full bg-netflix-red hover:bg-netflix-red/80"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                {currentSourceIndex < sources.length - 1 && (
                  <Button
                    variant="outline"
                    onClick={() => switchSource(currentSourceIndex + 1)}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Try Next Source
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full text-gray-400 hover:text-white hover:bg-white/10"
                >
                  Close Player
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {duration > 0 && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div 
              className="w-full h-1 bg-white/20 rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-150"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {currentSource && (
          <>
            <iframe
              ref={iframeRef}
              src={currentSource.url}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={`${title} - S${season}E${episode} - Enhanced Player`}
            />
            
            {/* Hidden video element for frame controls when needed */}
            <video
              ref={videoRef}
              className="hidden"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </>
        )}

        {/* Kurdish Subtitle Overlay */}
        {renderSubtitleOverlay()}
      </div>

      {/* Enhanced Bottom Controls */}
      {renderEnhancedControls()}

      {/* Kurdish Support Indicator */}
      {kurdishSubtitles.length > 0 && (
        <div className="absolute bottom-4 left-4 glass-card px-3 py-2 rounded-lg flex items-center gap-2 z-20">
          <Languages className="h-4 w-4 text-green-500" />
          <span className="text-sm text-white">
            {kurdishSubtitles.length} Kurdish subtitle{kurdishSubtitles.length > 1 ? 's' : ''} available
          </span>
        </div>
      )}
    </div>
  );
};