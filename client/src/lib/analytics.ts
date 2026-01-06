// Product Analytics Library
// Unified tracking for GA4, Google Ads, and Meta Pixel
// With enriched event data: geolocation, device, browser, traffic source, persistent User ID

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// ============================================
// ENRICHED CONTEXT DATA TYPES
// ============================================

interface GeoData {
  country: string;
  country_code: string;
  state: string;
  city: string;
  timezone: string;
  ip: string;
}

interface DeviceData {
  type: 'desktop' | 'tablet' | 'mobile';
  os: string;
  os_version: string;
  browser: string;
  browser_version: string;
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
  language: string;
  is_touch: boolean;
}

interface TrafficData {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  referrer: string;
  landing_page: string;
}

// User data for Meta Advanced Matching
interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface EnrichedContext {
  timestamp: string;
  timestamp_local: string;
  user_id: string;
  session_id: string;
  geo: GeoData;
  device: DeviceData;
  traffic: TrafficData;
}

// Cache for context data (avoid repeated API calls)
let cachedGeoData: GeoData | null = null;
let cachedDeviceData: DeviceData | null = null;
let cachedTrafficData: TrafficData | null = null;
let cachedUserData: UserData | null = null;

// Context readiness state
let contextReady = false;
let contextReadyPromise: Promise<void> | null = null;
let contextReadyResolve: (() => void) | null = null;

// Event queue for events fired before context is ready
interface QueuedEvent {
  type: 'button_click' | 'copy_content';
  args: any[];
}
const eventQueue: QueuedEvent[] = [];

// Initialize the context ready promise
const initContextReadyPromise = () => {
  if (!contextReadyPromise) {
    contextReadyPromise = new Promise((resolve) => {
      contextReadyResolve = resolve;
    });
  }
};

// Mark context as ready and flush queued events
const markContextReady = () => {
  contextReady = true;
  if (contextReadyResolve) {
    contextReadyResolve();
  }
  // Flush queued events
  while (eventQueue.length > 0) {
    const event = eventQueue.shift()!;
    if (event.type === 'button_click') {
      trackButtonClickInternal(event.args[0], event.args[1]);
    } else if (event.type === 'copy_content') {
      trackCopyContentInternal(event.args[0]);
    }
  }
};

// Check if context is ready
export const isContextReady = (): boolean => contextReady;

// ============================================
// USER ID MANAGEMENT (Persistent for Cohort Analysis)
// ============================================

const USER_ID_KEY = 'virall_analytics_user_id';
const SESSION_ID_KEY = 'virall_analytics_session_id';

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getUserId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

// Link authenticated user to analytics ID with Advanced Matching data
export const linkAuthenticatedUser = async (
  authUserId: string,
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    country?: string;
  }
) => {
  const analyticsUserId = getUserId();
  
  // Store mapping for cross-reference
  localStorage.setItem('virall_auth_user_id', authUserId);
  
  // Cache user data for subsequent events
  if (userData) {
    cachedUserData = userData;
  }
  
  // Ensure config is loaded
  const config = await fetchAnalyticsConfig();
  
  // Set in GA4
  if (window.gtag) {
    window.gtag('set', 'user_id', authUserId);
    window.gtag('set', 'user_properties', {
      analytics_id: analyticsUserId,
      auth_user_id: authUserId,
      // Include user data if available
      ...(userData?.email && { user_email_provided: true }),
      ...(userData?.phone && { user_phone_provided: true }),
    });
  }
  
  // Set in Meta Pixel with Advanced Matching parameters
  if (window.fbq && config.meta_pixel_id) {
    const advancedMatchingData: Record<string, string | undefined> = {
      external_id: authUserId,
      // Cookies (não hash)
      fbc: getFbcCookie(),
      fbp: getFbpCookie(),
    };
    
    // Add user data for Advanced Matching (Meta will hash automatically)
    if (userData) {
      if (userData.email) advancedMatchingData.em = normalizeForMeta(userData.email);
      if (userData.phone) advancedMatchingData.ph = normalizePhoneForMeta(userData.phone);
      if (userData.firstName) advancedMatchingData.fn = normalizeForMeta(userData.firstName);
      if (userData.lastName) advancedMatchingData.ln = normalizeForMeta(userData.lastName);
      if (userData.city) advancedMatchingData.ct = normalizeCityForMeta(userData.city);
      if (userData.state) advancedMatchingData.st = normalizeStateForMeta(userData.state);
      if (userData.country) advancedMatchingData.country = normalizeCountryForMeta(userData.country);
    }
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(advancedMatchingData).filter(([_, v]) => v !== undefined)
    );
    
    window.fbq('init', config.meta_pixel_id, cleanData);
    console.log('[Analytics] Meta Pixel Advanced Matching initialized:', {
      hasEmail: !!userData?.email,
      hasPhone: !!userData?.phone,
      hasName: !!userData?.firstName,
      hasFbc: !!advancedMatchingData.fbc,
      hasFbp: !!advancedMatchingData.fbp,
    });
  }
};

