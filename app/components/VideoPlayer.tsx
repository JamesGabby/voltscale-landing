"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  RotateCcw,
  FastForward,
  Settings,
} from "lucide-react";
import FullscreenOverlay from "./FullscreenOverlay";

interface VideoPlayerProps {
  src: string;
  webmSrc?: string;
  poster?: string;
  title?: string;
  autoplayOnScroll?: boolean;
  onAnalyticsEvent?: (event: VideoAnalyticsEvent) => void;
}

interface VideoAnalyticsEvent {
  type:
    | "play"
    | "pause"
    | "complete"
    | "progress"
    | "seek"
    | "volume_change"
    | "fullscreen"
    | "modal_open"
    | "modal_close";
  currentTime: number;
  duration: number;
  percentage: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export default function VideoPlayer({
  src = "/videos/vsl-video.mp4",
  webmSrc = "/videos/vsl-video.webm",
  poster = "/videos/vsl-thumbnail.jpg",
  title = "How VoltScale Generated \$2.4M in Pipeline for TechCorp",
  autoplayOnScroll = true,
  onAnalyticsEvent,
}: VideoPlayerProps) {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [previousVolume, setPreviousVolume] = useState(0.7);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<{
    show: boolean;
    seconds: number;
    side: "left" | "right";
  } | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressMilestonesRef = useRef<Set<number>>(new Set());
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }

