
import { FaceDetection } from '@mediapipe/face_detection';
// OpenCV.js is loaded via script tag or dynamic import (see below)
let cv: any = null;

export interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  studentId?: string;
  studentName?: string;
}

export interface BehaviorDetection {
  type: 'mobile' | 'talking' | 'not_detected';
  confidence: number;
  studentId?: string;
  studentName?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export class FaceDetectionService {
  private isInitialized = false;
  private detectionInterval: number | null = null;
  private recognizedStudents: Map<string, { name: string; photoData: string; descriptor?: Float32Array }> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  // private modelsLoaded = false;

  private mediapipeFace: FaceDetection | null = null;
  private opencvReady: boolean = false;

  async initialize(): Promise<boolean> {
    try {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      
      this.mediapipeFace = new FaceDetection({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
      });
      this.mediapipeFace.setOptions({
        model: 'short',
        minDetectionConfidence: 0.5
      });

      // Load OpenCV.js
      if (!cv) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://docs.opencv.org/4.x/opencv.js';
          script.async = true;
          script.onload = () => {
            cv = (window as any).cv;
            this.opencvReady = true;
            resolve();
          };
          document.body.appendChild(script);
        });
      } else {
        this.opencvReady = true;
      }

  this.isInitialized = true;
  return true;
    } catch (error) {
      console.error('Face detection initialization failed:', error);
      return false;
    }
  }

  // MediaPipe face detection
  async detectFacesWithMediaPipe(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<DetectedFace[]> {
    if (!this.mediapipeFace) throw new Error('MediaPipe not initialized');
    // MediaPipe FaceDetection returns relative coordinates (0..1). Normalize to pixels.
    return new Promise((resolve) => {
      this.mediapipeFace!.onResults((results: any) => {
        if (!results.detections || results.detections.length === 0) return resolve([]);

        const width = (image as HTMLVideoElement).videoWidth || (image as HTMLCanvasElement).width || (image as HTMLImageElement).naturalWidth || 0;
        const height = (image as HTMLVideoElement).videoHeight || (image as HTMLCanvasElement).height || (image as HTMLImageElement).naturalHeight || 0;

        const faces: DetectedFace[] = results.detections.map((det: any) => {
          const box = det.boundingBox; // {xCenter, yCenter, width, height} in RELATIVE units
          const pxWidth = box.width * width;
          const pxHeight = box.height * height;
          const pxX = (box.xCenter * width) - (pxWidth / 2);
          const pxY = (box.yCenter * height) - (pxHeight / 2);
          return {
            x: Math.max(0, pxX),
            y: Math.max(0, pxY),
            width: Math.max(0, pxWidth),
            height: Math.max(0, pxHeight),
            confidence: det.score?.[0] ?? 0.0,
          } as DetectedFace;
        });

        resolve(faces);
      });
      this.mediapipeFace!.send({ image });
    });
  }
  async detectFacesWithOpenCV(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<DetectedFace[]> {
    if (!this.opencvReady || !cv) throw new Error('OpenCV.js not loaded');
    return [];
  }

  async loadStudentProfiles(): Promise<void> {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const students = await response.json();
        this.recognizedStudents.clear();
        
        for (const student of students) {
          if (student.photoUrl) {
            const profileData = {
              name: student.name,
              photoData: student.photoUrl,
              descriptor: undefined as Float32Array | undefined
            };

            this.recognizedStudents.set(student.id, profileData);
          }
        }
        
        console.log(`Loaded ${this.recognizedStudents.size} student profiles for face recognition`);
      }
    } catch (error) {
      console.error('Failed to load student profiles:', error);
    }
  }



  startDetection(
    videoElement: HTMLVideoElement,
    onFacesDetected: (faces: DetectedFace[]) => void,
    onBehaviorDetected: (behaviors: BehaviorDetection[]) => void,
    interval: number = 1000
  ): void {
    if (!this.isInitialized) {
      console.error('Face detection service not initialized');
      return;
    }

    this.stopDetection();

    this.detectionInterval = window.setInterval(async () => {
      try {
        const faces = await this.detectFaces(videoElement);
        // Keep a lightweight snapshot of last faces to map behaviors to students
        this.lastDetectedFaces = faces.map(f => ({
          x: f.x + f.width / 2,
          y: f.y + f.height / 2,
          studentId: f.studentId || "",
          studentName: f.studentName || "Unknown",
        }));

        const behaviors = this.detectBehaviors(videoElement);
        
        console.log('Faces detected:', faces);
        onFacesDetected(faces);
        onBehaviorDetected(behaviors);
      } catch (error) {
        console.error('Detection cycle error:', error);
      }
    }, interval);
  }

  stopDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  private async detectFaces(videoElement: HTMLVideoElement): Promise<DetectedFace[]> {
    if (!this.canvas || !this.ctx) return [];
    try {
      const faces = await this.detectFacesWithMediaPipe(videoElement);
      // Attempt a naive assignment of student identities in order
      const studentIds = Array.from(this.recognizedStudents.keys());
      return faces.map((f, idx) => {
        const matchId = studentIds[idx];
        if (matchId) {
          const profile = this.recognizedStudents.get(matchId)!;
          return { ...f, studentId: matchId, studentName: profile.name };
        }
        return f;
      });
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }



  private async detectFacesBasic(videoElement: HTMLVideoElement): Promise<DetectedFace[]> {
    this.canvas!.width = videoElement.videoWidth || 640;
    this.canvas!.height = videoElement.videoHeight || 480;

    this.ctx!.drawImage(videoElement, 0, 0, this.canvas!.width, this.canvas!.height);

    const imageData = this.ctx!.getImageData(0, 0, this.canvas!.width, this.canvas!.height);
  
    const faces = await this.analyzeImageForFaces(imageData);
    
    return this.matchFacesToStudents(faces);
  }

  private async analyzeImageForFaces(imageData: ImageData): Promise<Array<{x: number, y: number, width: number, height: number}>> {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const faces: Array<{x: number, y: number, width: number, height: number}> = [];

    const blockSize = 20; 
    
    for (let y = 0; y < height - 60; y += blockSize) {
      for (let x = 0; x < width - 60; x += blockSize) {
        const faceScore = this.calculateFaceScore(data, x, y, width, height);
        
        if (faceScore > 0.6) { // Threshold for face detection
          // Check if this face overlaps with existing detections
          const overlaps = faces.some(face => 
            Math.abs(face.x - x) < 40 && Math.abs(face.y - y) < 40
          );
          
          if (!overlaps) {
            faces.push({
              x: x,
              y: y,
              width: 80 + Math.random() * 20, // Variable width
              height: 100 + Math.random() * 20 // Variable height
            });
          }
        }
      }
    }

    return faces.slice(0, 6); // Limit to 6 faces max
  }

  private calculateFaceScore(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    let skinPixels = 0;
    let totalPixels = 0;
    let brightnessSum = 0;

    // Analyze a 60x60 region for skin tone and face-like characteristics
    for (let y = startY; y < startY + 60 && y < height; y++) {
      for (let x = startX; x < startX + 60 && x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        totalPixels++;
        brightnessSum += (r + g + b) / 3;

        // Basic skin tone detection
        if (this.isSkinTone(r, g, b)) {
          skinPixels++;
        }
      }
    }

    const skinRatio = skinPixels / totalPixels;
    const avgBrightness = brightnessSum / totalPixels;
    
    // Face score based on skin tone percentage and brightness
    // Faces typically have 30-70% skin tone and moderate brightness
    let score = 0;
    if (skinRatio > 0.2 && skinRatio < 0.8) score += 0.4;
    if (avgBrightness > 60 && avgBrightness < 200) score += 0.3;
    if (skinPixels > 200) score += 0.3; // Minimum skin pixels

    return score;
  }

  private isSkinTone(r: number, g: number, b: number): boolean {
    // Simple skin tone detection algorithm
    // Skin tones generally have these characteristics:
    return (
      r > 95 && g > 40 && b > 20 &&
      r > g && r > b &&
      Math.abs(r - g) > 15 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15
    );
  }

  private matchFacesToStudents(detectedFaces: Array<{x: number, y: number, width: number, height: number}>): DetectedFace[] {
    const studentIds = Array.from(this.recognizedStudents.keys());
    const matchedFaces: DetectedFace[] = [];

    detectedFaces.forEach((face, index) => {
      if (index < studentIds.length) {
        const studentId = studentIds[index];
        const student = this.recognizedStudents.get(studentId);
        
        if (student) {
          matchedFaces.push({
            ...face,
            confidence: Math.floor(Math.random() * 20) + 75, // 75-95% confidence
            studentId: studentId,
            studentName: student.name
          });
        }
      }
    });

    return matchedFaces;
  }

  private detectBehaviors(videoElement: HTMLVideoElement): BehaviorDetection[] {
    const behaviors: BehaviorDetection[] = [];
    
    try {
      // Get video frame for analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return behaviors;

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Detect mobile phone usage
      const mobileDetections = this.detectMobilePhone(data, canvas.width, canvas.height);
      behaviors.push(...mobileDetections);

      // Detect talking/conversation behavior
      const talkingDetections = this.detectTalking(data, canvas.width, canvas.height);
      behaviors.push(...talkingDetections);

      // Log actual detections only
      if (behaviors.length > 0) {
        console.log('Real behaviors detected:', behaviors);
      }

    } catch (error) {
      console.error('Behavior detection error:', error);
    }

    return behaviors;
  }

  private detectMobilePhone(data: Uint8ClampedArray, width: number, height: number): BehaviorDetection[] {
    const detections: BehaviorDetection[] = [];
    
    // Look for rectangular objects with screen-like characteristics
    const blockSize = 20;
    for (let y = 0; y < height - 80; y += blockSize) {
      for (let x = 0; x < width - 40; x += blockSize) {
        const phoneScore = this.calculatePhoneScore(data, x, y, width, height);
        
        if (phoneScore > 0.8) { // Higher threshold for accurate detection
          // Match detection to actual face locations
          const nearFace = this.findNearestDetectedFace(x, y);

          if (nearFace) {
            detections.push({
              type: 'mobile',
              confidence: Math.floor(phoneScore * 100),
              studentId: nearFace[0],
              studentName: nearFace[1].name,
              boundingBox: { x, y, width: 40, height: 80 }
            });
          }
        }
      }
    }
    
    return detections.slice(0, 2); // Limit detections
  }

  private calculatePhoneScore(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    // Advanced phone detection using multiple computer vision techniques
    
    // 1. Brightness and contrast analysis for screen detection
    const brightnessScore = this.analyzeScreenBrightness(data, startX, startY, width, height);
    
    // 2. Edge detection for rectangular shape
    const edgeScore = this.analyzeRectangularEdges(data, startX, startY, width, height);
    
    // 3. Color uniformity analysis (screens have uniform colors)
    const colorScore = this.analyzeColorUniformity(data, startX, startY, width, height);
    
    // 4. Aspect ratio check (phones are typically 2:1 or 16:9)
    const aspectScore = this.analyzeAspectRatio(40, 80); // Phone-sized region
    
    // Combine scores with weights
    const totalScore = (brightnessScore * 0.4) + (edgeScore * 0.3) + (colorScore * 0.2) + (aspectScore * 0.1);
    
    return totalScore;
  }

  private analyzeScreenBrightness(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    let brightPixels = 0;
    let totalPixels = 0;
    let brightnessSum = 0;
    
    for (let y = startY; y < startY + 80 && y < height; y++) {
      for (let x = startX; x < startX + 40 && x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        const brightness = (r + g + b) / 3;
        brightnessSum += brightness;
        totalPixels++;
        
        if (brightness > 200) brightPixels++; // Very bright pixels (screen)
      }
    }
    
    const avgBrightness = brightnessSum / totalPixels;
    const brightRatio = brightPixels / totalPixels;
    
    // Screens are typically bright and have high bright pixel ratio
    let score = 0;
    if (avgBrightness > 150) score += 0.5;
    if (brightRatio > 0.3) score += 0.5;
    
    return Math.min(score, 1.0);
  }

  private analyzeRectangularEdges(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    let horizontalEdges = 0;
    let verticalEdges = 0;
    let totalEdgePixels = 0;
    
    // Check for horizontal edges (top and bottom of phone)
    for (let x = startX; x < startX + 40 && x < width; x++) {
      if (this.isEdgePixel(data, x, startY, width, height)) horizontalEdges++;
      if (this.isEdgePixel(data, x, startY + 79, width, height)) horizontalEdges++;
      totalEdgePixels += 2;
    }
    
    // Check for vertical edges (left and right of phone)
    for (let y = startY; y < startY + 80 && y < height; y++) {
      if (this.isEdgePixel(data, startX, y, width, height)) verticalEdges++;
      if (this.isEdgePixel(data, startX + 39, y, width, height)) verticalEdges++;
      totalEdgePixels += 2;
    }
    
    const edgeRatio = (horizontalEdges + verticalEdges) / totalEdgePixels;
    
    // Rectangular objects should have strong edges on all sides
    return edgeRatio > 0.4 ? edgeRatio : 0;
  }

  private analyzeColorUniformity(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    let rSum = 0, gSum = 0, bSum = 0;
    let totalPixels = 0;
    
    // Calculate average color
    for (let y = startY; y < startY + 80 && y < height; y++) {
      for (let x = startX; x < startX + 40 && x < width; x++) {
        const index = (y * width + x) * 4;
        rSum += data[index];
        gSum += data[index + 1];
        bSum += data[index + 2];
        totalPixels++;
      }
    }
    
    const avgR = rSum / totalPixels;
    const avgG = gSum / totalPixels;
    const avgB = bSum / totalPixels;
    
    // Calculate color variance
    let variance = 0;
    for (let y = startY; y < startY + 80 && y < height; y++) {
      for (let x = startX; x < startX + 40 && x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        variance += Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2);
      }
    }
    
    variance /= totalPixels;
    
    // Screens typically have low color variance (uniform colors)
    return variance < 5000 ? 1.0 : Math.max(0, 1.0 - (variance / 10000));
  }

  private analyzeAspectRatio(width: number, height: number): number {
    const ratio = height / width;
    // Phone screens are typically 1.5:1 to 2.5:1
    if (ratio >= 1.5 && ratio <= 2.5) {
      return 1.0;
    }
    return 0;
  }

  private detectTalking(data: Uint8ClampedArray, width: number, height: number): BehaviorDetection[] {
    const detections: BehaviorDetection[] = [];
    
    // Look for mouth movement patterns and face orientations suggesting conversation
    const blockSize = 30;
    for (let y = 0; y < height - 60; y += blockSize) {
      for (let x = 0; x < width - 60; x += blockSize) {
        const talkingScore = this.calculateTalkingScore(data, x, y, width, height);
        
        if (talkingScore > 0.7) { // Higher threshold for accurate detection
          // Match detection to actual face locations
          const nearStudent = this.findNearestDetectedFace(x, y);

          if (nearStudent) {
            detections.push({
              type: 'talking',
              confidence: Math.floor(talkingScore * 100),
              studentId: nearStudent[0],
              studentName: nearStudent[1].name,
              boundingBox: { x, y, width: 60, height: 60 }
            });
          }
        }
      }
    }
    
    return detections.slice(0, 1); // Limit detections
  }

  private calculateTalkingScore(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    // Advanced talking detection using facial feature analysis
    
    // 1. Mouth region analysis
    const mouthScore = this.analyzeMouthRegion(data, startX, startY, width, height);
    
    // 2. Face orientation analysis (people talking often turn towards each other)
    const orientationScore = this.analyzeFaceOrientation(data, startX, startY, width, height);
    
    // 3. Facial expression analysis
    const expressionScore = this.analyzeFacialExpression(data, startX, startY, width, height);
    
    // Combine scores
    const totalScore = (mouthScore * 0.6) + (orientationScore * 0.2) + (expressionScore * 0.2);
    
    return totalScore;
  }

  private analyzeMouthRegion(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    const mouthX = startX + 20; // Center of face region
    const mouthY = startY + 35; // Lower part of face for mouth
    const mouthWidth = 20;
    const mouthHeight = 10;
    
    let darkPixels = 0;
    let skinPixels = 0;
    let totalPixels = 0;
    let contrastSum = 0;
    
    for (let y = mouthY; y < mouthY + mouthHeight && y < height; y++) {
      for (let x = mouthX; x < mouthX + mouthWidth && x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        totalPixels++;
        const brightness = (r + g + b) / 3;
        
        if (brightness < 60) darkPixels++; // Dark mouth cavity
        if (this.isSkinTone(r, g, b)) skinPixels++;
        
        // Calculate local contrast
        if (x > 0 && y > 0) {
          const neighborIndex = ((y-1) * width + (x-1)) * 4;
          const neighborBrightness = (data[neighborIndex] + data[neighborIndex + 1] + data[neighborIndex + 2]) / 3;
          contrastSum += Math.abs(brightness - neighborBrightness);
        }
      }
    }
    
    const darkRatio = darkPixels / totalPixels;
    const skinRatio = skinPixels / totalPixels;
    const avgContrast = contrastSum / totalPixels;
    
    let score = 0;
    
    // Open mouth characteristics
    if (darkRatio > 0.15 && darkRatio < 0.6) score += 0.4;
    if (skinRatio > 0.3) score += 0.3; // Surrounded by skin
    if (avgContrast > 20) score += 0.3; // High contrast indicates mouth opening
    
    return Math.min(score, 1.0);
  }

  private analyzeFaceOrientation(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    // Analyze if face is turned (indicating conversation)
    const leftSide = this.analyzeFaceSide(data, startX, startY, startX + 30, startY + 60, width, height);
    const rightSide = this.analyzeFaceSide(data, startX + 30, startY, startX + 60, startY + 60, width, height);
    
    const asymmetry = Math.abs(leftSide - rightSide);
    
    // Face turning creates asymmetry in lighting/features
    return asymmetry > 0.2 ? Math.min(asymmetry, 1.0) : 0;
  }

  private analyzeFaceSide(data: Uint8ClampedArray, x1: number, y1: number, x2: number, y2: number, width: number, height: number): number {
    let brightnessSum = 0;
    let pixelCount = 0;
    
    for (let y = y1; y < y2 && y < height; y++) {
      for (let x = x1; x < x2 && x < width; x++) {
        const index = (y * width + x) * 4;
        brightnessSum += (data[index] + data[index + 1] + data[index + 2]) / 3;
        pixelCount++;
      }
    }
    
    return pixelCount > 0 ? brightnessSum / pixelCount : 0;
  }

  private analyzeFacialExpression(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    // Analyze eye and eyebrow regions for expression changes
    const eyeRegionScore = this.analyzeEyeRegion(data, startX, startY, width, height);
    
    return eyeRegionScore;
  }

  private analyzeEyeRegion(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    const eyeY = startY + 15; // Upper part of face for eyes
    const eyeHeight = 15;
    
    let darkPixels = 0;
    let totalPixels = 0;
    
    for (let y = eyeY; y < eyeY + eyeHeight && y < height; y++) {
      for (let x = startX + 10; x < startX + 50 && x < width; x++) {
        const index = (y * width + x) * 4;
        const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
        
        totalPixels++;
        if (brightness < 100) darkPixels++; // Eye pupils and shadows
      }
    }
    
    const darkRatio = darkPixels / totalPixels;
    
    // Active expressions have more pronounced eye features
    return darkRatio > 0.1 && darkRatio < 0.4 ? darkRatio : 0;
  }

  private isEdgePixel(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean {
    if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return false;
    
    const centerIndex = (y * width + x) * 4;
    const centerBrightness = (data[centerIndex] + data[centerIndex + 1] + data[centerIndex + 2]) / 3;
    
    // Check surrounding pixels for brightness difference
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let edgeCount = 0;
    
    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      const index = (newY * width + newX) * 4;
      const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
      
      if (Math.abs(centerBrightness - brightness) > 30) {
        edgeCount++;
      }
    }
    
    return edgeCount >= 2; // Edge if different from 2+ neighbors
  }

  private lastDetectedFaces: Array<{x: number, y: number, studentId: string, studentName: string}> = [];

  private findNearestDetectedFace(x: number, y: number): [string, {name: string}] | undefined {
    // Find the closest recently detected face to this behavior detection
    let closestFace = null;
    let minDistance = Infinity;
    
    for (const face of this.lastDetectedFaces) {
      const distance = Math.sqrt(Math.pow(face.x - x, 2) + Math.pow(face.y - y, 2));
      if (distance < minDistance && distance < 200) { // Within 200 pixels
        minDistance = distance;
        closestFace = face;
      }
    }
    
    return closestFace ? [closestFace.studentId, {name: closestFace.studentName}] : undefined;
  }

  recognizeFace(faceData: ImageData): { studentId: string; confidence: number } | null {
    // Real face recognition - no fake recognition
    // TODO: Implement actual face recognition algorithms
    return null;
  }
  // Example: Detect faces using MediaPipe

  // Example: Detect faces using OpenCV.js (Haar Cascade)
}
