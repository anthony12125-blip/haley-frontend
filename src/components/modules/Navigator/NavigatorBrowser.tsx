'use client';

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Globe, RefreshCw, ArrowLeft, ArrowRight, Home, ExternalLink,
  Lock, Unlock, AlertTriangle, Loader2, X, Camera
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface BrowserState {
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isSameOrigin: boolean;
  lastSnapshot: number;
}

export interface Snapshot {
  id: string;
  timestamp: number;
  url: string;
  title: string;
  stateData: Record<string, unknown>;
  screenshot?: string;
}

export interface NavigatorBrowserProps {
  initialUrl?: string;
  snapshotInterval?: number; // milliseconds, 0 = manual only
  onSnapshot?: (snapshot: Snapshot) => void;
  onUrlChange?: (url: string) => void;
  onStateChange?: (state: BrowserState) => void;
  overlayTargets?: string[]; // CSS selectors to track
}

export interface NavigatorBrowserRef {
  navigate: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  captureSnapshot: () => Snapshot | null;
  getElementPosition: (selector: string) => DOMRect | null;
  injectOverlay: (id: string, html: string, position: { x: number; y: number }) => void;
  removeOverlay: (id: string) => void;
  clearOverlays: () => void;
}

// ============================================================================
// BROWSER COMPONENT
// ============================================================================

