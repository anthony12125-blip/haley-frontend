'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Maximize2, Minimize2, Settings, Volume2, VolumeX } from 'lucide-react';

interface VMViewerProps {
  sessionId: string;
  streamUrl: string;
  streamToken: string;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface ConnectionStats {
  latency: number;
  fps: number;
  bitrate: number;
  quality: string;
}

type StreamMode = 'webrtc' | 'canvas_frames' | 'detecting';

export default function VMViewer({
  sessionId,
  streamUrl,
  streamToken,
  onDisconnect,
  onError,
  className = ''
}: VMViewerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());

  // State
  const [streamMode, setStreamMode] = useState<StreamMode>('detecting');
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [stats, setStats] = useState<ConnectionStats>({ latency: 0, fps: 0, bitrate: 0, quality: 'auto' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Draw a base64 frame onto the canvas
  const drawFrame = useCallback((payload: { data: string; width: number; height: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas if needed
    if (canvas.width !== payload.width || canvas.height !== payload.height) {
      canvas.width = payload.width;
      canvas.height = payload.height;
    }

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      // Track FPS
      frameCountRef.current++;
      const now = Date.now();
      const elapsed = now - lastFrameTimeRef.current;
      if (elapsed >= 1000) {
        setStats(prev => ({
          ...prev,
          fps: Math.round((frameCountRef.current / elapsed) * 1000),
          bitrate: Math.round((payload.data.length * 0.75 * 8) / 1000) // rough kbps estimate
        }));
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }
    };
    img.src = `data:image/jpeg;base64,${payload.data}`;
  }, []);

  // Initialize WebRTC connection
  const initWebRTC = useCallback(async (iceServers: RTCIceServer[]) => {
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      console.log('[VMViewer] Received track:', event.track.kind);
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice_candidate',
          session_id: sessionId,
          payload: { candidate: event.candidate }
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[VMViewer] Connection state:', pc.connectionState);
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

    dataChannel.onopen = () => {
      console.log('[VMViewer] Data channel open');
    };

    const offer = await pc.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true
    });
    await pc.setLocalDescription(offer);

    return offer;
  }, [sessionId, onDisconnect]);

  // Connect to signaling server
  useEffect(() => {
    const connect = async () => {
      try {
        const wsUrl = `${streamUrl}?token=${streamToken}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[VMViewer] WebSocket connected');
        };

        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'ready': {
              const mode = data.payload?.mode || 'webrtc';
              console.log('[VMViewer] Ready — mode:', mode);
              setStreamMode(mode);

              if (mode === 'canvas_frames') {
                // Canvas frame mode — no WebRTC needed, just wait for frames
                setConnectionState('connected');
              } else {
                // WebRTC mode
                const offer = await initWebRTC(data.payload.ice_servers);
                ws.send(JSON.stringify({
                  type: 'offer',
                  session_id: sessionId,
                  payload: { sdp: offer }
                }));
              }
              break;
            }

            case 'frame':
              // Canvas frame from backend
              if (data.payload) {
                drawFrame(data.payload);
              }
              break;

            case 'answer':
              if (pcRef.current) {
                await pcRef.current.setRemoteDescription(
                  new RTCSessionDescription(data.payload.sdp)
                );
              }
              break;

            case 'ice_candidate':
              if (pcRef.current && data.payload.candidate) {
                await pcRef.current.addIceCandidate(
                  new RTCIceCandidate(data.payload.candidate)
                );
              }
              break;

            case 'fallback': {
              // Backend tried Janus WebRTC but it's unavailable — switch to canvas frames
              const fallbackMode = data.payload?.mode || 'canvas_frames';
              console.log('[VMViewer] Falling back to:', fallbackMode);

              // Tear down the WebRTC peer connection
              if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
              }
              if (dataChannelRef.current) {
                dataChannelRef.current = null;
              }

              setStreamMode(fallbackMode);
              setConnectionState('connected');
              break;
            }

            case 'error':
              setErrorMessage(data.payload.error);
              setConnectionState('error');
              onError?.(data.payload.error);
              break;
          }
        };

        ws.onerror = (error) => {
          console.error('[VMViewer] WebSocket error:', error);
          setConnectionState('error');
          setErrorMessage('Connection error');
        };

        ws.onclose = () => {
          console.log('[VMViewer] WebSocket closed');
          setConnectionState('disconnected');
        };

      } catch (error) {
        console.error('[VMViewer] Connection error:', error);
        setConnectionState('error');
        setErrorMessage(String(error));
        onError?.(String(error));
      }
    };

    connect();

    return () => {
      wsRef.current?.close();
      pcRef.current?.close();
    };
  }, [streamUrl, streamToken, sessionId, initWebRTC, onError, drawFrame]);

  // Input handling
  const sendInput = useCallback((event: any) => {
    const dc = dataChannelRef.current;
    if (dc?.readyState === 'open') {
      dc.send(JSON.stringify(event));
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input',
        event
      }));
    }
  }, []);

  // Keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
  }, [sendInput]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    sendInput({
      type: 'keyup',
      key: e.key,
      code: e.code
    });
  }, [sendInput]);

  // Mouse events — works for both video and canvas
  const getMousePosition = useCallback((e: React.MouseEvent) => {
    const el = (streamMode === 'canvas_frames' ? canvasRef.current : videoRef.current) as HTMLElement | null;
    if (!el) return { x: 0, y: 0 };

    const rect = el.getBoundingClientRect();
    const canvas = canvasRef.current;
    const video = videoRef.current;

    let scaleX = 1, scaleY = 1;
    if (streamMode === 'canvas_frames' && canvas) {
      scaleX = canvas.width / rect.width;
      scaleY = canvas.height / rect.height;
    } else if (video) {
      scaleX = video.videoWidth / rect.width;
      scaleY = video.videoHeight / rect.height;
    }

    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  }, [streamMode]);

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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    sendInput({ type: 'contextmenu', ...getMousePosition(e) });
  }, [getMousePosition, sendInput]);

  // Fullscreen toggle
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

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Stats collection (WebRTC mode only)
  useEffect(() => {
    if (streamMode !== 'webrtc') return;

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
  }, [streamMode]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {/* Canvas element for frame-based streaming */}
      {streamMode === 'canvas_frames' && (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
        />
      )}

      {/* Video element for WebRTC streaming */}
      {streamMode !== 'canvas_frames' && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          muted={isMuted}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
        />
      )}

      {/* Loading overlay */}
      {connectionState === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg">Connecting to VM...</p>
            <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {connectionState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <p className="text-lg">Connection Error</p>
            <p className="text-sm text-gray-400 mt-2">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {showControls && connectionState === 'connected' && (
        <>
          <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-green-500/20 rounded text-green-400">
                  {streamMode === 'canvas_frames' ? 'Stream' : 'WebRTC'}
                </span>
                {streamMode === 'webrtc' && <span>{stats.latency.toFixed(0)}ms</span>}
                <span>{stats.fps.toFixed(0)} FPS</span>
              </div>
              <div className="flex items-center gap-2">
                {streamMode === 'webrtc' && (
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/10 rounded"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                )}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/10 rounded"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