// ============================================
// GEOLOCATION DATA (via IP API)
// ============================================

const fetchGeoData = async (): Promise<GeoData> => {
  if (cachedGeoData) return cachedGeoData;
  
  try {
    // Using ipapi.co (HTTPS, free tier: 1000 requests/day)
    const response = await fetch('https://ipapi.co/json/', {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Geo API failed');
    
    const data = await response.json();
    
    cachedGeoData = {
      country: data.country_name || 'Unknown',
      country_code: data.country_code || 'XX',
      state: data.region || 'Unknown',
      city: data.city || 'Unknown',
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      ip: data.ip || ''
    };
  } catch (error) {
    console.warn('[Analytics] Geo lookup failed, using fallback:', error);
    // Fallback: use timezone to infer basic location
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isBrazil = timezone.startsWith('America/Sao_Paulo') || timezone.startsWith('America/Fortaleza');
    
    cachedGeoData = {
      country: isBrazil ? 'Brazil' : 'Unknown',
      country_code: isBrazil ? 'BR' : 'XX',
      state: 'Unknown',
      city: 'Unknown',
      timezone: timezone,
      ip: ''
    };
  }
  
  return cachedGeoData;
};

// ============================================
// DEVICE & BROWSER DETECTION
// ============================================

const getDeviceData = (): DeviceData => {
  if (cachedDeviceData) return cachedDeviceData;
  
  const ua = navigator.userAgent;
  
  // Detect device type
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android/i.test(ua) && !/Mobile/i.test(ua);
  const deviceType = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');
  
  // Detect OS
  let os = 'Unknown';
  let osVersion = '';
  if (/Windows NT 10/.test(ua)) { os = 'Windows'; osVersion = '10'; }
  else if (/Windows NT 6.3/.test(ua)) { os = 'Windows'; osVersion = '8.1'; }
  else if (/Windows/.test(ua)) { os = 'Windows'; }
  else if (/Mac OS X/.test(ua)) { 
    os = 'macOS'; 
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  }
  else if (/Linux/.test(ua)) { os = 'Linux'; }
  else if (/Android/.test(ua)) { 
    os = 'Android';
    const match = ua.match(/Android (\d+(\.\d+)?)/);
    osVersion = match ? match[1] : '';
  }
  else if (/iOS|iPhone|iPad/.test(ua)) { 
    os = 'iOS';
    const match = ua.match(/OS (\d+_\d+)/);
    osVersion = match ? match[1].replace('_', '.') : '';
  }
  
  // Detect Browser
  let browser = 'Unknown';
  let browserVersion = '';
  if (/Edg\//.test(ua)) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+(\.\d+)?)/);
    browserVersion = match ? match[1] : '';
  } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+(\.\d+)?)/);
    browserVersion = match ? match[1] : '';
  } else if (/Firefox\//.test(ua)) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+(\.\d+)?)/);
    browserVersion = match ? match[1] : '';
  } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+(\.\d+)?)/);
    browserVersion = match ? match[1] : '';
  } else if (/Opera|OPR/.test(ua)) {
    browser = 'Opera';
  }
  
  cachedDeviceData = {
    type: deviceType,
    os,
    os_version: osVersion,
    browser,
    browser_version: browserVersion,
    screen_width: screen.width,
    screen_height: screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    language: navigator.language,
    is_touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
  
  return cachedDeviceData;
};

// ============================================
// TRAFFIC SOURCE DETECTION
// ============================================

