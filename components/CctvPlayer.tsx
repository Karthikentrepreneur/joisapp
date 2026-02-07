import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Loader2, AlertCircle, Maximize2, Camera, RefreshCcw, CameraOff } from 'lucide-react';

interface CctvPlayerProps {
  url: string;
  name: string;
  location: string;
  isMuted?: boolean;
  onFullScreen?: () => void;
}

export const CctvPlayer: React.FC<CctvPlayerProps> = ({ url, name, location, isMuted = true, onFullScreen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);

  const initPlayer = useCallback(() => {
    if (!videoRef.current) return;
    
    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setStatus('loading');

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 0,
        manifestLoadingMaxRetry: 10,
        levelLoadingMaxRetry: 10,
      });
      
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {
          // Auto-play might be blocked by browser
          console.log("Autoplay blocked, waiting for interaction");
        });
        setStatus('playing');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS Fatal Error:', data.type);
          setStatus('error');
          // Intelligent retry: wait 5s before bumping retryKey
          setTimeout(() => setRetryKey(prev => prev + 1), 5000);
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari support
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play();
        setStatus('playing');
      });
      videoRef.current.addEventListener('error', () => setStatus('error'));
    }
  }, [url]);

  useEffect(() => {
    initPlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [initPlayer, retryKey]);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden group shadow-lg border border-slate-800 transition-all duration-300 hover:border-blue-500/50">
      <video
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-700 ${status === 'playing' ? 'opacity-100' : 'opacity-0'}`}
        muted={isMuted}
        autoPlay
        playsInline
      />

      {/* Surveillance HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 bg-gradient-to-b from-black/50 via-transparent to-black/60">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-black text-white uppercase tracking-wider border border-white/10 flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-blue-400" /> {name}
            </span>
            <span className="text-[8px] text-white/50 font-bold px-1">{location}</span>
          </div>
          
          {status === 'playing' && (
            <div className="flex items-center gap-1.5 bg-rose-600/90 backdrop-blur-sm px-2 py-1 rounded-md text-[8px] font-black text-white tracking-widest uppercase animate-pulse">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div> LIVE
            </div>
          )}
        </div>

        <div className="flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          <div className="text-[9px] font-mono text-white/40 bg-black/40 px-2 py-1 rounded">
            {new Date().toLocaleTimeString()}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setRetryKey(k => k + 1)}
              className="p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-md text-white transition-colors border border-white/10"
              title="Refresh Stream"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onFullScreen}
              className="p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-md text-white transition-colors border border-white/10"
              title="Expand View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* States Overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm gap-3">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest">Handshaking...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md gap-3 p-4 text-center">
          <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-1">
            <CameraOff className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-white uppercase tracking-widest">Feed Interrupted</span>
            <span className="block text-[8px] text-slate-400 mt-1">Reconnecting in 5s...</span>
          </div>
          <button 
            onClick={() => setRetryKey(k => k + 1)}
            className="mt-2 text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 underline underline-offset-4"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* TV Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_3px,2px_100%] opacity-20"></div>
    </div>
  );
};