const NavigatorBrowser = forwardRef<NavigatorBrowserRef, NavigatorBrowserProps>(
  function NavigatorBrowser(
    {
      initialUrl = '',
      snapshotInterval = 5000,
      onSnapshot,
      onUrlChange,
      onStateChange,
      overlayTargets = [],
    },
    ref
  ) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const overlayContainerRef = useRef<HTMLDivElement>(null);
    const [browserState, setBrowserState] = useState<BrowserState>({
      url: initialUrl,
      title: '',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isSameOrigin: false,
      lastSnapshot: 0,
    });
    const [urlInput, setUrlInput] = useState(initialUrl);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const injectedOverlays = useRef<Map<string, HTMLElement>>(new Map());

    // Check if URL is same-origin
    const checkSameOrigin = useCallback((url: string): boolean => {
      try {
        const targetUrl = new URL(url);
        return targetUrl.origin === window.location.origin;
      } catch {
        return false;
      }
    }, []);

    // Navigate to URL
    const navigate = useCallback((url: string) => {
      let normalizedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        normalizedUrl = 'https://' + url;
      }

      setError(null);
      setBrowserState(prev => ({ ...prev, isLoading: true, url: normalizedUrl }));
      setUrlInput(normalizedUrl);

      // Update history
      const newHistory = [...history.slice(0, historyIndex + 1), normalizedUrl];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      onUrlChange?.(normalizedUrl);
    }, [history, historyIndex, onUrlChange]);

    // History navigation
    const goBack = useCallback(() => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const url = history[newIndex];
        setBrowserState(prev => ({ ...prev, url, isLoading: true }));
        setUrlInput(url);
      }
    }, [history, historyIndex]);

    const goForward = useCallback(() => {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        const url = history[newIndex];
        setBrowserState(prev => ({ ...prev, url, isLoading: true }));
        setUrlInput(url);
      }
    }, [history, historyIndex]);

    const reload = useCallback(() => {
      if (iframeRef.current) {
        setBrowserState(prev => ({ ...prev, isLoading: true }));
        iframeRef.current.src = browserState.url;
      }
    }, [browserState.url]);

    // Get element position from iframe (same-origin only)
    const getElementPosition = useCallback((selector: string): DOMRect | null => {
      if (!iframeRef.current || !browserState.isSameOrigin) return null;

      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (!iframeDoc) return null;

        const element = iframeDoc.querySelector(selector);
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        const iframeRect = iframeRef.current.getBoundingClientRect();

        // Adjust for iframe position
        return new DOMRect(
          rect.x + iframeRect.x,
          rect.y + iframeRect.y,
          rect.width,
          rect.height
        );
      } catch {
        return null;
      }
    }, [browserState.isSameOrigin]);

    // Capture snapshot
    const captureSnapshot = useCallback((): Snapshot | null => {
      const timestamp = Date.now();
      const stateData: Record<string, unknown> = {
        url: browserState.url,
        title: browserState.title,
      };

      // Try to extract more state from same-origin iframe
      if (iframeRef.current && browserState.isSameOrigin) {
        try {
          const iframeDoc = iframeRef.current.contentDocument;
          if (iframeDoc) {
            // Extract visible text for context
            stateData.bodyText = iframeDoc.body?.innerText?.slice(0, 1000) || '';

            // Extract active element
            const active = iframeDoc.activeElement;
            if (active) {
              stateData.activeElement = {
                tag: active.tagName,
                id: active.id,
                className: active.className,
              };
            }

            // Track specified overlay targets
            overlayTargets.forEach(selector => {
              const el = iframeDoc.querySelector(selector);
              if (el) {
                const rect = el.getBoundingClientRect();
                stateData[`target_${selector}`] = {
                  exists: true,
                  visible: rect.width > 0 && rect.height > 0,
                  position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                };
              }
            });
          }
        } catch (e) {
          console.warn('[NavigatorBrowser] Could not extract iframe state:', e);
        }
      }

      const snapshot: Snapshot = {
        id: `snapshot_${timestamp}`,
        timestamp,
        url: browserState.url,
        title: browserState.title,
        stateData,
      };

      setBrowserState(prev => ({ ...prev, lastSnapshot: timestamp }));
      onSnapshot?.(snapshot);

      return snapshot;
    }, [browserState, overlayTargets, onSnapshot]);

    // Inject overlay element
    const injectOverlay = useCallback((id: string, html: string, position: { x: number; y: number }) => {
      if (!overlayContainerRef.current) return;

      // Remove existing overlay with same id
      const existing = injectedOverlays.current.get(id);
      if (existing) {
        existing.remove();
      }

      const overlay = document.createElement('div');
      overlay.id = `navigator-overlay-${id}`;
      overlay.innerHTML = html;
      overlay.style.position = 'absolute';
      overlay.style.left = `${position.x}px`;
      overlay.style.top = `${position.y}px`;
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '1000';

      overlayContainerRef.current.appendChild(overlay);
      injectedOverlays.current.set(id, overlay);
    }, []);

    // Remove overlay
    const removeOverlay = useCallback((id: string) => {
      const overlay = injectedOverlays.current.get(id);
      if (overlay) {
        overlay.remove();
        injectedOverlays.current.delete(id);
      }
    }, []);

    // Clear all overlays
    const clearOverlays = useCallback(() => {
      injectedOverlays.current.forEach(overlay => overlay.remove());
      injectedOverlays.current.clear();
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      navigate,
      goBack,
      goForward,
      reload,
      captureSnapshot,
      getElementPosition,
      injectOverlay,
      removeOverlay,
      clearOverlays,
    }), [navigate, goBack, goForward, reload, captureSnapshot, getElementPosition, injectOverlay, removeOverlay, clearOverlays]);

    // Handle iframe load
    const handleIframeLoad = useCallback(() => {
      const isSameOrigin = checkSameOrigin(browserState.url);
      let title = browserState.url;

      if (iframeRef.current && isSameOrigin) {
        try {
          title = iframeRef.current.contentDocument?.title || browserState.url;
        } catch {
          // Cross-origin, can't access
        }
      }

      setBrowserState(prev => ({
        ...prev,
        isLoading: false,
        isSameOrigin,
        title,
        canGoBack: historyIndex > 0,
        canGoForward: historyIndex < history.length - 1,
      }));
    }, [browserState.url, checkSameOrigin, history.length, historyIndex]);

    // Handle iframe error
    const handleIframeError = useCallback(() => {
      setError('Failed to load page. The site may block embedding.');
      setBrowserState(prev => ({ ...prev, isLoading: false }));
    }, []);

    // Snapshot interval
    useEffect(() => {
      if (snapshotInterval <= 0 || !browserState.url) return;

      const interval = setInterval(() => {
        captureSnapshot();
      }, snapshotInterval);

      return () => clearInterval(interval);
    }, [snapshotInterval, browserState.url, captureSnapshot]);

    // Notify state changes
    useEffect(() => {
      onStateChange?.(browserState);
    }, [browserState, onStateChange]);

    // Handle URL form submit
    const handleUrlSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (urlInput.trim()) {
        navigate(urlInput.trim());
      }
    };

    return (
      <div className="flex flex-col h-full bg-panel-dark">
        {/* Browser toolbar */}
        <div className="flex items-center gap-2 p-2 bg-panel-medium border-b border-border">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              disabled={!browserState.canGoBack}
              className="p-1.5 rounded hover:bg-panel-light disabled:opacity-30 disabled:cursor-not-allowed"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goForward}
              disabled={!browserState.canGoForward}
              className="p-1.5 rounded hover:bg-panel-light disabled:opacity-30 disabled:cursor-not-allowed"
              title="Go forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={reload}
              disabled={!browserState.url}
              className="p-1.5 rounded hover:bg-panel-light disabled:opacity-30"
              title="Reload"
            >
              {browserState.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* URL bar */}
          <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-panel-dark border border-border rounded-lg">
              {browserState.isSameOrigin ? (
                <Lock className="w-3.5 h-3.5 text-green-500" />
              ) : browserState.url ? (
                <Globe className="w-3.5 h-3.5 text-text-secondary" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-text-secondary" />
              )}
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="Enter URL or search..."
                className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="p-0.5 hover:bg-panel-light rounded"
                >
                  <X className="w-3 h-3 text-text-secondary" />
                </button>
              )}
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => captureSnapshot()}
              className="p-1.5 rounded hover:bg-panel-light"
              title="Capture snapshot"
            >
              <Camera className="w-4 h-4" />
            </button>
            {browserState.url && (
              <a
                href={browserState.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-panel-light"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Cross-origin warning */}
        {browserState.url && !browserState.isSameOrigin && !browserState.isLoading && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-500">
              Cross-origin content - visual overlays may not work on this site
            </span>
          </div>
        )}

        {/* Browser content area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Overlay container */}
          <div
            ref={overlayContainerRef}
            className="absolute inset-0 pointer-events-none z-10"
          />

          {/* Empty state */}
          {!browserState.url && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <Globe className="w-16 h-16 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Enter a URL to browse
              </h3>
              <p className="text-sm text-text-secondary max-w-md">
                Navigator can provide real-time guidance as you navigate.
                For best results, browse same-origin content or HaleyOS modules.
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-panel-dark">
              <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Could not load page
              </h3>
              <p className="text-sm text-text-secondary max-w-md mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  reload();
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Iframe */}
          {browserState.url && !error && (
            <iframe
              ref={iframeRef}
              src={browserState.url}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              title="Navigator Browser"
            />
          )}

          {/* Loading overlay */}
          {browserState.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-panel-dark/80">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-text-secondary">Loading...</span>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-panel-medium border-t border-border text-xs text-text-secondary">
          <span className="truncate max-w-[60%]">{browserState.title || 'No page loaded'}</span>
          <span>
            {browserState.lastSnapshot > 0 && (
              <>Last snapshot: {new Date(browserState.lastSnapshot).toLocaleTimeString()}</>
            )}
          </span>
        </div>
      </div>
    );
  }
);

export default NavigatorBrowser;