const getTrafficData = (): TrafficData => {
  if (cachedTrafficData) return cachedTrafficData;
  
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  
  // Parse UTM parameters
  const utmSource = urlParams.get('utm_source') || '';
  const utmMedium = urlParams.get('utm_medium') || '';
  const utmCampaign = urlParams.get('utm_campaign') || '';
  const utmTerm = urlParams.get('utm_term') || '';
  const utmContent = urlParams.get('utm_content') || '';
  
  // Auto-detect source if no UTM
  let source = utmSource;
  let medium = utmMedium;
  
  if (!source && referrer) {
    const referrerUrl = new URL(referrer);
    const hostname = referrerUrl.hostname;
    
    // Detect common sources
    if (hostname.includes('google.')) {
      source = 'google';
      medium = hostname.includes('ads.google') ? 'cpc' : 'organic';
    } else if (hostname.includes('facebook.') || hostname.includes('fb.')) {
      source = 'facebook';
      medium = 'social';
    } else if (hostname.includes('instagram.')) {
      source = 'instagram';
      medium = 'social';
    } else if (hostname.includes('linkedin.')) {
      source = 'linkedin';
      medium = 'social';
    } else if (hostname.includes('twitter.') || hostname.includes('x.com')) {
      source = 'twitter';
      medium = 'social';
    } else if (hostname.includes('youtube.')) {
      source = 'youtube';
      medium = 'video';
    } else if (hostname.includes('bing.')) {
      source = 'bing';
      medium = 'organic';
    } else {
      source = hostname;
      medium = 'referral';
    }
  } else if (!source) {
    source = '(direct)';
    medium = '(none)';
  }
  
  // Store first touch attribution
  const FIRST_TOUCH_KEY = 'virall_first_touch';
  if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
    localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify({
      source, medium, campaign: utmCampaign, timestamp: new Date().toISOString()
    }));
  }
  
  // Store landing page on first visit
  const LANDING_PAGE_KEY = 'virall_landing_page';
  let landingPage = sessionStorage.getItem(LANDING_PAGE_KEY);
  if (!landingPage) {
    landingPage = window.location.pathname + window.location.search;
    sessionStorage.setItem(LANDING_PAGE_KEY, landingPage);
  }
  
  cachedTrafficData = {
    source,
    medium,
    campaign: utmCampaign,
    term: utmTerm,
    content: utmContent,
    referrer: referrer || '(direct)',
    landing_page: landingPage
  };
  
  return cachedTrafficData;
};

// ============================================
// BUILD ENRICHED CONTEXT
// ============================================

export const getEnrichedContext = async (): Promise<EnrichedContext> => {
  const now = new Date();
  const geoData = await fetchGeoData();
  const deviceData = getDeviceData();
  const trafficData = getTrafficData();
  
  return {
    timestamp: now.toISOString(),
    timestamp_local: now.toLocaleString('pt-BR', { 
      timeZone: geoData.timezone,
      dateStyle: 'full',
      timeStyle: 'long'
    }),
    user_id: getUserId(),
    session_id: getSessionId(),
    geo: geoData,
    device: deviceData,
    traffic: trafficData
  };
};

// Sync version for immediate events (uses cached data)
export const getEnrichedContextSync = (): Partial<EnrichedContext> => {
  const now = new Date();
  
  return {
    timestamp: now.toISOString(),
    timestamp_local: now.toLocaleString('pt-BR'),
    user_id: getUserId(),
    session_id: getSessionId(),
    geo: cachedGeoData || undefined,
    device: getDeviceData(),
    traffic: getTrafficData()
  };
};

// ============================================
// ANALYTICS CONFIG (fetched from server at runtime)
// ============================================

interface AnalyticsConfig {
  ga_measurement_id: string;
  google_ads_id: string;
  meta_pixel_id: string;
  google_ads_signup_label: string;
  google_ads_content_label: string;
  google_ads_purchase_label: string;
  google_ads_churn_label: string;
}

let analyticsConfig: AnalyticsConfig | null = null;

const fetchAnalyticsConfig = async (): Promise<AnalyticsConfig> => {
  if (analyticsConfig) return analyticsConfig;
  
  try {
    const response = await fetch('/api/analytics/config');
    if (!response.ok) throw new Error('Failed to fetch analytics config');
    analyticsConfig = await response.json();
    return analyticsConfig!;
  } catch (error) {
    console.warn('[Analytics] Failed to fetch config from server:', error);
    // Return empty config as fallback
    analyticsConfig = {
      ga_measurement_id: '',
      google_ads_id: '',
      meta_pixel_id: '',
      google_ads_signup_label: '',
      google_ads_content_label: '',
      google_ads_purchase_label: '',
      google_ads_churn_label: '',
    };
    return analyticsConfig;
  }
};

