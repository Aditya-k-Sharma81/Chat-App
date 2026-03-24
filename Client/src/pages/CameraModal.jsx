import { useRef, useEffect, useState } from "react";

export default function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL("image/jpeg");
    onCapture(dataUrl);
    onClose();
  };

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="camera-modal-header">
          <h3>Take a Photo</h3>
          <button className="camera-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="camera-video-wrapper">
          {error ? (
            <div className="camera-error">{error}</div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              {!isStreaming && <div className="camera-loading">Loading camera...</div>}
            </>
          )}
        </div>

        <div className="camera-controls">
          <button 
            className="capture-btn" 
            onClick={handleCapture}
            disabled={!!error || !isStreaming}
          >
            <div className="capture-icon-inner" />
          </button>
        </div>
        
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
