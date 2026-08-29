import React from 'react';
import { BlurView, BlurViewProps } from 'expo-blur';
import { Platform, View, StyleSheet } from 'react-native';

/** SafeBlurView — prevenzione crash Android "Software rendering doesn't support hardware bitmaps" */
export function SafeBlurView(props: BlurViewProps) {
  const { experimentalBlurMethod, blurReductionFactor, style, tint = 'light', intensity = 50, children, ...rest } = props;

  if (Platform.OS === 'android') {
    return (
      <View style={[style, { backgroundColor: tint === 'dark' ? 'rgba(15, 12, 29, 0.75)' : 'rgba(255, 255, 255, 0.65)' }]}>
        <BlurView
          {...rest}
          tint={tint}
          intensity={Math.min(intensity, 40)}
          experimentalBlurMethod="none"
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  return <BlurView {...props} />;
}
