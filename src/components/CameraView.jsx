import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Camera, Zap, ZapOff, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { initCameraStream, stopCameraStream, toggleTorch, isTorchSupported, captureOptimizedFrame, generateTestFrame } from '../utils/camera';

const CameraView = forwardRef(function CameraView(
  { isProcessing, useSimulatedFeed, onCameraError },
  ref
) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Expose capture method to parent component via ref
  useImperativeHandle(ref, () => ({
    captureImage: () => {
      if (useSimulatedFeed || !cameraActive || !videoRef.current) {
        return generateTestFrame('living_room');
      }
      try {
        return captureOptimizedFrame(videoRef.current);
      } catch (err) {
        console.warn('Frame capture error, falling back to simulated frame:', err);
        return generateTestFrame('living_room');
      }
    },
    toggleTorchState: async () => {
      if (streamRef.current && hasTorchSupport) {
        const nextState = !torchOn;
        const success = await toggleTorch(streamRef.current, nextState);
        if (success) setTorchOn(nextState);
      }
    },
  }));

  // Start / restart camera
  useEffect(() => {
    if (useSimulatedFeed) {
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
        streamRef.current = null;
      }
      setCameraActive(false);
      return;
    }

    let isMounted = true;

    async function startStream() {
      setErrorMsg(null);
      try {
        if (streamRef.current) {
          stopCameraStream(streamRef.current);
        }

        const stream = await initCameraStream(facingMode);
        if (!isMounted) {
          stopCameraStream(stream);
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setCameraActive(true);
        setHasTorchSupport(isTorchSupported(stream));
      } catch (err) {
        console.error('Camera init error:', err);
        setErrorMsg('Camera access denied or unavailable. Using simulated camera view.');
        onCameraError?.(err.message);
      }
    }

    startStream();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
      }
    };
  }, [facingMode, useSimulatedFeed]);

  const handleFlipCamera = (e) => {
    e.stopPropagation();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleToggleTorch = async (e) => {
    e.stopPropagation();
    if (streamRef.current) {
      const next = !torchOn;
      const ok = await toggleTorch(streamRef.current, next);
      if (ok) setTorchOn(next);
    }
  };

  return (
    <div className="camera-container" aria-label="Camera viewfinder">
      {/* Live Video Element */}
      {!useSimulatedFeed && (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="camera-video"
          aria-hidden="true"
        />
      )}

      {/* Simulated Camera View when camera is denied or simulated mode is on */}
      {(useSimulatedFeed || errorMsg) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #1a2a40 0%, #060913 85%)',
            color: 'var(--text-secondary)',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(0, 242, 254, 0.1)',
              border: '2px dashed var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Eye size={56} color="var(--accent-cyan)" />
          </div>
          <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: 8 }}>
            Simulated Camera Active
          </h3>
          <p style={{ maxWidth: 360, fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            Scene: Living room with a wooden chair directly in front of you. Ready for questions.
          </p>
        </div>
      )}

      {/* Scanning HUD Overlay */}
      <div className="scanning-hud">
        <div className="radar-beam" />
        <div className={`reticle-box ${isProcessing ? 'active' : ''}`}>
          <div className="reticle-corner tl" />
          <div className="reticle-corner tr" />
          <div className="reticle-corner bl" />
          <div className="reticle-corner br" />
        </div>
      </div>

      {/* Quick Camera Action Controls (Torch & Flip) */}
      <div
        style={{
          position: 'absolute',
          top: 76,
          right: 18,
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {hasTorchSupport && (
          <button
            type="button"
            className={`nav-btn ${torchOn ? 'active' : ''}`}
            onClick={handleToggleTorch}
            title={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
            aria-label={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
          >
            {torchOn ? <Zap size={20} color="#ffb703" /> : <ZapOff size={20} />}
          </button>
        )}

        <button
          type="button"
          className="nav-btn"
          onClick={handleFlipCamera}
          title="Switch front / rear camera"
          aria-label="Switch between front and rear camera"
        >
          <RefreshCw size={20} />
        </button>
      </div>
    </div>
  );
});

export default CameraView;
