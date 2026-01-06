import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '../lib/analytics';

export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Track initial page view and subsequent navigation
    if (prevLocationRef.current === null || location !== prevLocationRef.current) {
      trackPageView(location);
      prevLocationRef.current = location;
    }
  }, [location]);
};

export const useTrackPageView = () => {
  const [location] = useLocation();
  
  useEffect(() => {
    trackPageView(location);
  }, [location]);
};
