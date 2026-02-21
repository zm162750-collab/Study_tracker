import React from 'react';
import { StyleSheet, Text, View, ScrollView, useColorScheme, Platform, RefreshControl, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useStudyData } from '@/lib/useStudyData';
import { useAuth } from '@/lib/useAuth';
import { CircularProgress } from '@/components/CircularProgress';
import { PieChart } from '@/components/PieChart';
import { BarChart } from '@/components/BarChart';
import { BadgePopup } from '@/components/BadgePopup';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const { user, signOut } = useAuth();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  const {
    settings, badges, quote, newBadge, clearNewBadge,
    getTodayHours, getWeeklyHours, getMonthlyHours,
    getCurrentStreak, getLongestStreak, getSubjectTotals,
    getWeeklyData, refreshData,
  } = useStudyData();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (!fontsLoaded) return null;

  const todayHours = getTodayHours();
  const weeklyHours = getWeeklyHours();
  const monthlyHours = getMonthlyHours();
  const currentStreak = getCurrentStreak();
  const longestStreak = getLongestStreak();
  const subjectTotals = getSubjectTotals();
  const weeklyData = getWeeklyData();
  const dailyProgress = Math.min(todayHours / settings.daily_goal_hours, 1);

  const pieData = subjectTotals.map((s, i) => ({
    label: s.subject,
    value: s.hours,
    color: colors.chartColors[i % colors.chartColors.length],
  }));

  const barData = weeklyData.map(d => ({ label: d.day, value: d.hours }));
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Welcome back,</Text>
            <Text style={[styles.name, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{displayName}</Text>
          </View>
          <Pressable onPress={handleSignOut} hitSlop={12}>
            <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.quoteCard, { backgroundColor: colors.tint + '15' }]}>
          <Ionicons name="bulb-outline" size={18} color={colors.tint} />
          <Text style={[styles.quoteText, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{quote}</Text>
        </View>

        <View style={styles.progressRow}>
          <View style={[styles.card, { backgroundColor: colors.card, flex: 1 }]}>
            <CircularProgress
              progress={dailyProgress}
              size={130}
              strokeWidth={10}
              color={colors.tint}
              trackColor={colors.border}
              textColor={colors.text}
              valueText={`${todayHours.toFixed(1)}h`}
              label={`/ ${settings.daily_goal_hours}h goal`}
            />
          </View>

          <View style={styles.streakCol}>
            <View style={[styles.streakCard, { backgroundColor: colors.card }]}>
              <Ionicons name="flame" size={22} color={colors.accent} />
              <Text style={[styles.streakValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{currentStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Current</Text>
            </View>
            <View style={[styles.streakCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="emoji-events" size={22} color={colors.gold} />
              <Text style={[styles.streakValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{longestStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Best</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="today-outline" size={20} color={colors.tint} />
            <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{todayHours.toFixed(1)}h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar-outline" size={20} color={colors.tint} />
            <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{weeklyHours.toFixed(1)}h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>This Week</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <MaterialIcons name="date-range" size={20} color={colors.tint} />
            <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{monthlyHours.toFixed(1)}h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>This Month</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Weekly Progress</Text>
          <BarChart data={barData} barColor={colors.tint} textColor={colors.text} trackColor={colors.border} />
        </View>

        {subjectTotals.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Subject Distribution</Text>
            <PieChart data={pieData} size={120} textColor={colors.text} />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center' }]}>
            <Ionicons name="book-outline" size={36} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Add study sessions to see your subject distribution
            </Text>
          </View>
        )}

        {badges.some(b => b.unlocked_at) ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Achievements</Text>
            <View style={styles.badgesRow}>
              {badges.map(b => {
                const iconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
                  flame: 'local-fire-department', trophy: 'emoji-events', star: 'star', rocket: 'rocket-launch', school: 'school',
                };
                return (
                  <View key={b.id} style={[styles.badgeItem, { opacity: b.unlocked_at ? 1 : 0.3 }]}>
                    <View style={[styles.badgeCircle, { backgroundColor: b.unlocked_at ? colors.tint + '20' : colors.border }]}>
                      <MaterialIcons name={iconMap[b.icon] || 'star'} size={24} color={b.unlocked_at ? colors.tint : colors.textSecondary} />
                    </View>
                    <Text style={[styles.badgeLabel, { color: colors.text, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>{b.title}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <BadgePopup
        badge={newBadge}
        onClose={clearNewBadge}
        tintColor={colors.tint}
        cardColor={colors.card}
        textColor={colors.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 14 },
  name: { fontSize: 24, fontWeight: '700' },
  quoteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
  quoteText: { fontSize: 13, flex: 1, lineHeight: 18 },
  progressRow: { flexDirection: 'row', gap: 12 },
  card: { padding: 20, borderRadius: 16, gap: 14 },
  streakCol: { gap: 12, flex: 0.7 },
  streakCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 2 },
  streakValue: { fontSize: 26, fontWeight: '700' },
  streakLabel: { fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeItem: { alignItems: 'center', width: 60, gap: 4 },
  badgeCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  badgeLabel: { fontSize: 10, textAlign: 'center' },
});
