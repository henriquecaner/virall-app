import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { trackLogin, linkAuthenticatedUser, setUserDataForMatching } from "@/lib/analytics";
import { getTrafficSourceForApi, clearStoredTrafficData } from "@/lib/trafficTracking";
import { apiRequest } from "@/lib/queryClient";

const SESSION_LOGIN_TRACKED_KEY = "session_login_tracked";
const TRAFFIC_SOURCE_SENT_KEY = "traffic_source_sent";
const ANALYTICS_LINKED_KEY = "analytics_user_linked";

async function sendTrafficSource() {
  const trafficData = getTrafficSourceForApi();
  if (!trafficData) return;
  
  const alreadySent = localStorage.getItem(TRAFFIC_SOURCE_SENT_KEY);
  if (alreadySent) return;
  
  try {
    await apiRequest("POST", "/api/user/traffic-source", trafficData);
    localStorage.setItem(TRAFFIC_SOURCE_SENT_KEY, "true");
    clearStoredTrafficData();
  } catch (error) {
    console.error("Failed to send traffic source:", error);
  }
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const hasTrackedLogin = useRef(false);
  const hasAttemptedTrafficSource = useRef(false);
  const hasLinkedAnalytics = useRef(false);

  // Link authenticated user to analytics with Advanced Matching data
  useEffect(() => {
    if (user && !isLoading && !hasLinkedAnalytics.current) {
      const sessionLinked = sessionStorage.getItem(ANALYTICS_LINKED_KEY);
      
      if (!sessionLinked) {
        // Extract user data for Advanced Matching
        const userData = {
          email: user.email || undefined,
          phone: user.phone || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          city: user.location?.split(',')[0]?.trim() || undefined,
          state: user.location?.split(',')[1]?.trim() || undefined,
          country: 'br', // Default to Brazil for now
        };
        
        // Link user to analytics with Advanced Matching
        linkAuthenticatedUser(user.id, userData);
        
        // Also cache for subsequent events
        setUserDataForMatching(userData);
        
        sessionStorage.setItem(ANALYTICS_LINKED_KEY, "true");
        hasLinkedAnalytics.current = true;
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user && !isLoading && !hasTrackedLogin.current) {
      const sessionTracked = sessionStorage.getItem(SESSION_LOGIN_TRACKED_KEY);
      
      if (!sessionTracked) {
        trackLogin("replit_auth");
        sessionStorage.setItem(SESSION_LOGIN_TRACKED_KEY, "true");
        hasTrackedLogin.current = true;
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user && !isLoading && !hasAttemptedTrafficSource.current) {
      hasAttemptedTrafficSource.current = true;
      sendTrafficSource();
    }
  }, [user, isLoading]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
