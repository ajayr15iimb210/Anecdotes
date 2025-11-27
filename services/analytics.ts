
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// REPLACE THIS WITH YOUR ACTUAL GOOGLE ANALYTICS MEASUREMENT ID
export const GA_MEASUREMENT_ID = 'G-YOUR-ID-HERE';

export const initGA = () => {
  if (window.gtag) return; // Already initialized

  // Inject script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false // We will manually track page views for SPA
  });
};

export const trackPageView = (path: string) => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
    });
  }
};

export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    // Fallback/Debug logging if GA isn't initialized (e.g. dev mode or ad blocker)
    console.debug(`[Analytics] ${eventName}`, eventParams);
  }
};
