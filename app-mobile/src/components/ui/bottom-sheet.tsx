import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';
import { colors, radius, spacing } from '../../theme';

type AppBottomSheetProps = {
  children: ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
  enablePanDownToClose?: boolean;
  contentClassName?: string;
} & Omit<BottomSheetProps, 'children' | 'snapPoints'>;

/**
 * Bottom sheet premium (stile iOS / Maps) — sostituisce i Modal centrati.
 * Controllato via `index` / ref (`expand` / `close`).
 */
export const AppBottomSheet = forwardRef<BottomSheet, AppBottomSheetProps>(
  function AppBottomSheet(
    {
      children,
      snapPoints: snapPointsProp,
      onClose,
      enablePanDownToClose = true,
      contentClassName,
      index = -1,
      ...rest
    },
    ref
  ) {
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(
      () => snapPointsProp ?? ['42%', '78%'],
      [snapPointsProp]
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.45}
          pressBehavior="close"
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={index}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
        onChange={(i) => {
          if (i >= 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
          }
        }}
        onClose={() => {
          Haptics.selectionAsync().catch(() => { });
          onClose?.();
        }}
        {...rest}
      >
        <BottomSheetView
          className={cn('px-5 pt-1', contentClassName)}
          style={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        >
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  handle: {
    backgroundColor: colors.borderStrong,
    width: 40,
  },
  content: {
    gap: spacing.md,
  },
});
