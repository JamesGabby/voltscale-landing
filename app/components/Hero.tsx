'use client';

import { Play, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import VideoPlayer from "./VideoPlayer";

export default function Hero() {
  return (
    <section className="relative pt-24 pb-3 md:pt-3 md:pb-3 lg:pt-20 lg:pb-0 overflow-hidden">
      {/* Subtle Background Gradient */}
      <div 
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-electric-100),transparent)]" 
        aria-hidden="true" 
      />
      
      <div className="container-custom">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          
          {/* Trust Badge */}
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-grey-700 bg-grey-100 rounded-full border border-grey-200/80">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-electric-500 text-primary-foreground">
              <CheckCircle2 className="w-3 h-3" />
            </span>
            <span>Trusted by 200+ B2B Companies</span>
          </div> */}

          {/* Headline - Above the Video */}
          {/* <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl text-balance">
            Stop Chasing Leads.
            <span className="block mt-2 text-electric-500">
              Start Closing Deals.
            </span>
          </h1> */}

          {/* Subheadline */}
          <p className="text-lg text-grey-600 sm:text-xl md:text-2xl max-w-4xl text-pretty leading-relaxed">
            <span className="font-bold text-foreground">For Software Agencies: How To Add $100k+ In Sales Pipeline In 60 Days Without Relying On Referrals Using AI-Augmented Intent Discovery And Personalized Cold Outbound At Scale</span>
          </p>

          {/* VSL Video Player - Center Stage */}
          <div className="relative w-full mt-5 md:mt-2">
            <VideoPlayer
              src="/videos/vsl-video.mp4"
              webmSrc="/videos/vsl-video.webm"
              poster="/videos/vsl-thumbnail.jpg"
              title="For Software Agencies: How To Add $100k+ In Sales Pipeline In 60 Days"
              autoplayOnScroll={false}
              onAnalyticsEvent={(event) => {
                // Send to your analytics service
                // Example: Google Analytics, Mixpanel, Segment, etc.
                console.log("Analytics Event:", event);

                // Example: Send to Google Analytics 4
                // if (typeof gtag !== 'undefined') {
                //   gtag('event', `video_${event.type}`, {
                //     video_current_time: event.currentTime,
                //     video_duration: event.duration,
                //     video_percent: event.percentage,
                //   });
                // }
              }}
            />
          </div>

          {/* Primary CTA - Below Video */}
          <div className="mt-3 md:mt-3 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="https://calendly.com/jamesgabbitus"
              target="_blank"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-primary-foreground bg-electric-500 rounded-xl transition-all duration-300 ease-out-expo hover:bg-electric-600 hover:shadow-xl hover:shadow-electric-500/25 hover:gap-3 active:scale-[0.98]"
            >
              Book a Call
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            
            {/* <span className="text-sm text-grey-500">
              Free 30-min consultation • No obligation
            </span> */}
          </div>

          {/* Social Proof Stats */}
          {/* <div className="mt-16 md:mt-20 pt-10 border-t border-grey-200 w-full">
            <dl className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
              <StatItem value="\$47M+" label="Pipeline Generated" />
              <StatItem value="200+" label="B2B Clients" />
              <StatItem value="3.2x" label="Avg. ROI" />
              <StatItem value="14 Days" label="To First Leads" />
            </dl>
          </div> */}
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <dt className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
        {value}
      </dt>
      <dd className="text-sm text-grey-500 md:text-base">
        {label}
      </dd>
    </div>
  );
}