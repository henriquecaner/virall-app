import type { TrafficSource } from "@shared/schema";

const STORAGE_KEY = "traffic_source_data";

interface TrafficData extends TrafficSource {
  landingPage?: string;
  referrer?: string;
  capturedAt?: string;
}

function getSourceAndMediumFromReferrer(referrer: string): { source: string; medium: string } {
  if (!referrer) {
    return { source: "(direct)", medium: "(none)" };
  }

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes("google.")) {
      return { source: "google", medium: "organic" };
    }
    if (hostname.includes("facebook.") || hostname.includes("fb.")) {
      return { source: "facebook", medium: "social" };
    }
    if (hostname.includes("instagram.")) {
      return { source: "instagram", medium: "social" };
    }
    if (hostname.includes("linkedin.")) {
      return { source: "linkedin", medium: "social" };
    }
    if (hostname.includes("twitter.") || hostname.includes("t.co") || hostname.includes("x.com")) {
      return { source: "twitter", medium: "social" };
    }
    if (hostname.includes("youtube.")) {
      return { source: "youtube", medium: "social" };
    }
    if (hostname.includes("tiktok.")) {
      return { source: "tiktok", medium: "social" };
    }
    if (hostname.includes("bing.")) {
      return { source: "bing", medium: "organic" };
    }
    if (hostname.includes("yahoo.")) {
      return { source: "yahoo", medium: "organic" };
    }
    if (hostname.includes("duckduckgo.")) {
      return { source: "duckduckgo", medium: "organic" };
    }

    return { source: hostname.replace("www.", ""), medium: "referral" };
  } catch {
    return { source: "(direct)", medium: "(none)" };
  }
}

function getMediumFromUtmMedium(utmMedium: string): string {
  const medium = utmMedium.toLowerCase();
  
  const cpcVariants = ["cpc", "ppc", "paidsearch", "paid-search", "paid_search"];
  if (cpcVariants.includes(medium)) {
    return "cpc";
  }

  const displayVariants = ["display", "cpm", "banner"];
  if (displayVariants.includes(medium)) {
    return "display";
  }

  const socialVariants = ["social", "social-network", "social_network", "sm"];
  if (socialVariants.includes(medium)) {
    return "social";
  }

  const emailVariants = ["email", "e-mail", "newsletter"];
  if (emailVariants.includes(medium)) {
    return "email";
  }

  return medium;
}

export function captureTrafficSource(): void {
  const existingData = getStoredTrafficData();
  if (existingData) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer;

  const utmSource = urlParams.get("utm_source");
  const utmMedium = urlParams.get("utm_medium");
  const utmCampaign = urlParams.get("utm_campaign");
  const utmContent = urlParams.get("utm_content");
  const utmTerm = urlParams.get("utm_term");
  const gclid = urlParams.get("gclid");
  const fbclid = urlParams.get("fbclid");

  let trafficSource: string;
  let trafficMedium: string;

  if (gclid) {
    trafficSource = "google";
    trafficMedium = "cpc";
  } else if (fbclid) {
    trafficSource = "facebook";
    trafficMedium = "cpc";
  } else if (utmSource) {
    trafficSource = utmSource.toLowerCase();
    trafficMedium = utmMedium ? getMediumFromUtmMedium(utmMedium) : "(not set)";
  } else {
    const autoDetected = getSourceAndMediumFromReferrer(referrer);
    trafficSource = autoDetected.source;
    trafficMedium = autoDetected.medium;
  }

  const trafficData: TrafficData = {
    trafficSource,
    trafficMedium,
    trafficCampaign: utmCampaign || undefined,
    trafficContent: utmContent || undefined,
    trafficTerm: utmTerm || undefined,
    gclid: gclid || undefined,
    fbclid: fbclid || undefined,
    landingPage: window.location.pathname,
    referrer: referrer || undefined,
    capturedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trafficData));
  } catch {
  }
}

export function getStoredTrafficData(): TrafficData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as TrafficData;
  } catch {
    return null;
  }
}

export function getTrafficSourceForApi(): TrafficSource | null {
  const data = getStoredTrafficData();
  if (!data) return null;

  return {
    trafficSource: data.trafficSource,
    trafficMedium: data.trafficMedium,
    trafficCampaign: data.trafficCampaign,
    trafficContent: data.trafficContent,
    trafficTerm: data.trafficTerm,
    gclid: data.gclid,
    fbclid: data.fbclid,
  };
}

export function clearStoredTrafficData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}
