import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, RotateCcw, Check, X } from "lucide-react";

interface PhotoCaptureProps {
  onPhotoCapture: (photoDataUrl: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function PhotoCapture({ onPhotoCapture, onCancel, isOpen }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedPhoto(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data as base64
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto);
      setCapturedPhoto(null);
      stopCamera();
    }
  };

  const handleCancel = () => {
    setCapturedPhoto(null);
    stopCamera();
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Capture Student Photo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                data-testid="button-close-camera"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {cameraError ? (
              <div className="text-center py-8">
                <Camera className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="text-danger mb-4">{cameraError}</p>
                <Button onClick={startCamera} data-testid="button-retry-camera">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Camera Preview / Captured Photo */}
                <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video">
                  {capturedPhoto ? (
                    <img
                      src={capturedPhoto}
                      alt="Captured photo"
                      className="w-full h-full object-cover"
                      data-testid="img-captured-photo"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      data-testid="video-camera-preview"
                    />
                  )}
                  
                  {/* Face detection guide overlay */}
                  {!capturedPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-white/50 rounded-full w-48 h-48 flex items-center justify-center">
                        <div className="text-white/70 text-sm text-center">
                          <Camera className="h-8 w-8 mx-auto mb-2" />
                          Position face here
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex justify-center space-x-4">
                  {capturedPhoto ? (
                    // Photo review controls
                    <>
                      <Button
                        variant="outline"
                        onClick={retakePhoto}
                        data-testid="button-retake-photo"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retake
                      </Button>
                      <Button
                        onClick={confirmPhoto}
                        className="bg-success text-white hover:bg-green-600"
                        data-testid="button-confirm-photo"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Use Photo
                      </Button>
                    </>
                  ) : (
                    // Camera controls
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        data-testid="button-cancel-capture"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={capturePhoto}
                        className="bg-primary text-white"
                        disabled={!stream}
                        data-testid="button-capture-photo"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Capture Photo
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-sm text-slate-600 text-center">
                  {capturedPhoto 
                    ? "Review the photo and confirm to use it for face recognition."
                    : "Position the student's face in the circle and click capture."
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for photo processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}