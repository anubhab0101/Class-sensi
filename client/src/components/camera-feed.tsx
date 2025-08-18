import { useEffect, useRef, useState } from "react";
import { CameraManager } from "@/lib/camera";
import { FaceDetectionService, DetectedFace, BehaviorDetection } from "@/lib/face-detection";
import { FaceDetectionOverlay } from "./face-detection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Video, Camera, Settings, Expand } from "lucide-react";

interface CameraFeedProps {
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
  onFacesDetected: (faces: DetectedFace[]) => void;
  onBehaviorDetected: (behaviors: BehaviorDetection[]) => void;
}

export function CameraFeed({ 
  isRecording, 
  onRecordingChange, 
  onFacesDetected,
  onBehaviorDetected 
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraManagerRef = useRef<CameraManager>(new CameraManager());
  const faceDetectionRef = useRef<FaceDetectionService>(new FaceDetectionService());
  
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'error'>('idle');
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [detectedBehaviors, setDetectedBehaviors] = useState<BehaviorDetection[]>([]);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);

  useEffect(() => {
    const initializeServices = async () => {
      const success = await faceDetectionRef.current.initialize();
      if (!success) {
        console.error('Failed to initialize face detection');
      }
    };

    initializeServices();

    return () => {
      cameraManagerRef.current.stopCamera();
      faceDetectionRef.current.stopDetection();
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    
    setCameraStatus('starting');
    
    const hasPermission = await cameraManagerRef.current.requestPermission();
    if (!hasPermission) {
      setCameraStatus('error');
      return;
    }

    const success = await cameraManagerRef.current.startCamera(videoRef.current);
    if (success) {
      setCameraStatus('active');
      startFaceDetection();
    } else {
      setCameraStatus('error');
    }
  };

  const stopCamera = () => {
    cameraManagerRef.current.stopCamera();
    faceDetectionRef.current.stopDetection();
    setCameraStatus('idle');
    setFaceDetectionActive(false);
    setDetectedFaces([]);
    setDetectedBehaviors([]);
  };

  const startFaceDetection = async () => {
    if (!videoRef.current) return;

    // Reload student profiles for up-to-date face recognition
    await faceDetectionRef.current.loadStudentProfiles();

    setFaceDetectionActive(true);
    faceDetectionRef.current.startDetection(
      videoRef.current,
      (faces) => {
        setDetectedFaces(faces);
        onFacesDetected(faces);
      },
      (behaviors) => {
        setDetectedBehaviors(behaviors);
        onBehaviorDetected(behaviors);
      }
    );
  };

  const handleStartClass = async () => {
    if (cameraStatus === 'idle') {
      await startCamera();
    }
    onRecordingChange(true);
  };

  const handleStopClass = () => {
    onRecordingChange(false);
    stopCamera();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Live Camera Feed</h2>
          <div className="flex items-center space-x-4">
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600" data-testid="text-recording-status">Recording</span>
              </div>
            )}
            <Button
              onClick={isRecording ? handleStopClass : handleStartClass}
              className={`${
                isRecording 
                  ? 'bg-danger hover:bg-red-600' 
                  : 'bg-primary hover:bg-blue-700'
              } text-white transition-colors`}
              disabled={cameraStatus === 'starting'}
              data-testid="button-start-class"
            >
              <Video className="mr-2 h-4 w-4" />
              {isRecording ? 'Stop Class' : 'Start Class'}
            </Button>
          </div>
        </div>
        
        {/* Camera Feed Display */}
        <div className="camera-feed aspect-video bg-slate-900 rounded-lg relative">
          {cameraStatus === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Camera not started</p>
                <p className="text-sm opacity-75">Click "Start Class" to begin monitoring</p>
              </div>
            </div>
          )}
          
          {cameraStatus === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">Starting camera...</p>
              </div>
            </div>
          )}
          
          {cameraStatus === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Camera access denied</p>
                <p className="text-sm opacity-75">Please allow camera permissions and try again</p>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className={`w-full h-full object-cover rounded-lg ${
              cameraStatus === 'active' ? 'block' : 'hidden'
            }`}
            muted
            playsInline
            data-testid="video-camera-feed"
          />

          {/* Face Detection Overlay */}
          {cameraStatus === 'active' && faceDetectionActive && (
            <FaceDetectionOverlay
              faces={detectedFaces}
              behaviors={detectedBehaviors}
              containerWidth={1280}
              containerHeight={720}
            />
          )}
          
          {/* Camera controls overlay */}
          {cameraStatus === 'active' && (
            <>
              <div className="absolute bottom-4 left-4 flex space-x-2">
                <button 
                  className="bg-black/50 text-white p-2 rounded-md hover:bg-black/70 transition-colors"
                  data-testid="button-expand"
                >
                  <Expand className="h-4 w-4" />
                </button>
                <button 
                  className="bg-black/50 text-white p-2 rounded-md hover:bg-black/70 transition-colors"
                  data-testid="button-capture"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button 
                  className="bg-black/50 text-white p-2 rounded-md hover:bg-black/70 transition-colors"
                  data-testid="button-settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
              
              {/* Detection status */}
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-md text-sm">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-success" />
                  <span data-testid="text-faces-detected">{detectedFaces.length} Faces Detected</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Detection Controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-800 mb-2">Face Detection</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Status</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${faceDetectionActive ? 'bg-success' : 'bg-slate-400'}`}></div>
                <span className={`text-sm font-medium ${faceDetectionActive ? 'text-success' : 'text-slate-400'}`}>
                  {faceDetectionActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-800 mb-2">Behavior Monitor</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Warnings</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${detectedBehaviors.length > 0 ? 'bg-warning' : 'bg-success'}`}></div>
                <span className={`text-sm font-medium ${detectedBehaviors.length > 0 ? 'text-warning' : 'text-success'}`}>
                  {detectedBehaviors.length} Alert{detectedBehaviors.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-800 mb-2">Attendance Rate</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Present</span>
              <span className="text-sm text-success font-bold" data-testid="text-attendance-rate">
                {detectedFaces.length > 0 ? '85%' : '0%'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
