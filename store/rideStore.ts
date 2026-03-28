import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GPSPoint } from '@/lib/gps';

interface RideState {
  isTracking: boolean;
  currentRide: {
    id: string | null;
    startTime: number | null;
    points: GPSPoint[];
    distance: number;
    avgSpeed: number;
    maxSpeed: number;
  };
  startRide: () => void;
  stopRide: () => void;
  addPoint: (point: GPSPoint) => void;
  reset: () => void;
}

export const useRideStore = create<RideState>()(
  persist(
    (set) => ({
      isTracking: false,
      currentRide: {
        id: null,
        startTime: null,
        points: [],
        distance: 0,
        avgSpeed: 0,
        maxSpeed: 0,
      },
      startRide: () =>
        set({
          isTracking: true,
          currentRide: {
            id: crypto.randomUUID(),
            startTime: Date.now(),
            points: [],
            distance: 0,
            avgSpeed: 0,
            maxSpeed: 0,
          },
        }),
      stopRide: () => set({ isTracking: false }),
      addPoint: (point) =>
        set((state) => ({
          currentRide: {
            ...state.currentRide,
            points: [...state.currentRide.points, point],
          },
        })),
      reset: () =>
        set({
          isTracking: false,
          currentRide: {
            id: null,
            startTime: null,
            points: [],
            distance: 0,
            avgSpeed: 0,
            maxSpeed: 0,
          },
        }),
    }),
    {
      name: 'ride-storage',
      partialize: (state) => ({
        isTracking: state.isTracking,
        currentRide: state.currentRide,
      }),
    }
  )
);
