// Native HTML5 getUserMedia and Canvas camera frame capture

/**
 * Initializes camera stream with preferred facing mode
 */
export async function initCameraStream(facingMode = 'environment') {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera API (getUserMedia) not supported in this browser.');
  }

  // Try environment (rear) camera first for mobile devices
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
      },
      audio: false,
    });
    return stream;
  } catch (err) {
    console.warn(`Could not get camera with facingMode=${facingMode}, falling back to any video:`, err);
    // Fallback to any camera device
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }
}

/**
 * Stop all tracks of a stream
 */
export function stopCameraStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Toggle flashlight/torch if supported by hardware
 */
export async function toggleTorch(stream, enableTorch) {
  if (!stream) return false;
  const track = stream.getVideoTracks()[0];
  if (!track) return false;

  const capabilities = track.getCapabilities ? track.getCapabilities() : {};
  if (!capabilities.torch) {
    return false; // Torch not supported on this camera
  }

  try {
    await track.applyConstraints({
      advanced: [{ torch: enableTorch }],
    });
    return true;
  } catch (err) {
    console.warn('Failed to toggle torch:', err);
    return false;
  }
}

/**
 * Check if the current camera track supports torch
 */
export function isTorchSupported(stream) {
  if (!stream) return false;
  const track = stream.getVideoTracks()[0];
  if (!track || !track.getCapabilities) return false;
  const capabilities = track.getCapabilities();
  return Boolean(capabilities.torch);
}

/**
 * Capture optimized frame from video element
 * Scaled to 800px max dimension and 0.75 JPEG quality for sub-second network transfer
 */
export function captureOptimizedFrame(videoElement) {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    throw new Error('Video frame not ready');
  }

  const canvas = document.createElement('canvas');
  const maxDim = 800;
  let width = videoElement.videoWidth;
  let height = videoElement.videoHeight;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, width, height);

  // Return base64 JPEG string
  return canvas.toDataURL('image/jpeg', 0.75);
}

/**
 * Generate a simulated environment frame (for desktop or camera-denied testing)
 */
export function generateTestFrame(sceneType = 'living_room') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  // Background room gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 480);
  grad.addColorStop(0, '#2a3b4c');
  grad.addColorStop(0.6, '#3a4b5c');
  grad.addColorStop(1, '#6b5442'); // Floor
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 480);

  // Floor perspective lines
  ctx.strokeStyle = '#4a382c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 320);
  ctx.lineTo(640, 320);
  ctx.moveTo(120, 320);
  ctx.lineTo(0, 480);
  ctx.moveTo(520, 320);
  ctx.lineTo(640, 480);
  ctx.stroke();

  // Draw a wooden chair directly in front
  ctx.fillStyle = '#8b5a2b';
  // Backrest
  ctx.fillRect(260, 160, 120, 100);
  ctx.fillStyle = '#654321';
  ctx.fillRect(275, 175, 90, 70);
  // Seat
  ctx.fillStyle = '#a06535';
  ctx.beginPath();
  ctx.moveTo(240, 260);
  ctx.lineTo(400, 260);
  ctx.lineTo(420, 310);
  ctx.lineTo(220, 310);
  ctx.closePath();
  ctx.fill();
  // Legs
  ctx.fillStyle = '#5c3818';
  ctx.fillRect(225, 310, 14, 110);
  ctx.fillRect(400, 310, 14, 110);
  ctx.fillRect(255, 290, 10, 70);
  ctx.fillRect(375, 290, 10, 70);

  // Text label for simulation
  ctx.fillStyle = '#00f2fe';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('[SIMULATED SCENE: Wooden chair 3 feet ahead on floor]', 30, 40);

  return canvas.toDataURL('image/jpeg', 0.8);
}
