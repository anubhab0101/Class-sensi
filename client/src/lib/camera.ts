export interface CameraConfig {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  async startCamera(videoElement: HTMLVideoElement, config: CameraConfig = {}): Promise<boolean> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: config.width || 1280,
          height: config.height || 720,
          facingMode: config.facingMode || 'user'
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement = videoElement;
      
      videoElement.srcObject = this.stream;
      
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve(true);
        };
        videoElement.onerror = () => {
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Error starting camera:', error);
      return false;
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  captureFrame(): ImageData | null {
    if (!this.videoElement) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    ctx.drawImage(this.videoElement, 0, 0);
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }
}
