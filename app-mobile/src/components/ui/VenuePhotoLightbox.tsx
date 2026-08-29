import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassIconButton } from './GlassIconButton';

type Props = {
  visible: boolean;
  uris: string[];
  initialIndex?: number;
  onClose: () => void;
  language?: string;
};

export function VenuePhotoLightbox({
  visible,
  uris,
  initialIndex = 0,
  onClose,
  language = 'it',
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(initialIndex);
  const isIt = language.toLowerCase().startsWith('it');

  useEffect(() => {
    if (!visible) return;
    const safeIndex = Math.max(0, Math.min(initialIndex, uris.length - 1));
    setPage(safeIndex);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: safeIndex * width, animated: false });
    });
  }, [visible, initialIndex, uris.length, width]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / width);
    setPage(Math.max(0, Math.min(uris.length - 1, next)));
  };

  if (!uris.length) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar style="light" />
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
        >
          {uris.map((uri, i) => (
            <Pressable key={`${uri}-${i}`} style={{ width, height }} onPress={onClose}>
              <Image source={{ uri }} style={styles.image} resizeMode="contain" />
            </Pressable>
          ))}
        </ScrollView>

        <View pointerEvents="box-none" style={[styles.chrome, { top: insets.top + 8 }]}>
          <GlassIconButton
            variant="ghost"
            size={54}
            icon="close"
            onPress={onClose}
            accessibilityLabel={isIt ? 'Chiudi galleria' : 'Close gallery'}
          />
        </View>

        {uris.length > 1 ? (
          <View style={[styles.counter, { bottom: insets.bottom + 20 }]} pointerEvents="none">
            <Text style={styles.counterText}>
              {page + 1} / {uris.length}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  chrome: {
    position: 'absolute',
    left: 12,
    zIndex: 5,
  },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
