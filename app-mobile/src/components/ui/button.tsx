import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable } from 'react-native';

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2.5 rounded-2xl shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary active:bg-primary/90 active:scale-[0.98] shadow-sm shadow-black/10',
          Platform.select({ web: 'hover:bg-primary/90' })
        ),
        primary: cn(
          'bg-brand active:bg-brand-hover active:scale-[0.98] shadow-sm shadow-indigo-950/15',
          Platform.select({ web: 'hover:bg-brand-hover' })
        ),
        secondary: cn(
          'bg-secondary active:bg-secondary/80 active:scale-[0.98] shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-secondary/80' })
        ),
        outline: cn(
          'border border-border bg-card active:bg-accent active:scale-[0.98] shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-accent dark:hover:bg-input/50',
          })
        ),
        ghost: cn(
          'bg-transparent active:bg-accent/70 active:scale-[0.98]',
          Platform.select({ web: 'hover:bg-accent dark:hover:bg-accent/50' })
        ),
        destructive: cn(
          'bg-destructive active:bg-destructive/90 active:scale-[0.98] shadow-sm shadow-red-950/15',
          Platform.select({
            web: 'hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
          })
        ),
        safe: cn(
          'bg-semaforo-safe active:bg-emerald-600 active:scale-[0.98] shadow-sm shadow-emerald-950/15',
          Platform.select({ web: 'hover:bg-emerald-600' })
        ),
        link: 'bg-transparent shadow-none',
      },
      size: {
        default: cn('min-h-[48px] px-5 py-3 rounded-2xl', Platform.select({ web: 'has-[>svg]:px-4' })),
        sm: cn('min-h-[40px] px-3.5 py-2 rounded-xl gap-1.5', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('min-h-[56px] px-6 py-3.5 rounded-2xl gap-3 text-base', Platform.select({ web: 'has-[>svg]:px-5' })),
        icon: 'min-h-[48px] min-w-[48px] p-0 rounded-2xl items-center justify-center',
        iconSm: 'min-h-[40px] min-w-[40px] p-0 rounded-xl items-center justify-center',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-sm font-semibold tracking-tight',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground font-bold',
        primary: 'text-white font-bold',
        destructive: 'text-white font-bold',
        safe: 'text-white font-bold',
        outline: cn(
          'text-foreground group-active:text-accent-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' })
        ),
        secondary: 'text-secondary-foreground font-semibold',
        ghost: 'text-foreground group-active:text-accent-foreground font-medium',
        link: cn(
          'text-primary font-medium group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      size: {
        default: 'text-[15px]',
        sm: 'text-xs',
        lg: 'text-base font-bold',
        icon: '',
        iconSm: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    /** Mostra un indicatore di caricamento spinner e disabilita il tap */
    loading?: boolean;
    /** Feedback tattile al tap (default: Light). Passa false per disabilitarlo. */
    haptic?: boolean | 'light' | 'medium' | 'heavy' | 'selection' | 'error' | 'warning';
  };

async function fireHaptic(kind: NonNullable<ButtonProps['haptic']>) {
  if (kind === false || Platform.OS === 'web') return;
  try {
    if (kind === 'selection') {
      await Haptics.selectionAsync();
      return;
    }
    if (kind === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (kind === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (kind === true || kind === 'light') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    const map = {
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    } as const;
    await Haptics.impactAsync(map[kind]);
  } catch {
    /* no-op su simulatori senza haptics */
  }
}

function Button({
  className,
  variant,
  size,
  loading = false,
  haptic = 'light',
  onPress,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = props.disabled || loading;

  const spinnerColor =
    variant === 'destructive' || variant === 'safe' || variant === 'primary' || variant === 'default'
      ? '#FFFFFF'
      : '#4F46E5';

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(
          isDisabled && 'opacity-50',
          buttonVariants({ variant, size }),
          className
        )}
        role="button"
        disabled={isDisabled}
        {...props}
        onPress={(e) => {
          if (!isDisabled) void fireHaptic(haptic);
          onPress?.(e);
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          children
        )}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
