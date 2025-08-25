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
  // Group detections by student to prevent overlapping statuses
  const studentDetections = new Map<string, { face?: DetectedFace; behavior?: BehaviorDetection }>();
  
  // Process faces first (they take priority)
  faces.forEach(face => {
    if (face.studentName) {
      studentDetections.set(face.studentName, { 
        ...studentDetections.get(face.studentName), 
        face 
      });
    }
  });
  
  // Process behaviors (only if no face detected for that student)
  behaviors.forEach(behavior => {
    if (behavior.studentName && !studentDetections.get(behavior.studentName)?.face) {
      studentDetections.set(behavior.studentName, { 
        ...studentDetections.get(behavior.studentName), 
        behavior 
      });
    }
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Render detections for each student */}
      {Array.from(studentDetections.entries()).map(([studentName, detection], index) => {
        if (detection.face) {
          // Show face detection with "Present" status
          return (
            <div
              key={`face-${index}`}
              className="face-detection-box"
              style={{
                left: `${(detection.face.x / containerWidth) * 100}%`,
                top: `${(detection.face.y / containerHeight) * 100}%`,
                width: `${(detection.face.width / containerWidth) * 100}%`,
                height: `${(detection.face.height / containerHeight) * 100}%`,
              }}
              data-testid={`face-detection-${index}`}
            >
              <div className="bg-success text-white text-xs px-2 py-1 rounded-b-md">
                {studentName} - Present
              </div>
            </div>
          );
        } else if (detection.behavior) {
          // Show behavior warning
          return (
            <div
              key={`behavior-${index}`}
              className="behavior-warning-box"
              style={{
                left: detection.behavior.boundingBox 
                  ? `${(detection.behavior.boundingBox.x / containerWidth) * 100}%` 
                  : '20%',
                top: detection.behavior.boundingBox 
                  ? `${(detection.behavior.boundingBox.y / containerHeight) * 100}%` 
                  : '35%',
                width: detection.behavior.boundingBox 
                  ? `${(detection.behavior.boundingBox.width / containerWidth) * 100}%` 
                  : '90px',
                height: detection.behavior.boundingBox 
                  ? `${(detection.behavior.boundingBox.height / containerHeight) * 100}%` 
                  : '110px',
              }}
              data-testid={`behavior-warning-${index}`}
            >
              <div className="bg-warning text-white text-xs px-2 py-1 rounded-b-md">
                {studentName} - {detection.behavior.type === 'mobile' ? 'Phone Detected' : 'Not Detected'}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
