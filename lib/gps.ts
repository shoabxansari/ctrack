export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
  altitude?: number;
}

export class GPSTracker {
  private watchId: number | null = null;
  private onUpdate: (point: GPSPoint) => void;

  constructor(onUpdate: (point: GPSPoint) => void) {
    this.onUpdate = onUpdate;
  }

  start() {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point: GPSPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed || undefined,
          altitude: position.coords.altitude || undefined,
        };
        this.onUpdate(point);
      },
      (error) => {
        console.error('GPS error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          alert('Location access denied. Please enable location permissions in your browser settings.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
