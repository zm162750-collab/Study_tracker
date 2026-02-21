import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/constants/colors';
import { useAuth } from '@/lib/useAuth';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, isLoading } = useAuth();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  const [signingIn, setSigningIn] = React.useState(false);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500 }),
          withTiming(1, { duration: 1500 }),
        ),
        -1,
        true
      ),
    }],
  }));

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  if (!fontsLoaded) return null;

  const isDark = colorScheme === 'dark';
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0D1B2A', '#1B2838', '#121212'] : ['#E8F5E9', '#B2DFDB', '#F8F9FE']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.content, { paddingTop: topInset + 60, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.heroSection}>
          <Animated.View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }, pulseStyle]}>
            <MaterialCommunityIcons name="book-open-page-variant" size={56} color={colors.tint} />
          </Animated.View>

          <Text style={[styles.appName, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            StudyTracker Pro
          </Text>
          <Text style={[styles.tagline, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Track your study hours, build habits, and achieve your goals
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: 'stats-chart' as const, text: 'Detailed study analytics' },
            { icon: 'flame' as const, text: 'Streak tracking & gamification' },
            { icon: 'checkmark-circle' as const, text: 'Daily habit tracking' },
            { icon: 'cloud' as const, text: 'Cloud sync across devices' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name={f.icon} size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonSection}>
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={signingIn}
            style={({ pressed }) => [
              styles.googleButton,
              {
                backgroundColor: isDark ? '#fff' : '#fff',
                opacity: pressed ? 0.85 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
          >
            {signingIn ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={22} color="#4285F4" />
                <Text style={[styles.googleButtonText, { fontFamily: 'Inter_600SemiBold' }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <Text style={[styles.disclaimer, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Your data is securely stored in the cloud
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
  heroSection: { alignItems: 'center', gap: 16 },
  iconContainer: { width: 110, height: 110, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 32, fontWeight: '700', textAlign: 'center' },
  tagline: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },
  features: { gap: 16, paddingHorizontal: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureText: { fontSize: 16 },
  buttonSection: { alignItems: 'center', gap: 16 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, height: 56, width: '100%', borderRadius: 16,
  },
  googleButtonText: { fontSize: 17, color: '#333', fontWeight: '600' },
  disclaimer: { fontSize: 12, textAlign: 'center' },
});
