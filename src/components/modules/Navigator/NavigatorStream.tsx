'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Maximize2, Minimize2, Hand, Bot, AlertCircle } from 'lucide-react';
import NavigatorCanvas, { OverlayElement } from './NavigatorCanvas';
import NavigatorControls from './NavigatorControls';

// =============================================================================
// TYPES
// =============================================================================

interface NavigatorStreamProps {
  sessionId: string;
  streamUrl: string;
  streamToken: string;
  overlayWsUrl: string;
  initialMode?: 'haley_drives' | 'user_drives' | 'collaborative';
  onModeChange?: (mode: string) => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface SessionState {
  session_id: string;
  user_id: string;
  status: string;
  mode: string;
  current_url: string | null;
  current_title: string | null;
  goal: string | null;
}

interface ConnectionStats {
  latency: number;
  fps: number;
  bitrate: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NavigatorStream({
  sessionId,
  streamUrl,
  streamToken,
  overlayWsUrl,
  initialMode = 'haley_drives',
  onModeChange,
  onDisconnect,
  onError,
  className = ''
}: NavigatorStreamProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamWsRef = useRef<WebSocket | null>(null);
  const overlayWsRef = useRef<WebSocket | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // State
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [overlays, setOverlays] = useState<OverlayElement[]>([]);
  const [mode, setMode] = useState(initialMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [stats, setStats] = useState<ConnectionStats>({ latency: 0, fps: 0, bitrate: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video dimensions for overlay scaling
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', resetTimeout);
      container.addEventListener('mousedown', resetTimeout);
    }

    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener('mousemove', resetTimeout);
        container.removeEventListener('mousedown', resetTimeout);
      }
    };
  }, []);

