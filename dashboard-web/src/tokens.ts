/**
 * Master Design Tokens per AllerTgy Dashboard & Landing Web.
 * Sincronizzato direttamente con DESIGN_TOKENS_MASTER.json
 */

export const TOKENS = {
  colors: {
    brand: {
      primary: '#23212C',
      primaryHover: '#191820',
      primaryActive: '#121118',
      dark: '#191820',
      darker: '#121118',
      ink: '#23212C',
      light: '#F1FEC8',
      surface: '#F7FEE7',
      soft: '#F1FEC8',
      border: '#E2F4A6',
      borderStrong: '#23212C',
      text: '#23212C',
      cosmic: '#23212C',
      vanilla: '#F1FEC8',
    },
    gradients: {
      premium: 'linear-gradient(135deg, #121118 0%, #23212C 50%, #353344 100%)',
      premiumHover: 'linear-gradient(135deg, #0A090E 0%, #191820 50%, #23212C 100%)',
      softLavender: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
      vanilla: 'linear-gradient(135deg, #F1FEC8 0%, #E6F8AB 50%, #D8F18C 100%)',
    },
    glass: {
      cssGlass: {
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(5px)',
        webkitBackdropFilter: 'blur(5px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      },
      cosmic: {
        hex: '#23212C',
        rgb: '35, 33, 44',
        background: 'rgba(35, 33, 44, 0.82)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(5px)',
        webkitBackdropFilter: 'blur(5px)',
      },
      vanilla: {
        hex: '#F1FEC8',
        rgb: '241, 254, 200',
        background: 'rgba(241, 254, 200, 0.60)',
        border: '1px solid rgba(255, 255, 255, 0.40)',
        borderRadius: '16px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(5px)',
        webkitBackdropFilter: 'blur(5px)',
      },
    },
    surface: {
      background: '#F8FAFC',
      backgroundSecondary: '#F1F5F9',
      backgroundTertiary: '#F7FEE7',
      card: '#FFFFFF',
      cardSecondary: '#F8FAFC',
      cardInverse: '#23212C',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#94A3B8',
      inverse: '#FFFFFF',
      brand: '#23212C',
    },
    semaforo: {
      safe: {
        solid: '#10B981',
        soft: '#ECFDF5',
        border: '#A7F3D0',
        text: '#065F46',
        emoji: '🟢',
        label: 'Idoneo',
      },
      warning: {
        solid: '#F59E0B',
        soft: '#FFFBEB',
        border: '#FDE68A',
        text: '#92400E',
        emoji: '🟡',
        label: 'Attenzione',
      },
      danger: {
        solid: '#EF4444',
        soft: '#FEF2F2',
        border: '#FECACA',
        text: '#991B1B',
        emoji: '🔴',
        label: 'Non idoneo',
      },
      neutral: {
        solid: '#64748B',
        soft: '#F1F5F9',
        border: '#E2E8F0',
        text: '#334155',
        emoji: '⚪',
        label: 'Non verificato',
      },
    },
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    pill: '9999px',
  },
} as const;

export default TOKENS;
