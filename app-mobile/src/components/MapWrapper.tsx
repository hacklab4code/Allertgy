import React, { useEffect, useRef } from 'react';
import MapView, { Marker, Callout, Region } from 'react-native-maps';

interface MapWrapperProps {
  style: object;
  showsUserLocation: boolean;
  showsMyLocationButton: boolean;
  initialRegion: Region;
  region?: Region;
  children: React.ReactNode;
}

export const MapComponent = MapView;
export const MarkerComponent = Marker;
export const CalloutComponent = Callout;

export default function MapWrapper({
  style,
  showsUserLocation,
  showsMyLocationButton,
  initialRegion,
  region,
  children,
}: MapWrapperProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 600);
    }
  }, [region?.latitude, region?.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={style}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      initialRegion={initialRegion}
      region={region}
    >
      {children}
    </MapView>
  );
}
