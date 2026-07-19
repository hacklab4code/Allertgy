import { BlurView, BlurViewProps } from 'expo-blur';
import { Platform } from 'react-native';

/** BlurView — prop sperimentale e blurReductionFactor solo su Android. */
export function SafeBlurView(props: BlurViewProps) {
  const { experimentalBlurMethod, blurReductionFactor, ...rest } = props;
  return (
    <BlurView
      {...rest}
      {...(Platform.OS === 'android'
        ? {
            ...(experimentalBlurMethod ? { experimentalBlurMethod } : null),
            ...(blurReductionFactor != null ? { blurReductionFactor } : null),
          }
        : null)}
    />
  );
}