// Sync getter for config (returns cached value or empty)
export const getAnalyticsConfig = (): AnalyticsConfig => {
  return analyticsConfig || {
    ga_measurement_id: '',
    google_ads_id: '',
    meta_pixel_id: '',
    google_ads_signup_label: '',
    google_ads_content_label: '',
    google_ads_purchase_label: '',
    google_ads_churn_label: '',
  };
};

// ============================================
// INITIALIZATION
// ============================================

const initGA = (config: AnalyticsConfig) => {
  const measurementId = config.ga_measurement_id;
  const adsId = config.google_ads_id;

  if (!measurementId && !adsId) {
    console.warn('[Analytics] No Google tracking IDs configured');
    return;
  }

  // Add Google Analytics/Ads script
  const primaryId = measurementId || adsId;
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
  document.head.appendChild(script1);

  // Initialize gtag with user ID
  const userId = getUserId();
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    ${measurementId ? `gtag('config', '${measurementId}', { 'user_id': '${userId}' });` : ''}
    ${adsId ? `gtag('config', '${adsId}');` : ''}
  `;
  document.head.appendChild(script2);

  console.log('[Analytics] Google Analytics initialized with User ID:', userId);
};

const initMetaPixel = (config: AnalyticsConfig) => {
  const pixelId = config.meta_pixel_id;

  if (!pixelId) {
    console.warn('[Analytics] Meta Pixel ID not configured');
    return;
  }

  const userId = getUserId();

  // Meta Pixel initialization script with external_id
  const script = document.createElement('script');
  script.textContent = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}', { external_id: '${userId}' });
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // Add noscript fallback
  const noscript = document.createElement('noscript');
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.net/tr?id=${pixelId}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);

  console.log('[Analytics] Meta Pixel initialized with User ID:', userId);
};

export const initAllAnalytics = async () => {
  // Initialize the context ready promise before anything else
  initContextReadyPromise();
  
  // Fetch analytics config from server (runtime)
  const config = await fetchAnalyticsConfig();
  
  // Initialize analytics platforms with config
  initGA(config);
  initMetaPixel(config);
  
  // Pre-fetch all context data before marking ready
  await fetchGeoData();
  getDeviceData(); // Cache device data
  getTrafficData(); // Cache traffic data
  
  // Mark context as ready and flush any queued events
  markContextReady();
  
  console.log('[Analytics] All platforms initialized with enriched context');
};

// ============================================
// ENRICHED PAGE VIEW TRACKING
// ============================================

export const trackPageView = async (url: string) => {
  const context = await getEnrichedContext();
  const config = getAnalyticsConfig();
  
  // GA4 Page View with enriched data
  if (typeof window !== 'undefined' && window.gtag) {
    const measurementId = config.ga_measurement_id;
    if (measurementId) {
      window.gtag('config', measurementId, {
        page_path: url,
        user_id: context.user_id,
        // Custom dimensions (must be configured in GA4)
        country: context.geo.country,
        state: context.geo.state,
        city: context.geo.city,
        device_type: context.device.type,
        browser: context.device.browser,
        traffic_source: context.traffic.source,
        traffic_medium: context.traffic.medium
      });
    }
  }

  // Meta Pixel Page View with enriched data
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView', buildMetaParams(context));
  }
  
  console.log('[Analytics] PageView tracked:', url, context);
};

// ============================================
// ENRICHED GENERIC EVENT TRACKING
// ============================================

export const trackEvent = async (
  action: string,
  category?: string,
  label?: string,
  value?: number,
  customParams?: Record<string, any>
) => {
  const context = await getEnrichedContext();
  
  // GA4 Event with full context
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      // Enriched context
      event_timestamp: context.timestamp,
      user_id: context.user_id,
      session_id: context.session_id,
      country: context.geo.country,
      country_code: context.geo.country_code,
      state: context.geo.state,
      city: context.geo.city,
      timezone: context.geo.timezone,
      device_type: context.device.type,
      os: context.device.os,
      os_version: context.device.os_version,
      browser: context.device.browser,
      browser_version: context.device.browser_version,
      screen_resolution: `${context.device.screen_width}x${context.device.screen_height}`,
      viewport: `${context.device.viewport_width}x${context.device.viewport_height}`,
      language: context.device.language,
      is_touch_device: context.device.is_touch,
      traffic_source: context.traffic.source,
      traffic_medium: context.traffic.medium,
      campaign: context.traffic.campaign,
      referrer: context.traffic.referrer,
      landing_page: context.traffic.landing_page,
      ...customParams
    });
  }
  
  console.log('[Analytics] Event tracked:', action, { category, label, value, context });
};

// Sync version for immediate events (button clicks, etc.)
export const trackEventSync = (
  action: string,
  category?: string,
  label?: string,
  value?: number,
  customParams?: Record<string, any>
) => {
  const context = getEnrichedContextSync();
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      event_timestamp: context.timestamp,
      user_id: context.user_id,
      session_id: context.session_id,
      country: context.geo?.country,
      state: context.geo?.state,
      city: context.geo?.city,
      device_type: context.device?.type,
      browser: context.device?.browser,
      traffic_source: context.traffic?.source,
      traffic_medium: context.traffic?.medium,
      ...customParams
    });
  }
};

// ============================================
// CONVERSION EVENTS (Enriched)
// ============================================

// Track user signup/registration
export const trackSignup = async (method?: string) => {
  const context = await getEnrichedContext();
  
  // GA4
  if (window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method || 'replit_auth',
      ...flattenContext(context)
    });
  }

  // Google Ads conversion (if configured)
  const config = getAnalyticsConfig();
  if (window.gtag && config.google_ads_signup_label) {
    window.gtag('event', 'conversion', {
      send_to: config.google_ads_signup_label
    });
  }

  // Meta Pixel with enriched data
  if (window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: method || 'replit_auth',
      ...buildMetaParams(context)
    });
  }
  
  console.log('[Analytics] Signup tracked:', method, context);
};

// Track waitlist signup
export const trackWaitlistSignup = async (position?: string) => {
  const context = await getEnrichedContext();
  
  // GA4
  if (window.gtag) {
    window.gtag('event', 'generate_lead', {
      event_category: 'waitlist',
      event_label: position || 'waitlist_signup',
      ...flattenContext(context)
    });
  }

  // Google Ads conversion (if configured)
  const config = getAnalyticsConfig();
  if (window.gtag && config.google_ads_signup_label) {
    window.gtag('event', 'conversion', {
      send_to: config.google_ads_signup_label
    });
  }

  // Meta Pixel with enriched data
  if (window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: 'waitlist_signup',
      content_category: position || 'landing',
      ...buildMetaParams(context)
    });
  }
  
  console.log('[Analytics] Waitlist signup tracked:', position, context);
};

// Track user login
export const trackLogin = async (method?: string) => {
  const context = await getEnrichedContext();
  
  // GA4
  if (window.gtag) {
    window.gtag('event', 'login', {
      method: method || 'replit_auth',
      event_category: 'auth',
      event_label: 'user_login',
      ...flattenContext(context)
    });
  }

  // Meta Pixel - Custom event for login
  if (window.fbq) {
    window.fbq('trackCustom', 'Login', {
      content_name: 'user_login',
      method: method || 'replit_auth',
      ...buildMetaParams(context)
    });
  }
  
  console.log('[Analytics] Login tracked:', method, context);
};

// Track user logout
export const trackLogout = async (reason?: string) => {
  const context = await getEnrichedContext();
  
  // GA4
  if (window.gtag) {
    window.gtag('event', 'logout', {
      event_category: 'auth',
      event_label: 'user_logout',
      logout_reason: reason || 'manual',
      ...flattenContext(context)
    });
  }

  // Meta Pixel - Custom event for logout
  if (window.fbq) {
    window.fbq('trackCustom', 'Logout', {
      content_name: 'user_logout',
      logout_reason: reason || 'manual',
      ...buildMetaParams(context)
    });
  }
  
  console.log('[Analytics] Logout tracked:', reason, context);
};

// Track account deletion
export const trackAccountDeleted = async (reason?: string, feedbackProvided?: boolean) => {
  const context = await getEnrichedContext();
  
  // GA4
  if (window.gtag) {
    window.gtag('event', 'account_deleted', {
      event_category: 'auth',
      event_label: 'account_deletion',
      deletion_reason: reason || 'not_provided',
      feedback_provided: feedbackProvided || false,
      ...flattenContext(context)
    });
  }

  // Google Ads conversion (if configured for churn tracking)
  const config = getAnalyticsConfig();
  if (window.gtag && config.google_ads_churn_label) {
    window.gtag('event', 'conversion', {
      send_to: config.google_ads_churn_label
    });
  }

  // Meta Pixel - Custom event for account deletion
  if (window.fbq) {
    window.fbq('trackCustom', 'AccountDeleted', {
      content_name: 'account_deletion',
      deletion_reason: reason || 'not_provided',
      feedback_provided: feedbackProvided || false,
      ...buildMetaParams(context)
    });
  }
  
  console.log('[Analytics] Account deletion tracked:', { reason, feedbackProvided }, context);
};

// Track onboarding completion
export const trackOnboardingComplete = async () => {
  const context = await getEnrichedContext();
  
  // GA4
  if (window.gtag) {
    window.gtag('event', 'onboarding_complete', {
      event_category: 'engagement',
      event_label: 'profile_setup',
      ...flattenContext(context)
    });
  }

  // Meta Pixel - Lead event for onboarding with enriched data
  if (window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: 'onboarding_complete',
      ...buildMetaParams(context)
    });
  }
};

// Track content creation started
export const trackContentStarted = async (step: number, contentType?: string) => {
  const context = await getEnrichedContext();
  
  if (window.gtag) {
    window.gtag('event', 'content_started', {
      event_category: 'content',
      event_label: contentType || 'linkedin_post',
      step: step,
      ...flattenContext(context)
    });
  }

  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: 'content_creation',
      content_type: contentType || 'linkedin_post',
      ...buildMetaParams(context)
    });
  }
};

// Track content creation completed (post saved)
export const trackContentCompleted = async (score?: number) => {
  const context = await getEnrichedContext();
  
  // GA4
  if (window.gtag) {
    window.gtag('event', 'content_completed', {
      event_category: 'content',
      event_label: 'post_saved',
      value: score,
      ...flattenContext(context)
    });
  }

  // Google Ads conversion
  const config = getAnalyticsConfig();
  if (window.gtag && config.google_ads_content_label) {
    window.gtag('event', 'conversion', {
      send_to: config.google_ads_content_label
    });
  }

  // Meta Pixel - Custom event for content with enriched data
  if (window.fbq) {
    window.fbq('trackCustom', 'ContentCreated', {
      score: score,
      ...buildMetaParams(context)
    });
  }
};

// Track subscription/purchase
export const trackPurchase = async (value: number, currency: string = 'BRL', planName?: string) => {
  const context = await getEnrichedContext();
  
  // GA4 Purchase
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      currency: currency,
      value: value,
      items: [{
        item_name: planName || 'subscription',
        price: value,
        quantity: 1
      }],
      ...flattenContext(context)
    });
  }

  // Google Ads conversion
  const config = getAnalyticsConfig();
  if (window.gtag && config.google_ads_purchase_label) {
    window.gtag('event', 'conversion', {
      send_to: config.google_ads_purchase_label,
      value: value,
      currency: currency
    });
  }

  // Meta Pixel Purchase with enriched data
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value: value,
      currency: currency,
      content_name: planName || 'subscription',
      ...buildMetaParams(context)
    });
  }
};

// Track subscription started (checkout initiated)
export const trackCheckoutStarted = async (value: number, currency: string = 'BRL') => {
  const context = await getEnrichedContext();
  
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: currency,
      value: value,
      ...flattenContext(context)
    });
  }

  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      value: value,
      currency: currency,
      ...buildMetaParams(context)
    });
  }
};

// ============================================
// ENGAGEMENT EVENTS (Enriched)
// ============================================

// Internal button click tracking (called when context is ready)
const trackButtonClickInternal = (buttonName: string, location?: string) => {
  const context = getEnrichedContextSync();
  
  if (window.gtag) {
    window.gtag('event', 'button_click', {
      event_category: 'engagement',
      event_label: buttonName,
      button_location: location,
      user_id: context.user_id,
      session_id: context.session_id,
      country: context.geo?.country,
      state: context.geo?.state,
      city: context.geo?.city,
      device_type: context.device?.type,
      browser: context.device?.browser,
      traffic_source: context.traffic?.source,
      traffic_medium: context.traffic?.medium
    });
  }
  
  // Meta Pixel custom event for button clicks
  if (window.fbq) {
    window.fbq('trackCustom', 'ButtonClick', {
      button_name: buttonName,
      button_location: location,
      ...buildMetaParams(context)
    });
  }
};

// Track button clicks - queues event if context not ready
export const trackButtonClick = (buttonName: string, location?: string) => {
  if (contextReady) {
    trackButtonClickInternal(buttonName, location);
  } else {
    // Queue the event to be fired when context is ready
    eventQueue.push({ type: 'button_click', args: [buttonName, location] });
    console.log('[Analytics] Button click queued, waiting for context:', buttonName);
  }
};

// Track feature usage
export const trackFeatureUsage = async (featureName: string, details?: string) => {
  const context = await getEnrichedContext();
  
  if (window.gtag) {
    window.gtag('event', 'feature_used', {
      event_category: 'engagement',
      event_label: featureName,
      details: details,
      ...flattenContext(context)
    });
  }

  // Meta Pixel custom event for feature usage
  if (window.fbq) {
    window.fbq('trackCustom', 'FeatureUsed', {
      feature_name: featureName,
      feature_details: details,
      ...buildMetaParams(context)
    });
  }
};

// Track AI generation events
export const trackAIGeneration = async (step: string, regeneration: boolean = false) => {
  const context = await getEnrichedContext();
  
  if (window.gtag) {
    window.gtag('event', 'ai_generation', {
      event_category: 'ai',
      event_label: step,
      regeneration: regeneration,
      ...flattenContext(context)
    });
  }

  // Meta Pixel custom event for AI generation
  if (window.fbq) {
    window.fbq('trackCustom', 'AIGeneration', {
      generation_step: step,
      is_regeneration: regeneration,
      ...buildMetaParams(context)
    });
  }
};

// Internal copy tracking (called when context is ready)
const trackCopyContentInternal = (contentType: string) => {
  const context = getEnrichedContextSync();
  
  if (window.gtag) {
    window.gtag('event', 'copy_content', {
      event_category: 'engagement',
      event_label: contentType,
      user_id: context.user_id,
      session_id: context.session_id,
      country: context.geo?.country,
      state: context.geo?.state,
      city: context.geo?.city,
      device_type: context.device?.type,
      browser: context.device?.browser,
      traffic_source: context.traffic?.source
    });
  }
  
  // Meta Pixel custom event for copy
  if (window.fbq) {
    window.fbq('trackCustom', 'CopyContent', {
      content_type: contentType,
      ...buildMetaParams(context)
    });
  }
};

// Track copy to clipboard - queues event if context not ready
export const trackCopyContent = (contentType: string) => {
  if (contextReady) {
    trackCopyContentInternal(contentType);
  } else {
    // Queue the event to be fired when context is ready
    eventQueue.push({ type: 'copy_content', args: [contentType] });
    console.log('[Analytics] Copy content queued, waiting for context:', contentType);
  }
};

// ============================================
// USER PROPERTIES
// ============================================

// Set user properties for better segmentation
export const setUserProperties = async (properties: {
  userId?: string;
  industry?: string;
  creatorArchetype?: string;
  hasSubscription?: boolean;
}) => {
  const context = await getEnrichedContext();
  
  if (window.gtag) {
    window.gtag('set', 'user_properties', {
      user_id: properties.userId || context.user_id,
      analytics_user_id: context.user_id,
      industry: properties.industry,
      creator_archetype: properties.creatorArchetype,
      subscription_status: properties.hasSubscription ? 'active' : 'free',
      country: context.geo.country,
      city: context.geo.city,
      device_type: context.device.type,
      first_traffic_source: context.traffic.source
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get cookie value by name
const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
};

// Get Meta fbc cookie (Facebook Click ID)
const getFbcCookie = (): string | undefined => getCookie('_fbc');

// Get Meta fbp cookie (Facebook Browser ID)
const getFbpCookie = (): string | undefined => getCookie('_fbp');

// Normalize string for Meta (lowercase, no special chars, no spaces)
const normalizeForMeta = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return value.toLowerCase().trim();
};

// Normalize city for Meta (lowercase, no spaces)
const normalizeCityForMeta = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return value.toLowerCase().replace(/\s+/g, '');
};

// Normalize phone for Meta (only digits, with country code)
const normalizePhoneForMeta = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  // If Brazilian phone without country code, add 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
};

// Normalize state to 2-letter code (for Brazil)
const normalizeStateForMeta = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  // If already 2 letters, return lowercase
  if (value.length === 2) return value.toLowerCase();
  // Brazilian state name to code mapping
  const stateMap: Record<string, string> = {
    'acre': 'ac', 'alagoas': 'al', 'amapá': 'ap', 'amazonas': 'am',
    'bahia': 'ba', 'ceará': 'ce', 'distrito federal': 'df', 'espírito santo': 'es',
    'goiás': 'go', 'maranhão': 'ma', 'mato grosso': 'mt', 'mato grosso do sul': 'ms',
    'minas gerais': 'mg', 'pará': 'pa', 'paraíba': 'pb', 'paraná': 'pr',
    'pernambuco': 'pe', 'piauí': 'pi', 'rio de janeiro': 'rj', 'rio grande do norte': 'rn',
    'rio grande do sul': 'rs', 'rondônia': 'ro', 'roraima': 'rr', 'santa catarina': 'sc',
    'são paulo': 'sp', 'sergipe': 'se', 'tocantins': 'to'
  };
  return stateMap[value.toLowerCase()] || value.substring(0, 2).toLowerCase();
};

// Normalize country to 2-letter ISO code
const normalizeCountryForMeta = (value: string | undefined, countryCode?: string): string | undefined => {
  if (countryCode) return countryCode.toLowerCase();
  if (!value) return undefined;
  // Common mappings
  const countryMap: Record<string, string> = {
    'brazil': 'br', 'brasil': 'br', 'united states': 'us', 'usa': 'us',
    'portugal': 'pt', 'argentina': 'ar', 'chile': 'cl', 'mexico': 'mx'
  };
  return countryMap[value.toLowerCase()] || value.substring(0, 2).toLowerCase();
};

// Set user data for Advanced Matching (call when user logs in or updates profile)
export const setUserDataForMatching = (userData: UserData) => {
  cachedUserData = userData;
  console.log('[Analytics] User data set for Advanced Matching:', {
    hasEmail: !!userData.email,
    hasPhone: !!userData.phone,
    hasName: !!userData.firstName,
    hasLastName: !!userData.lastName,
    hasLocation: !!userData.city || !!userData.state || !!userData.country
  });
};

// Get current user data
export const getUserDataForMatching = (): UserData | null => cachedUserData;

// Build Meta Pixel enriched params with ALL recommended parameters
const buildMetaParams = (context: EnrichedContext | Partial<EnrichedContext>): Record<string, any> => {
  const userData = cachedUserData || {};
  
  return {
    // === IDENTIFIERS (não hash) ===
    external_id: context.user_id,
    fbc: getFbcCookie(), // Facebook Click ID cookie
    fbp: getFbpCookie(), // Facebook Browser ID cookie
    client_ip_address: context.geo?.ip, // IP do cliente
    client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    
    // === DADOS DO USUÁRIO (hash automático pelo Pixel) ===
    em: normalizeForMeta(userData.email), // Email
    ph: normalizePhoneForMeta(userData.phone), // Telefone com código do país
    fn: normalizeForMeta(userData.firstName), // Primeiro nome
    ln: normalizeForMeta(userData.lastName), // Sobrenome
    
    // === LOCALIZAÇÃO (hash automático pelo Pixel) ===
    ct: normalizeCityForMeta(userData.city || context.geo?.city), // Cidade
    st: normalizeStateForMeta(userData.state || context.geo?.state), // Estado (2 letras)
    zp: userData.zipCode?.replace(/\D/g, ''), // CEP (só números)
    country: normalizeCountryForMeta(userData.country || context.geo?.country, context.geo?.country_code),
    
    // === DADOS CUSTOMIZADOS PARA ENRIQUECIMENTO ===
    device_type: context.device?.type,
    browser: context.device?.browser,
    os: context.device?.os,
    traffic_source: context.traffic?.source,
    traffic_medium: context.traffic?.medium,
    landing_page: context.traffic?.landing_page,
    session_id: context.session_id
  };
};

// Flatten context for GA4 event parameters
const flattenContext = (context: EnrichedContext): Record<string, any> => ({
  event_timestamp: context.timestamp,
  event_timestamp_local: context.timestamp_local,
  user_id: context.user_id,
  session_id: context.session_id,
  country: context.geo.country,
  country_code: context.geo.country_code,
  state: context.geo.state,
  city: context.geo.city,
  timezone: context.geo.timezone,
  device_type: context.device.type,
  os: context.device.os,
  os_version: context.device.os_version,
  browser: context.device.browser,
  browser_version: context.device.browser_version,
  screen_resolution: `${context.device.screen_width}x${context.device.screen_height}`,
  viewport: `${context.device.viewport_width}x${context.device.viewport_height}`,
  language: context.device.language,
  is_touch_device: context.device.is_touch,
  traffic_source: context.traffic.source,
  traffic_medium: context.traffic.medium,
  campaign: context.traffic.campaign,
  utm_term: context.traffic.term,
  utm_content: context.traffic.content,
  referrer: context.traffic.referrer,
  landing_page: context.traffic.landing_page
});

// Debug: log current context
export const debugContext = async () => {
  const context = await getEnrichedContext();
  console.log('[Analytics Debug] Full Context:', JSON.stringify(context, null, 2));
  return context;
};
