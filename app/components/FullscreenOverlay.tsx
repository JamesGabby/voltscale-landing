"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Minimize,
  RotateCcw,
  FastForward,
  Settings,
  Lock,
  Unlock,
} from "lucide-react";

interface FullscreenOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onAnalyticsEvent?: (event: any) => void;
}

export default function FullscreenOverlay({
  videoRef,
  isOpen,
  onClose,
  title = "Video",
  onAnalyticsEvent,
}: FullscreenOverlayProps) {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<{
    show: boolean;
    seconds: number;
    side: "left" | "right";
  } | null>(null);
  const [brightness, setBrightness] = useState(1);

  // Refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const lastTapXRef = useRef<number>(0);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }

    if (isPlaying && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowVolumeSlider(false);
      }, 3000);
    }
  }, [isPlaying, isLocked]);

  // Auto-hide controls when video starts playing
  useEffect(() => {
    if (isPlaying && !isLocked) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
  }, [isPlaying, isLocked, resetControlsTimeout]);

  // Sync with source video when overlay opens
  useEffect(() => {
    if (isOpen && videoRef.current && fullscreenVideoRef.current) {
      const sourceVideo = videoRef.current;
      const fsVideo = fullscreenVideoRef.current;

      fsVideo.currentTime = sourceVideo.currentTime;
      fsVideo.volume = sourceVideo.volume;
      fsVideo.muted = sourceVideo.muted;
      fsVideo.playbackRate = sourceVideo.playbackRate;

      setVolume(sourceVideo.volume);
      setIsMuted(sourceVideo.muted);
      setPlaybackSpeed(sourceVideo.playbackRate);
      setDuration(sourceVideo.duration || 0);
      setCurrentTime(sourceVideo.currentTime);
      setProgress(
        sourceVideo.duration
          ? (sourceVideo.currentTime / sourceVideo.duration) * 100
          : 0
      );

      if (!sourceVideo.paused) {
        fsVideo.play();
        setIsPlaying(true);
      }

      sourceVideo.pause();

      if (screen.orientation && (screen.orientation as any).lock) {
        (screen.orientation as any).lock("landscape").catch(() => {});
      }

      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
    };
  }, [isOpen, videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Sync back to source video when closing
  const handleClose = useCallback(() => {
    if (videoRef.current && fullscreenVideoRef.current) {
      const sourceVideo = videoRef.current;
      const fsVideo = fullscreenVideoRef.current;

      sourceVideo.currentTime = fsVideo.currentTime;
      sourceVideo.volume = fsVideo.volume;
      sourceVideo.muted = fsVideo.muted;
      sourceVideo.playbackRate = fsVideo.playbackRate;

      fsVideo.pause();
    }

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }

    setShowSpeedMenu(false);
    setShowVolumeSlider(false);
    setIsLocked(false);
    onClose();
  }, [videoRef, onClose]);

  // Format time
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Play/Pause
  const handlePlayPause = useCallback(() => {
    const video = fullscreenVideoRef.current;
    if (!video || isLocked) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      resetControlsTimeout();
    } else {
      video.pause();
      setIsPlaying(false);
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
  }, [isLocked, resetControlsTimeout]);

  // Time update
  const handleTimeUpdate = useCallback(() => {
    const video = fullscreenVideoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  // Buffered
  const handleProgress = useCallback(() => {
    const video = fullscreenVideoRef.current;
    if (!video || !video.buffered.length) return;

    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    setBuffered((bufferedEnd / video.duration) * 100);
  }, []);

  // Metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    const video = fullscreenVideoRef.current;
    if (!video) return;
    setDuration(video.duration);
  }, []);

  // Seek
  const handleSeek = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      const video = fullscreenVideoRef.current;
      if (!video || isLocked) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const percentage = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      video.currentTime = percentage * video.duration;

      resetControlsTimeout();
    },
    [isLocked, resetControlsTimeout]
  );

  // Skip
  const handleSkip = useCallback(
    (seconds: number) => {
      const video = fullscreenVideoRef.current;
      if (!video || isLocked) return;

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
    [isLocked, resetControlsTimeout]
  );

  // Volume
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const video = fullscreenVideoRef.current;
      if (!video) return;

      const clamped = Math.max(0, Math.min(1, newVolume));
      video.volume = clamped;
      video.muted = clamped === 0;
      setVolume(clamped);
      setIsMuted(clamped === 0);

      resetControlsTimeout();
    },
    [resetControlsTimeout]
  );

  // Mute toggle
  const handleMuteToggle = useCallback(() => {
    const video = fullscreenVideoRef.current;
    if (!video || isLocked) return;

    if (isMuted) {
      video.muted = false;
      video.volume = volume || 0.7;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }

    resetControlsTimeout();
  }, [isMuted, volume, isLocked, resetControlsTimeout]);

  // Playback speed
  const handleSpeedChange = useCallback(
    (speed: number) => {
      const video = fullscreenVideoRef.current;
      if (!video || isLocked) return;

      video.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);

      resetControlsTimeout();
    },
    [isLocked, resetControlsTimeout]
  );

  // Double tap to seek
  const handleDoubleTap = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isLocked) {
        setShowControls(true);
        resetControlsTimeout();
        return;
      }

      const now = Date.now();
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = e.changedTouches[0].clientX - rect.left;
      const timeSinceLastTap = now - lastTapRef.current;
      const distanceFromLastTap = Math.abs(tapX - lastTapXRef.current);

      if (timeSinceLastTap < 300 && distanceFromLastTap < 50) {
        const containerWidth = rect.width;

        if (tapX < containerWidth / 3) {
          handleSkip(-10);
        } else if (tapX > (containerWidth * 2) / 3) {
          handleSkip(10);
        } else {
          handlePlayPause();
        }
      } else {
        setShowControls((prev) => {
          const newValue = !prev;
          if (newValue && isPlaying) {
            setTimeout(() => resetControlsTimeout(), 0);
          }
          return newValue;
        });
      }

      lastTapRef.current = now;
      lastTapXRef.current = tapX;
    },
    [isLocked, handleSkip, handlePlayPause, isPlaying, resetControlsTimeout]
  );

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          handlePlayPause();
          break;
        case "Escape":
          handleClose();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSkip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSkip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case "m":
          e.preventDefault();
          handleMuteToggle();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    isLocked,
    handlePlayPause,
    handleClose,
    handleSkip,
    handleVolumeChange,
    handleMuteToggle,
    volume,
  ]);

  // Volume icon
  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Speed options
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      style={{ filter: `brightness(${brightness})` }}
    >
      {/* Video Element */}
      <video
        ref={fullscreenVideoRef}
        className="absolute inset-0 w-full h-full object-contain"
        src={videoRef.current?.currentSrc}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        webkit-playsinline="true"
      />

      {/* Touch Area for Double-Tap */}
      <div
        className="absolute inset-0 z-10"
        onTouchEnd={handleDoubleTap}
        onClick={() => {
          if (isLocked) {
            setShowControls(true);
            resetControlsTimeout();
            return;
          }

          setShowControls((prev) => {
            const newValue = !prev;
            if (newValue && isPlaying) {
              setTimeout(() => resetControlsTimeout(), 0);
            }
            return newValue;
          });
        }}
        onMouseMove={() => {
          if (!isLocked) {
            setShowControls(true);
            resetControlsTimeout();
          }
        }}
      />

      {/* Seek Indicators */}
      {seekIndicator && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none ${
            seekIndicator.side === "left" ? "left-12" : "right-12"
          }`}
        >
          <div className="flex flex-col items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full p-4 animate-fade-in">
            {seekIndicator.side === "left" ? (
              <RotateCcw className="w-8 h-8 text-white" />
            ) : (
              <FastForward className="w-8 h-8 text-white" />
            )}
            <span className="text-white text-sm font-medium">
              {seekIndicator.seconds}s
            </span>
          </div>
        </div>
      )}

      {/* Center Play/Pause Button (when paused) */}
      {!isPlaying && !isLocked && showControls && (
        <button
          onClick={handlePlayPause}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full transition-transform active:scale-90"
        >
          <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
        </button>
      )}

      {/* Top Controls Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 pb-16 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-11 h-11 text-white rounded-full bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Close fullscreen"
          >
            <Minimize className="w-5 h-5" />
          </button>

          {/* Title */}
          <h2 className="flex-1 text-white text-sm font-medium text-center px-4 truncate">
            {title}
          </h2>

          {/* Lock Button */}
          <button
            onClick={() => {
              setIsLocked(!isLocked);
              if (!isLocked) {
                setShowControls(true);
                setTimeout(() => setShowControls(false), 1500);
              }
            }}
            className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
              isLocked
                ? "bg-electric-500 text-white"
                : "bg-white/10 text-white active:bg-white/20"
            }`}
            aria-label={isLocked ? "Unlock controls" : "Lock controls"}
          >
            {isLocked ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Lock Indicator */}
      {isLocked && !showControls && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full">
            <Lock className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Tap to unlock</span>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-4 pt-16 transition-opacity duration-300 ${
          showControls && !isLocked
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar */}
        <div
          className="w-full h-10 flex items-center cursor-pointer mb-2 group/progress"
          onClick={handleSeek}
          onTouchMove={handleSeek}
        >
          <div className="w-full h-1.5 bg-white/30 rounded-full relative">
            <div
              className="absolute h-full bg-white/40 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="absolute h-full bg-electric-500 rounded-full"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg -translate-x-1/2" />
            </div>
          </div>
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/80 text-xs tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span className="text-white/80 text-xs tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="flex items-center justify-center w-12 h-12 text-white rounded-full bg-white/10 active:bg-white/20 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
              )}
            </button>

            <button
              onClick={() => handleSkip(-10)}
              className="flex items-center justify-center w-12 h-12 text-white rounded-full active:bg-white/10 transition-colors"
              aria-label="Skip back 10 seconds"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="flex items-center justify-center w-12 h-12 text-white rounded-full active:bg-white/10 transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <FastForward className="w-5 h-5" />
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Volume */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowVolumeSlider(!showVolumeSlider);
                  setShowSpeedMenu(false);
                  resetControlsTimeout();
                }}
                className="flex items-center justify-center w-12 h-12 text-white rounded-full active:bg-white/10 transition-colors"
                aria-label="Volume"
              >
                <VolumeIcon className="w-5 h-5" />
              </button>

              {showVolumeSlider && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-grey-900/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-white/10">
                  <div className="flex flex-col items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) =>
                        handleVolumeChange(parseFloat(e.target.value))
                      }
                      className="w-24 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:shadow-md"
                      style={{
                        writingMode: "vertical-lr" as any,
                        direction: "rtl",
                        height: "100px",
                        width: "8px",
                      }}
                    />
                    <button
                      onClick={handleMuteToggle}
                      className="p-2 text-white rounded-lg active:bg-white/10"
                    >
                      <VolumeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowVolumeSlider(false);
                  resetControlsTimeout();
                }}
                className="flex items-center justify-center w-12 h-12 text-white rounded-full active:bg-white/10 transition-colors"
                aria-label="Playback speed"
              >
                <span className="text-sm font-medium">{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-14 right-0 bg-grey-900/95 backdrop-blur-sm rounded-xl py-2 shadow-xl border border-white/10 min-w-[120px]">
                  <p className="px-4 py-1 text-xs text-white/50 uppercase tracking-wider">
                    Speed
                  </p>
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`w-full px-4 py-3 text-left text-sm active:bg-white/10 transition-colors ${
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

            {/* Brightness */}
            <button
              onClick={() => {
                setBrightness((prev) => {
                  if (prev === 1) return 0.7;
                  if (prev === 0.7) return 0.5;
                  return 1;
                });
                resetControlsTimeout();
              }}
              className="flex items-center justify-center w-12 h-12 text-white rounded-full active:bg-white/10 transition-colors"
              aria-label="Brightness"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Brightness Indicator */}
      {brightness !== 1 && showControls && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
          <span className="text-white text-xs">
            Brightness: {Math.round(brightness * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}