    setShowControls(true);

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isHovering || isMobile) {
          setShowControls(false);
          setShowSpeedMenu(false);
          setShowVolumeSlider(false);
          setShowSettingsMenu(false);
        }
      }, 3000);
    }
  }, [isPlaying, isHovering, isMobile]);

  // Auto-hide controls when video starts playing
  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
  }, [isPlaying, resetControlsTimeout]);

  // Analytics tracking
  const trackEvent = useCallback(
    (type: VideoAnalyticsEvent["type"], metadata?: Record<string, any>) => {
      const video = videoRef.current;
      if (!video) return;

      const event: VideoAnalyticsEvent = {
        type,
        currentTime: video.currentTime,
        duration: video.duration || 0,
        percentage: video.duration
          ? (video.currentTime / video.duration) * 100
          : 0,
        timestamp: new Date(),
        metadata,
      };

      console.log("[Video Analytics]", event);
      onAnalyticsEvent?.(event);
    },
    [onAnalyticsEvent]
  );

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setHasStarted(true);
      trackEvent("play");
      resetControlsTimeout();
    } else {
      video.pause();
      setIsPlaying(false);
      trackEvent("pause");
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
  }, [trackEvent, resetControlsTimeout]);

  // Time update handler
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const current = video.currentTime;
    const total = video.duration;

    setCurrentTime(current);
    setProgress((current / total) * 100);

    // Track progress milestones
    const percentage = Math.floor((current / total) * 100);
    const milestones = [25, 50, 75, 90];

    milestones.forEach((milestone) => {
      if (
        percentage >= milestone &&
        !progressMilestonesRef.current.has(milestone)
      ) {
        progressMilestonesRef.current.add(milestone);
        trackEvent("progress", { milestone });
      }
    });
  }, [trackEvent]);

  // Buffered progress
  const handleProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.buffered.length) return;

    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    const total = video.duration;
    setBuffered((bufferedEnd / total) * 100);
  }, []);

  // Metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  }, []);

  // Progress bar click (seek)
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, clickX / width));
      const newTime = percentage * video.duration;

      video.currentTime = newTime;
      trackEvent("seek", { from: currentTime, to: newTime });
      resetControlsTimeout();
    },
    [trackEvent, currentTime, resetControlsTimeout]
  );

  // Touch handler for progress bar
  const handleProgressTouch = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, touchX / width));
      const newTime = percentage * video.duration;

      video.currentTime = newTime;
      resetControlsTimeout();
    },
    [resetControlsTimeout]
  );

  // Volume change
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const video = videoRef.current;
      if (!video) return;

      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      video.volume = clampedVolume;
      video.muted = clampedVolume === 0;
      setVolume(clampedVolume);

      if (clampedVolume === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
        setPreviousVolume(clampedVolume);
      }

      trackEvent("volume_change", { volume: clampedVolume });
      resetControlsTimeout();
    },
    [trackEvent, resetControlsTimeout]
  );

  // Mute toggle
  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted || volume === 0) {
      const newVolume = previousVolume || 0.7;
      video.volume = newVolume;
      video.muted = false;
      setVolume(newVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      video.muted = true;
      setIsMuted(true);
    }
    resetControlsTimeout();
  }, [isMuted, volume, previousVolume, resetControlsTimeout]);

  // Video ended
  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
    trackEvent("complete");
    progressMilestonesRef.current.clear();
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  }, [trackEvent]);

  // Playback speed
  const handleSpeedChange = useCallback(
    (speed: number) => {
      const video = videoRef.current;
      if (!video) return;

      video.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
      setShowSettingsMenu(false);
      resetControlsTimeout();
    },
    [resetControlsTimeout]
  );

  // Skip forward/backward
  const handleSkip = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = Math.max(
        0,
        Math.min(video.duration, video.currentTime + seconds)
      );

      setSeekIndicator({
        show: true,
        seconds: Math.abs(seconds),
        side: seconds > 0 ? "right" : "left",
      });

      setTimeout(() => setSeekIndicator(null), 800);
      resetControlsTimeout();
    },
    [resetControlsTimeout]
  );

  // Double tap to seek (mobile)
  const handleDoubleTap = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isMobile) return;

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double tap detected - clear single tap timeout
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
          tapTimeoutRef.current = null;
        }

        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const tapX = e.changedTouches[0].clientX - rect.left;
        const containerWidth = rect.width;

        if (tapX < containerWidth / 3) {
          handleSkip(-10);
        } else if (tapX > (containerWidth * 2) / 3) {
          handleSkip(10);
        } else {
          handlePlayPause();
        }
      } else {
        // Single tap - toggle controls after delay
        tapTimeoutRef.current = setTimeout(() => {
          setShowControls((prev) => {
            const newValue = !prev;
            if (newValue && isPlaying) {
              setTimeout(() => resetControlsTimeout(), 0);
            }
            return newValue;
          });
        }, 300);
      }

      lastTapRef.current = now;
    },
    [isMobile, handleSkip, handlePlayPause, isPlaying, resetControlsTimeout]
  );

  // Mobile fullscreen
  const handleMobileFullscreen = useCallback(() => {
    setShowFullscreenOverlay(true);
    trackEvent("fullscreen", { type: "open" });
  }, [trackEvent]);

  // Autoplay on scroll (Intersection Observer)
  useEffect(() => {
    if (!autoplayOnScroll) return;

    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (video.paused && !hasStarted) {
              video.muted = true;
              setIsMuted(true);
              video.play().catch(() => {
                console.log("Autoplay prevented by browser");
              });
              setIsPlaying(true);
            }
          } else {
            if (!video.paused && !showFullscreenOverlay) {
              video.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: "0px",
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [autoplayOnScroll, hasStarted, showFullscreenOverlay]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      document.body.style.overflow = "";
    };
  }, []);

  // Volume icon based on level
  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Playback speed options
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <>
      {/* Main Video Player */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full max-w-3xl mx-auto rounded-xl sm:rounded-2xl overflow-hidden shadow-video bg-grey-900 ring-1 ring-grey-200/50 group touch-manipulation"
        onMouseEnter={() => {
          if (!isMobile) {
            setIsHovering(true);
            resetControlsTimeout();
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsHovering(false);
            if (isPlaying) {
              controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowSpeedMenu(false);
                setShowVolumeSlider(false);
                setShowSettingsMenu(false);
              }, 500);
            }
          }
        }}
        onMouseMove={() => {
          if (!isMobile) {
            resetControlsTimeout();
          }
        }}
        onTouchEnd={handleDoubleTap}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleProgress}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
          preload="metadata"
          webkit-playsinline="true"
        >
          <source src={src} type="video/mp4" />
          {webmSrc && <source src={webmSrc} type="video/webm" />}
        </video>

        {/* Double-Tap Seek Indicators */}
        {seekIndicator && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-30 ${
              seekIndicator.side === "left"
                ? "left-8 sm:left-12"
                : "right-8 sm:right-12"
            }`}
          >
            <div className="flex flex-col items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-4 py-3 animate-fade-in">
              {seekIndicator.side === "left" ? (
                <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              ) : (
                <FastForward className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              )}
              <span className="text-white text-xs sm:text-sm font-medium">
                {seekIndicator.seconds}s
              </span>
            </div>
          </div>
        )}

        {/* Play/Pause Overlay Button */}
        {(!hasStarted || !isPlaying) && (
          <button
            type="button"
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center z-10"
            aria-label="Play video"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-electric-500/20 animate-ping" />
              <div className="relative flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-electric-500 text-primary-foreground shadow-2xl transition-all duration-300 ease-out-expo hover:scale-110 hover:bg-electric-400 active:scale-95">
                <Play
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ml-0.5 sm:ml-1"
                  fill="currentColor"
                />
              </div>
            </div>
          </button>
        )}

        {/* Bottom Controls Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 sm:p-4 pt-8 sm:pt-12 transition-opacity duration-300 z-20 ${
            showControls
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Progress Bar */}
          <div
            className="w-full h-6 sm:h-4 flex items-center cursor-pointer mb-2 sm:mb-4 group/progress"
            onClick={handleProgressClick}
            onTouchMove={handleProgressTouch}
          >
            <div className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full relative">
              {/* Buffered Progress */}
              <div
                className="absolute h-full bg-white/30 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              {/* Current Progress */}
              <div
                className="absolute h-full bg-electric-500 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity -translate-x-1/2" />
              </div>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-0.5 sm:gap-2">
              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={handlePlayPause}
                className="flex items-center justify-center w-10 h-10 text-white hover:text-electric-400 transition-colors rounded-lg active:bg-white/10"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" fill="currentColor" />
                ) : (
                  <Play className="w-5 h-5" fill="currentColor" />
                )}
              </button>

              {/* Skip Backward */}
              <button
                type="button"
                onClick={() => handleSkip(-10)}
                className="hidden xs:flex items-center justify-center w-10 h-10 text-white hover:text-electric-400 transition-colors rounded-lg active:bg-white/10"
                aria-label="Skip back 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Skip Forward */}
              <button
                type="button"
                onClick={() => handleSkip(10)}
                className="hidden xs:flex items-center justify-center w-10 h-10 text-white hover:text-electric-400 transition-colors rounded-lg active:bg-white/10"
                aria-label="Skip forward 10 seconds"
              >
                <FastForward className="w-4 h-4" />
              </button>

              {/* Volume Control - Desktop */}
              {!isMobile && (
                <div
                  className="relative hidden sm:flex items-center"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button
                    type="button"
                    onClick={handleMuteToggle}
                    className="flex items-center justify-center w-10 h-10 text-white hover:text-electric-400 transition-colors rounded-lg"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    <VolumeIcon className="w-5 h-5" />
                  </button>

                  <div
                    className={`absolute left-10 flex items-center h-10 transition-all duration-200 overflow-hidden ${
                      showVolumeSlider ? "w-24 opacity-100" : "w-0 opacity-0"
                    }`}
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) =>
                        handleVolumeChange(parseFloat(e.target.value))
                      }
                      className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:cursor-pointer"
                      aria-label="Volume"
                    />
                  </div>
                </div>
              )}

              {/* Volume Control - Mobile (Mute toggle only) */}
              {isMobile && (
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  className="flex sm:hidden items-center justify-center w-10 h-10 text-white active:text-electric-400 transition-colors rounded-lg active:bg-white/10"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  <VolumeIcon className="w-5 h-5" />
                </button>
              )}

              {/* Time Display */}
              <span className="text-[10px] sm:text-sm text-white/90 font-medium ml-1 sm:ml-2 tabular-nums whitespace-nowrap">
                {formatTime(currentTime)}
                <span className="hidden xs:inline"> / {formatTime(duration)}</span>
              </span>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-2">
              {/* Settings Menu (Mobile) / Speed Menu (Desktop) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (isMobile) {
                      setShowSettingsMenu(!showSettingsMenu);
                      setShowSpeedMenu(false);
                    } else {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowSettingsMenu(false);
                    }
                    resetControlsTimeout();
                  }}
                  className="flex items-center justify-center w-10 h-10 text-white hover:text-electric-400 transition-colors rounded-lg active:bg-white/10"
                  aria-label="Settings"
                >
                  {isMobile ? (
                    <Settings className="w-5 h-5" />
                  ) : (
                    <span className="text-xs sm:text-sm font-medium">
                      {playbackSpeed}x
                    </span>
                  )}
                </button>

                {/* Desktop Speed Menu */}
                {!isMobile && showSpeedMenu && (
                  <div className="absolute bottom-12 right-0 bg-grey-900/95 backdrop-blur-sm rounded-lg border border-white/10 py-1 min-w-[80px] shadow-xl z-50">
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${
                          playbackSpeed === speed
                            ? "text-electric-400"
                            : "text-white"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}

                {/* Mobile Settings Menu */}
                {isMobile && showSettingsMenu && (
                  <div className="absolute bottom-12 right-0 bg-grey-900/95 backdrop-blur-sm rounded-xl border border-white/10 py-2 min-w-[140px] shadow-xl z-50">
                    <p className="px-4 py-1 text-xs text-white/50 uppercase tracking-wider">
                      Speed
                    </p>
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`w-full px-4 py-2.5 text-sm text-left active:bg-white/10 transition-colors ${
                          playbackSpeed === speed
                            ? "text-electric-400"
                            : "text-white"
                        }`}
                      >
                        {speed}x {speed === 1 && "(Normal)"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Expand/Fullscreen Button */}
              <button
                type="button"
                onClick={handleMobileFullscreen}
                className="flex items-center justify-center w-10 h-10 text-white hover:text-electric-400 transition-colors rounded-lg active:bg-white/10"
                aria-label="Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Title Overlay */}
        <div
          className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3 sm:p-4 pb-8 sm:pb-12 transition-opacity duration-300 z-10 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <p className="text-xs sm:text-sm md:text-base font-medium text-white/90 drop-shadow-lg pr-8 sm:pr-12 line-clamp-1 sm:line-clamp-none">
            {title}
          </p>
        </div>

        {/* Autoplay Muted Indicator */}
        {isPlaying && isMuted && hasStarted && showControls && (
          <button
            onClick={handleMuteToggle}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs sm:text-sm active:bg-black/80 transition-colors"
          >
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Tap to unmute</span>
          </button>
        )}

        {/* Mobile Gesture Hints */}
        {isMobile && !hasStarted && (
          <div className="absolute inset-0 pointer-events-none z-5">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xs text-center">
              <RotateCcw className="w-5 h-5 mx-auto mb-1" />
              <span>2x tap</span>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-xs text-center">
              <FastForward className="w-5 h-5 mx-auto mb-1" />
              <span>2x tap</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Fullscreen Overlay */}
      <FullscreenOverlay
        videoRef={videoRef}
        isOpen={showFullscreenOverlay}
        onClose={() => {
          setShowFullscreenOverlay(false);
          if (videoRef.current) {
            setIsPlaying(!videoRef.current.paused);
            setCurrentTime(videoRef.current.currentTime);
            setProgress(
              videoRef.current.duration
                ? (videoRef.current.currentTime / videoRef.current.duration) *
                    100
                : 0
            );
          }
        }}
        title={title}
        onAnalyticsEvent={onAnalyticsEvent}
      />
    </>
  );
}