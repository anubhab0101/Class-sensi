import { useEffect, useRef } from "react";
import { DetectedFace, BehaviorDetection } from "@/lib/face-detection";

interface FaceDetectionOverlayProps {
  faces: DetectedFace[];
  behaviors: BehaviorDetection[];
  containerWidth: number;
  containerHeight: number;
}

export function FaceDetectionOverlay({ 
  faces, 
  behaviors, 
  containerWidth, 
  containerHeight 
}: FaceDetectionOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Face detection boxes */}
      {faces.map((face, index) => (
        <div
          key={`face-${index}`}
          className="face-detection-box"
          style={{
            left: `${(face.x / containerWidth) * 100}%`,
            top: `${(face.y / containerHeight) * 100}%`,
            width: `${(face.width / containerWidth) * 100}%`,
            height: `${(face.height / containerHeight) * 100}%`,
          }}
          data-testid={`face-detection-${index}`}
        >
          <div className="bg-success text-white text-xs px-2 py-1 rounded-b-md">
            {face.studentName || 'Unknown'} - Present
          </div>
        </div>
      ))}

      {/* Behavior warning boxes */}
      {behaviors.map((behavior, index) => (
        <div
          key={`behavior-${index}`}
          className="behavior-warning-box"
          style={{
            left: behavior.boundingBox 
              ? `${(behavior.boundingBox.x / containerWidth) * 100}%` 
              : '20%',
            top: behavior.boundingBox 
              ? `${(behavior.boundingBox.y / containerHeight) * 100}%` 
              : '35%',
            width: behavior.boundingBox 
              ? `${(behavior.boundingBox.width / containerWidth) * 100}%` 
              : '90px',
            height: behavior.boundingBox 
              ? `${(behavior.boundingBox.height / containerHeight) * 100}%` 
              : '110px',
          }}
          data-testid={`behavior-warning-${index}`}
        >
          <div className="bg-warning text-white text-xs px-2 py-1 rounded-b-md">
            {behavior.studentName || 'Unknown'} - {behavior.type === 'mobile' ? 'Phone Detected' : 'Not Detected'}
          </div>
        </div>
      ))}
    </div>
  );
}
