export const TRIP_STORAGE_KEY = "kerala-trip-id";
export const MEMBER_STORAGE_KEY = "kerala-trip-member-id";

export function getStoredTripId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TRIP_STORAGE_KEY);
}

export function setStoredTripId(id: string) {
  localStorage.setItem(TRIP_STORAGE_KEY, id);
}

export function clearStoredTrip() {
  localStorage.removeItem(TRIP_STORAGE_KEY);
  localStorage.removeItem(MEMBER_STORAGE_KEY);
}
