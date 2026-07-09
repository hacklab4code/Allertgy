import React from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';

interface MapWrapperProps {
  style: any;
  showsUserLocation: boolean;
  showsMyLocationButton: boolean;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
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
  children
}: MapWrapperProps) {
  return (
    <MapView
      style={style}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      initialRegion={initialRegion}
    >
      {children}
    </MapView>
  );
}
