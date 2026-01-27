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
  const containerRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  
  // State
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
  
  // Initialize WebRTC connection
  const initWebRTC = useCallback(async (iceServers: RTCIceServer[]) => {
    // Create peer connection
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10
    });
    pcRef.current = pc;
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('[VMViewer] Received track:', event.track.kind);
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice_candidate',
          session_id: sessionId,
          payload: { candidate: event.candidate }
        }));
      }
    };
    
    // Handle connection state changes
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
    
    // Create data channel for input
    const dataChannel = pc.createDataChannel('input', {
      ordered: false, // Allow out-of-order for lower latency
      maxRetransmits: 0 // No retransmits for real-time input
    });
    dataChannelRef.current = dataChannel;
    
    dataChannel.onopen = () => {
      console.log('[VMViewer] Data channel open');
    };
    
    // Create offer
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
        // Connect WebSocket
        const wsUrl = `${streamUrl}?token=${streamToken}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('[VMViewer] WebSocket connected');
        };
        
        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          console.log('[VMViewer] Received:', data.type);
          
          switch (data.type) {
            case 'ready':
              // Initialize WebRTC with provided ICE servers
              const offer = await initWebRTC(data.payload.ice_servers);
              
              // Send offer
              ws.send(JSON.stringify({
                type: 'offer',
                session_id: sessionId,
                payload: { sdp: offer }
              }));
              break;
              
            case 'answer':
              // Set remote description
              if (pcRef.current) {
                await pcRef.current.setRemoteDescription(
                  new RTCSessionDescription(data.payload.sdp)
                );
              }
              break;
              
            case 'ice_candidate':
              // Add ICE candidate
              if (pcRef.current && data.payload.candidate) {
                await pcRef.current.addIceCandidate(
                  new RTCIceCandidate(data.payload.candidate)
                );
              }
              break;
              
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
    
    // Cleanup
    return () => {
      wsRef.current?.close();
      pcRef.current?.close();
    };
  }, [streamUrl, streamToken, sessionId, initWebRTC, onError]);
  
  // Input handling
  const sendInput = useCallback((event: any) => {
    const dc = dataChannelRef.current;
    if (dc?.readyState === 'open') {
      dc.send(JSON.stringify(event));
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Fallback to WebSocket
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
  
  // Mouse events
  const getMousePosition = useCallback((e: React.MouseEvent) => {
    const video = videoRef.current;
    if (!video) return { x: 0, y: 0 };
    
    const rect = video.getBoundingClientRect();
    const scaleX = video.videoWidth / rect.width;
    const scaleY = video.videoHeight / rect.height;
    
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    sendInput({
      type: 'mousemove',
      clientX: pos.x,
      clientY: pos.y
    });
  }, [getMousePosition, sendInput]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    sendInput({
      type: 'mousedown',
      clientX: pos.x,
      clientY: pos.y,
      button: e.button
    });
  }, [getMousePosition, sendInput]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    sendInput({
      type: 'mouseup',
      clientX: pos.x,
      clientY: pos.y,
      button: e.button
    });
  }, [getMousePosition, sendInput]);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const pos = getMousePosition(e);
    sendInput({
      type: 'wheel',
      clientX: pos.x,
      clientY: pos.y,
      deltaX: e.deltaX,
      deltaY: e.deltaY
    });
  }, [getMousePosition, sendInput]);
  
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getMousePosition(e);
    sendInput({
      type: 'contextmenu',
      clientX: pos.x,
      clientY: pos.y
    });
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
  
  // Stats collection
  useEffect(() => {
    const interval = setInterval(async () => {
      if (pcRef.current) {
        const statsReport = await pcRef.current.getStats();
        let newStats: Partial<ConnectionStats> = {};
        
        statsReport.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            newStats.fps = report.framesPerSecond || 0;
            newStats.bitrate = (report.bytesReceived * 8) / 1000; // kbps
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
      {/* Video element */}
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
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-lg">Connection Error</p>
            <p className="text-sm text-gray-400 mt-2">{errorMessage}</p>
          </div>
        </div>
      )}
      
      {/* Controls overlay */}
      {showControls && connectionState === 'connected' && (
        <>
          {/* Top bar - stats */}
          <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-green-500/20 rounded text-green-400">
                  Connected
                </span>
                <span>{stats.latency.toFixed(0)}ms</span>
                <span>{stats.fps.toFixed(0)} FPS</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/10 rounded"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
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
