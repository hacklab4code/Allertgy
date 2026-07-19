import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';
import { AmbientMesh } from './AmbientMesh';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: boolean;
  /** Sfondo animato — i tab usano AmbientMesh nel layout. */
  ambient?: boolean;
};

export function Screen({ children, style, edges = true, ambient = false }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: edges ? insets.top : 0 }, style]}>
      {ambient ? <AmbientMesh /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText variant="subtitle" style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
});
