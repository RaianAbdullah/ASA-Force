/**
 * ASA Workforce — Location helpers
 * Wraps expo-location with permission handling and a clean API.
 */
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface Coords {
  latitude:  number;
  longitude: number;
  accuracy:  number | null;  // metres
}

/**
 * Requests foreground location permission and returns current coords.
 * Throws a user-friendly string on permission denied or timeout.
 */
export async function getCurrentLocation(): Promise<Coords> {
  if (Platform.OS === 'web') {
    // Browser Geolocation API fallback
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation is not supported on this device.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy:  pos.coords.accuracy,
        }),
        () => reject('Unable to get location. Please enable location services.'),
        { timeout: 15000, enableHighAccuracy: true }
      );
    });
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw 'Location permission is required to check in. Please allow location access in Settings.';
  }

  const result = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude:  result.coords.latitude,
    longitude: result.coords.longitude,
    accuracy:  result.coords.accuracy,
  };
}

/** Returns true if location permission is already granted (no prompt). */
export async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}
