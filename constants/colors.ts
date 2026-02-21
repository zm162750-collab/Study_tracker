const teal = '#00BFA6';
const tealDark = '#00897B';
const navy = '#0D1B2A';
const navyLight = '#1B2838';
const charcoal = '#121212';
const surface = '#1E1E2E';
const surfaceLight = '#F5F6FA';
const accent = '#FF6B6B';
const gold = '#FFD700';
const success = '#4CAF50';
const warning = '#FF9800';

const Colors = {
  light: {
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    background: '#F8F9FE',
    surface: surfaceLight,
    card: '#FFFFFF',
    tint: teal,
    tintDark: tealDark,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: teal,
    border: '#E5E7EB',
    accent,
    gold,
    success,
    warning,
    chartColors: ['#00BFA6', '#FF6B6B', '#6C63FF', '#FFD700', '#FF9800', '#4CAF50', '#E91E63', '#00BCD4'],
  },
  dark: {
    text: '#F0F0F0',
    textSecondary: '#9CA3AF',
    background: charcoal,
    surface,
    card: navyLight,
    tint: teal,
    tintDark: tealDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: teal,
    border: '#2D2D3D',
    accent,
    gold,
    success,
    warning,
    chartColors: ['#00BFA6', '#FF6B6B', '#6C63FF', '#FFD700', '#FF9800', '#4CAF50', '#E91E63', '#00BCD4'],
  },
};

export default Colors;

export function useThemeColors(colorScheme: 'light' | 'dark' | null | undefined) {
  return Colors[colorScheme === 'dark' ? 'dark' : 'light'];
}
