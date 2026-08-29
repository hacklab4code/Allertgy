import { Linking, Platform } from 'react-native';

type VenueMapsTarget = {
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
  address?: string | null;
};

/**
 * Apre Apple Maps (iOS) o Google Maps (Android/fallback) sul locale.
 * Evita gli scheme `maps://` / `geo:` fragili.
 */
export function openVenueInMaps({
  latitude,
  longitude,
  name,
  address,
}: VenueMapsTarget): void {
  const label = (name || address || '').trim();
  const hasCoords = latitude != null && longitude != null
    && Number.isFinite(latitude) && Number.isFinite(longitude);

  let primary: string;
  let fallback: string;

  if (hasCoords) {
    const q = encodeURIComponent(label || `${latitude},${longitude}`);
    primary = Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    fallback = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  } else if (address?.trim()) {
    const q = encodeURIComponent(address.trim());
    primary = Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`;
    fallback = `https://www.google.com/maps/search/?api=1&query=${q}`;
  } else if (label) {
    const q = encodeURIComponent(label);
    primary = Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`;
    fallback = `https://www.google.com/maps/search/?api=1&query=${q}`;
  } else {
    return;
  }

  Linking.openURL(primary).catch(() => {
    if (fallback !== primary) Linking.openURL(fallback).catch(() => {});
  });
}
