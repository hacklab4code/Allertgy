import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

export function MapComponent({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}

export function MarkerComponent({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}

export function CalloutComponent({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}

export default function MapWrapper({
  style,
  children
}: MapWrapperProps) {
  return (
    <View style={[style, styles.webFallback]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.title}>Mappa non disponibile su Web</Text>
        <Text style={styles.subtitle}>
          Usa l'app mobile AllerTgy per visualizzare la mappa interattiva dei locali compatibili con le tue allergie.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
