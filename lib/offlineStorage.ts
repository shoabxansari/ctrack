import { GPSPoint } from './gps';

export interface OfflineRide {
  id: string;
  startTime: number;
  endTime?: number;
  points: GPSPoint[];
  synced: boolean;
}

const STORAGE_KEY = 'offline_rides';

export const offlineStorage = {
  saveRide: (ride: OfflineRide) => {
    const rides = offlineStorage.getAllRides();
    rides.push(ride);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
  },

  getAllRides: (): OfflineRide[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getUnsyncedRides: (): OfflineRide[] => {
    return offlineStorage.getAllRides().filter(r => !r.synced);
  },

  markAsSynced: (rideId: string) => {
    const rides = offlineStorage.getAllRides();
    const updated = rides.map(r => 
      r.id === rideId ? { ...r, synced: true } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  clearSyncedRides: () => {
    const rides = offlineStorage.getAllRides().filter(r => !r.synced);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
  },
};
