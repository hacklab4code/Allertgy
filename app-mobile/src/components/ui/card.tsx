import React from 'react';
import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, View } from 'react-native';

export type CardProps = React.ComponentProps<typeof View> & {
  /** Opzionale: rende la card interattiva/tappabile con feedback aptico */
  onPress?: () => void;
  /** Disabilita il tap quando onPress è presente */
  disabled?: boolean;
  /** Feedback aptico al tap (default: selection) */
  haptic?: boolean | 'selection' | 'light' | 'medium';
};

function Card({
  className,
  onPress,
  disabled,
  haptic = 'selection',
  children,
  ...props
}: CardProps) {
  const handlePress = () => {
    if (disabled || !onPress) return;
    if (haptic && Platform.OS !== 'web') {
      try {
        if (haptic === 'selection' || haptic === true) {
          Haptics.selectionAsync();
        } else if (haptic === 'light') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (haptic === 'medium') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch {
        /* no-op */
      }
    }
    onPress();
  };

  const baseStyle = cn(
    'bg-card border-border flex flex-col rounded-2xl border p-5 shadow-sm shadow-slate-950/5',
    onPress && !disabled && 'active:opacity-95 active:scale-[0.99]',
    disabled && 'opacity-60',
    className
  );

  if (onPress) {
    return (
      <TextClassContext.Provider value="text-card-foreground">
        <Pressable
          className={baseStyle}
          role="button"
          disabled={disabled}
          onPress={handlePress}
          accessibilityRole="button"
        >
          {children}
        </Pressable>
      </TextClassContext.Provider>
    );
  }

  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View className={baseStyle} {...props}>
        {children}
      </View>
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col gap-1.5 pb-3', className)} {...props} />;
}

function CardTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn('text-foreground font-bold text-lg leading-snug tracking-tight', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return <Text className={cn('text-muted-foreground text-sm leading-relaxed', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('pt-1', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center justify-between pt-3', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
