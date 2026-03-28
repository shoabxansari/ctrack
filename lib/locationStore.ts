import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number }) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      userLocation: null,
      setUserLocation: (location) => set({ userLocation: location }),
    }),
    {
      name: 'location-storage',
    }
  )
);
