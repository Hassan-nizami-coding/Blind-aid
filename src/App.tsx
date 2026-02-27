import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { useCamera } from './hooks/useCamera';
import { useSpeech } from './hooks/useSpeech';
import { Camera, Volume2, VolumeX, AlertTriangle, Eye, Settings } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const { videoRef, hasPermission, error } = useCamera();
  const { speak, stop, isSpeaking } = useSpeech(4000); // 4s debounce per object
  
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<cocoSsd.DetectedObject[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const requestRef = useRef<number>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load model
  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        setModel(loadedModel);
      } catch (err) {
        console.error("Failed to load model:", err);
      }
    }
    loadModel();
  }, []);

  // Detection loop
  const detectFrame = useCallback(async () => {
    if (!model || !videoRef.current || !canvasRef.current || !isDetecting) return;

    const video = videoRef.current;
    if (video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    try {
      const predictions = await model.detect(video);
      setDetections(predictions);

      // Draw bounding boxes
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Match canvas size to video size
        if (ctx.canvas.width !== video.videoWidth || ctx.canvas.height !== video.videoHeight) {
          ctx.canvas.width = video.videoWidth;
          ctx.canvas.height = video.videoHeight;
        }

        predictions.forEach(prediction => {
          const [x, y, width, height] = prediction.bbox;
          
          // Draw box
          ctx.strokeStyle = '#00FFCC';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, width, height);
          
          // Draw label background
          ctx.fillStyle = '#00FFCC';
          ctx.fillRect(x, y - 24, ctx.measureText(prediction.class).width + 20, 24);
          
          // Draw label text
          ctx.fillStyle = '#000000';
          ctx.font = '16px Inter';
          ctx.fillText(`${prediction.class} (${Math.round(prediction.score * 100)}%)`, x + 4, y - 6);
        });
      }

      // Announce detected objects
      if (audioEnabled && predictions.length > 0) {
        // Find the most confident prediction or just announce all unique ones
        const uniqueClasses = Array.from(new Set(predictions.map(p => p.class)));
        uniqueClasses.forEach(cls => {
          // Speak each unique object. The useSpeech hook handles debouncing so it doesn't spam.
          speak(cls);
        });
      }

    } catch (err) {
      console.error("Detection error:", err);
    }

    requestRef.current = requestAnimationFrame(detectFrame);
  }, [model, isDetecting, audioEnabled, speak, videoRef]);

  useEffect(() => {
    if (isDetecting) {
      requestRef.current = requestAnimationFrame(detectFrame);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isDetecting, detectFrame]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsDetecting(prev => !prev);
        speak(isDetecting ? "Detection paused" : "Detection started", true);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setAudioEnabled(prev => {
          const newState = !prev;
          if (!newState) stop();
          speak(newState ? "Audio enabled" : "Audio muted", true);
          return newState;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetecting, speak, stop]);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden text-white font-sans">
      {/* Visually hidden ARIA live region for screen readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {detections.length > 0 
          ? `Detected: ${Array.from(new Set(detections.map(d => d.class))).join(', ')}` 
          : 'No objects detected'}
      </div>

      {/* Camera Feed & Canvas Overlay */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          aria-hidden="true"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Bento Dashboard Overlay */}
      <div className="absolute inset-0 z-10 p-4 md:p-8 flex flex-col justify-between pointer-events-none">
        
        {/* Top Bar */}
        <header className="flex justify-between items-start w-full max-w-7xl mx-auto pointer-events-auto">
          <div className="glass-panel px-6 py-4 flex items-center gap-4">
            <div className={cn(
              "w-3 h-3 rounded-full",
              isDetecting ? "bg-[#00FFCC] animate-pulse" : "bg-[#FF3366]"
            )} />
            <h1 className="text-xl font-bold tracking-tight">Lumina</h1>
            <span className="text-sm opacity-70 ml-2 border-l border-white/20 pl-4">
              {model ? "Engine Ready" : "Loading Engine..."}
            </span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="glass-panel p-4 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFDD00]"
              aria-label={audioEnabled ? "Mute announcements" : "Enable announcements"}
              aria-pressed={audioEnabled}
            >
              {audioEnabled ? <Volume2 className="w-6 h-6 text-[#00FFCC]" /> : <VolumeX className="w-6 h-6 text-[#FF3366]" />}
            </button>
            <button
              className="glass-panel p-4 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFDD00]"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Center / Error States */}
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          {hasPermission === false && (
            <div className="glass-panel p-8 max-w-md text-center pointer-events-auto border-[#FF3366]/50">
              <AlertTriangle className="w-12 h-12 text-[#FF3366] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Camera Access Denied</h2>
              <p className="text-white/70 mb-6">
                Lumina requires camera access to detect objects in your environment.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-[#FF3366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#FF3366]/80 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFDD00]"
              >
                Retry Access
              </button>
            </div>
          )}
        </div>

        {/* Bottom Bar / Controls */}
        <footer className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 pointer-events-auto">
          
          {/* Main Control */}
          <div className="glass-panel p-6 flex flex-col justify-center items-center md:col-span-1">
            <button
              onClick={() => setIsDetecting(!isDetecting)}
              disabled={!model || !hasPermission}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFDD00]",
                !model || !hasPermission ? "opacity-50 cursor-not-allowed bg-white/10" :
                isDetecting ? "bg-[#FF3366] text-white" : "bg-[#00FFCC] text-black"
              )}
              aria-label={isDetecting ? "Stop object detection" : "Start object detection"}
            >
              {isDetecting ? "Stop Detection" : "Start Detection"}
            </button>
            <p className="text-sm text-white/50 mt-4 text-center">
              Keyboard shortcut: <kbd className="bg-white/10 px-2 py-1 rounded">Space</kbd>
            </p>
          </div>

          {/* Detections List */}
          <div className="glass-panel p-6 md:col-span-2 flex flex-col">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Current Environment
            </h2>
            <div 
              className="flex-1 overflow-y-auto flex flex-wrap gap-2 content-start"
              role="region"
              aria-label="Detected objects list"
            >
              {detections.length === 0 ? (
                <p className="text-white/30 italic">No objects currently detected...</p>
              ) : (
                Array.from(new Set(detections.map(d => d.class))).map((cls, idx) => (
                  <div 
                    key={`${cls}-${idx}`}
                    className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-[#00FFCC] font-medium animate-in fade-in zoom-in duration-200"
                  >
                    {cls}
                  </div>
                ))
              )}
            </div>
          </div>

        </footer>
      </div>
    </main>
  );
}
