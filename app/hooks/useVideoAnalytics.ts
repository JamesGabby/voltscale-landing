// app/hooks/useVideoAnalytics.ts
"use client";

import { useCallback } from "react";

interface VideoEvent {
  type: string;
  currentTime: number;
  duration: number;
  percentage: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export function useVideoAnalytics(videoName: string) {
  const trackEvent = useCallback(
    (event: VideoEvent) => {
      // Console logging for development
      if (process.env.NODE_ENV === "development") {
        console.log(`[${videoName}]`, event);
      }

      // Send to your backend API
      fetch("/api/analytics/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoName,
          ...event,
        }),
      }).catch(console.error);

      // Google Analytics
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", `video_${event.type}`, {
          video_name: videoName,
          video_percent: Math.round(event.percentage),
        });
      }
    },
    [videoName]
  );

  return { trackEvent };
}