  // Initialize WebRTC connection
  const initWebRTC = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      console.log('[NavigatorStream] Received track:', event.track.kind);
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && streamWsRef.current?.readyState === WebSocket.OPEN) {
        streamWsRef.current.send(JSON.stringify({
          type: 'ice_candidate',
          session_id: sessionId,
          payload: { candidate: event.candidate }
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[NavigatorStream] Connection state:', pc.connectionState);
      switch (pc.connectionState) {
        case 'connected':
          setConnectionState('connected');
          break;
        case 'disconnected':
        case 'failed':
          setConnectionState('disconnected');
          onDisconnect?.();
          break;
      }
    };

    const dataChannel = pc.createDataChannel('input', {
      ordered: false,
      maxRetransmits: 0
    });
    dataChannelRef.current = dataChannel;

    return pc;
  }, [sessionId, onDisconnect]);

  // Connect to WebRTC signaling server
  useEffect(() => {
    const connectStream = async () => {
      try {
        const wsUrl = `${streamUrl}?token=${streamToken}`;
        const ws = new WebSocket(wsUrl);
        streamWsRef.current = ws;

        ws.onopen = () => {
          console.log('[NavigatorStream] Signaling WebSocket connected');
          initWebRTC();
        };

        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'offer': {
              const pc = pcRef.current;
              if (pc && data.payload?.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.payload.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify({
                  type: 'answer',
                  payload: { sdp: { type: answer.type, sdp: answer.sdp } }
                }));
              }
              break;
            }

            case 'ice_candidate':
              if (pcRef.current && data.payload.candidate) {
                await pcRef.current.addIceCandidate(
                  new RTCIceCandidate(data.payload.candidate)
                );
              }
              break;

            case 'error':
              setErrorMessage(data.payload?.message || 'Stream error');
              setConnectionState('error');
              onError?.(data.payload?.message);
              break;
          }
        };

        ws.onerror = () => setConnectionState('error');
        ws.onclose = () => setConnectionState('disconnected');

      } catch (error) {
        setConnectionState('error');
        setErrorMessage(String(error));
        onError?.(String(error));
      }
    };

    connectStream();

    return () => {
      streamWsRef.current?.close();
      pcRef.current?.close();
    };
  }, [streamUrl, streamToken, initWebRTC, onError]);

  // Connect to overlay WebSocket
  useEffect(() => {
    const connectOverlay = async () => {
      try {
        const baseUrl = window.location.origin.replace('http', 'ws');
        const fullOverlayUrl = overlayWsUrl.startsWith('ws') 
          ? overlayWsUrl 
          : `${baseUrl}${overlayWsUrl}`;
        
        const ws = new WebSocket(fullOverlayUrl);
        overlayWsRef.current = ws;

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'overlay':
              setOverlays(prev => [...prev, data.data]);
              if (data.data.duration_ms) {
                setTimeout(() => {
                  setOverlays(prev => prev.filter(o => o.id !== data.data.id));
                }, data.data.duration_ms);
              }
              break;

            case 'clear_overlays':
              setOverlays([]);
              break;

            case 'state':
              setSessionState(data.data);
              break;

            case 'mode_change':
              setMode(data.data.new_mode);
              onModeChange?.(data.data.new_mode);
              break;
          }
        };

        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        return () => {
          clearInterval(pingInterval);
          ws.close();
        };
      } catch (error) {
        console.error('[NavigatorStream] Overlay WebSocket error:', error);
      }
    };

    connectOverlay();

    return () => {
      overlayWsRef.current?.close();
    };
  }, [overlayWsUrl, onModeChange]);

  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      });
    }
  }, []);

  const sendInput = useCallback((event: any) => {
    if (mode !== 'user_drives' && mode !== 'collaborative') return;

    const dc = dataChannelRef.current;
    if (dc?.readyState === 'open') {
      dc.send(JSON.stringify(event));
    } else if (streamWsRef.current?.readyState === WebSocket.OPEN) {
      streamWsRef.current.send(JSON.stringify({ type: 'input', event }));
    }
  }, [mode]);

  const getMousePosition = useCallback((e: React.MouseEvent) => {
    if (!videoRef.current) return { x: 0, y: 0 };

    const rect = videoRef.current.getBoundingClientRect();
    const scaleX = videoDimensions.width / rect.width;
    const scaleY = videoDimensions.height / rect.height;

    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  }, [videoDimensions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    sendInput({ type: 'mousemove', ...getMousePosition(e) });
  }, [getMousePosition, sendInput]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    sendInput({ type: 'mousedown', ...getMousePosition(e), button: e.button });
  }, [getMousePosition, sendInput]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    sendInput({ type: 'mouseup', ...getMousePosition(e), button: e.button });
  }, [getMousePosition, sendInput]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    sendInput({ type: 'wheel', ...getMousePosition(e), deltaX: e.deltaX, deltaY: e.deltaY });
  }, [getMousePosition, sendInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (mode !== 'user_drives' && mode !== 'collaborative') return;
    e.preventDefault();
    sendInput({
      type: 'keydown',
      key: e.key,
      code: e.code,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey
    });
  }, [mode, sendInput]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (mode !== 'user_drives' && mode !== 'collaborative') return;
    e.preventDefault();
    sendInput({ type: 'keyup', key: e.key, code: e.code });
  }, [mode, sendInput]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const requestHandoff = useCallback(async (targetMode: string) => {
    try {
      const response = await fetch(`/api/navigator/session/${sessionId}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_mode: targetMode })
      });
      const data = await response.json();
      if (data.success) {
        setMode(targetMode as any);
        onModeChange?.(targetMode);
      }
    } catch (error) {
      console.error('[NavigatorStream] Handoff failed:', error);
    }
  }, [sessionId, onModeChange]);

  // Stats collection
  useEffect(() => {
    const interval = setInterval(async () => {
      if (pcRef.current) {
        const statsReport = await pcRef.current.getStats();
        let newStats: Partial<ConnectionStats> = {};

        statsReport.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            newStats.fps = report.framesPerSecond || 0;
            newStats.bitrate = (report.bytesReceived * 8) / 1000;
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            newStats.latency = report.currentRoundTripTime * 1000 || 0;
          }
        });

        setStats(prev => ({ ...prev, ...newStats }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        muted
        onLoadedMetadata={handleVideoLoadedMetadata}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: mode === 'haley_drives' ? 'default' : 'crosshair' }}
      />

      <NavigatorCanvas
        overlays={overlays}
        videoWidth={videoDimensions.width}
        videoHeight={videoDimensions.height}
        containerRef={containerRef}
      />

      {connectionState === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg">Connecting to Navigator...</p>
            <p className="text-sm text-gray-400 mt-2">Setting up browser stream</p>
          </div>
        </div>
      )}

      {connectionState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg">Connection Error</p>
            <p className="text-sm text-gray-400 mt-2">{errorMessage}</p>
          </div>
        </div>
      )}

      {showControls && connectionState === 'connected' && (
        <NavigatorControls
          mode={mode}
          sessionState={sessionState}
          stats={stats}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onRequestHandoff={requestHandoff}
        />
      )}

      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full text-white text-sm">
        {mode === 'haley_drives' ? (
          <>
            <Bot className="w-4 h-4 text-green-400" />
            <span>Haley is driving</span>
          </>
        ) : mode === 'user_drives' ? (
          <>
            <Hand className="w-4 h-4 text-blue-400" />
            <span>You are driving</span>
          </>
        ) : (
          <>
            <Bot className="w-4 h-4 text-purple-400" />
            <span>Collaborative</span>
          </>
        )}
      </div>
    </div>
  );
}
