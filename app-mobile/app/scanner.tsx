import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/** Legge QR nel formato "allertgy:123456", URL /r/123456 o direttamente il codice numerico. */
export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Serve il permesso fotocamera per leggere il QR sul tavolo.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Consenti fotocamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (scanned.current) return;
          const code = data
            .replace(/^allertgy:\/?\/?/i, '')
            .replace(/^.*\/r\//i, '')
            .split(/[?#]/)[0]
            .trim();
          if (/^\d{4,8}$/.test(code)) {
            scanned.current = true;
            router.replace(`/menu/${code}`);
          }
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.hint}>Inquadra il QR code AllerTgy sul tavolo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { textAlign: 'center', color: '#475569', fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#059669', borderRadius: 12, padding: 14, paddingHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
  overlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  hint: {
    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, overflow: 'hidden',
  },
});
