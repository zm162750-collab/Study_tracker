import React from 'react';
import { StyleSheet, Text, View, ScrollView, useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useStudyData } from '@/lib/useStudyData';
import { BarChart } from '@/components/BarChart';
import { CircularProgress } from '@/components/CircularProgress';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function WeeklyScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const { settings, getWeeklyHours, getWeeklyData, getLastWeeklyData } = useStudyData();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;

  const weeklyHours = getWeeklyHours();
  const weeklyData = getWeeklyData();
  const lastWeekData = getLastWeeklyData();
  const lastWeekTotal = lastWeekData.reduce((sum, d) => sum + d.hours, 0);
  const weeklyProgress = settings.weeklyGoalHours > 0 ? weeklyHours / settings.weeklyGoalHours : 0;
  const improvement = lastWeekTotal > 0 ? ((weeklyHours - lastWeekTotal) / lastWeekTotal) * 100 : 0;
  const isImproved = weeklyHours > lastWeekTotal;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }]}
      >
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Weekly Progress</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.progressCenter}>
            <CircularProgress
              progress={Math.min(weeklyProgress, 1)}
              size={160}
              strokeWidth={12}
              color={colors.tint}
              trackColor={colors.border}
              textColor={colors.text}
              valueText={`${weeklyHours.toFixed(1)}h`}
              label={`/ ${settings.weeklyGoalHours}h`}
            />
          </View>

          <View style={styles.progressMeta}>
            <View style={[styles.metaChip, { backgroundColor: weeklyProgress >= 1 ? colors.success + '15' : colors.warning + '15' }]}>
              <Ionicons
                name={weeklyProgress >= 1 ? 'checkmark-circle' : 'time-outline'}
                size={16}
                color={weeklyProgress >= 1 ? colors.success : colors.warning}
              />
              <Text style={[styles.metaText, {
                color: weeklyProgress >= 1 ? colors.success : colors.warning,
                fontFamily: 'Inter_600SemiBold',
              }]}>
                {weeklyProgress >= 1 ? 'Goal Completed!' : `${(weeklyProgress * 100).toFixed(0)}% Complete`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.comparisonRow}>
          <View style={[styles.compCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.compLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>This Week</Text>
            <Text style={[styles.compValue, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>{weeklyHours.toFixed(1)}h</Text>
          </View>
          <View style={[styles.compCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.compLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Last Week</Text>
            <Text style={[styles.compValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{lastWeekTotal.toFixed(1)}h</Text>
          </View>
          <View style={[styles.compCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.compLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Change</Text>
            <View style={styles.changeRow}>
              <Ionicons
                name={isImproved ? 'arrow-up' : lastWeekTotal === 0 && weeklyHours === 0 ? 'remove' : 'arrow-down'}
                size={16}
                color={isImproved ? colors.success : weeklyHours === lastWeekTotal ? colors.textSecondary : colors.accent}
              />
              <Text style={[styles.compValue, {
                color: isImproved ? colors.success : weeklyHours === lastWeekTotal ? colors.textSecondary : colors.accent,
                fontFamily: 'Inter_700Bold',
              }]}>
                {lastWeekTotal > 0 ? `${Math.abs(improvement).toFixed(0)}%` : '--'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Daily Breakdown</Text>
          <BarChart data={weeklyData} barColor={colors.tint} textColor={colors.text} trackColor={colors.border} height={140} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Last Week Comparison</Text>
          <BarChart
            data={lastWeekData}
            barColor={colors.textSecondary}
            textColor={colors.text}
            trackColor={colors.border}
            height={100}
          />
        </View>

        <View style={[styles.tipsCard, { backgroundColor: colors.tint + '10' }]}>
          <MaterialIcons name="tips-and-updates" size={20} color={colors.tint} />
          <Text style={[styles.tipsText, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>
            {weeklyProgress >= 1
              ? 'Great work! You hit your weekly goal. Keep the momentum going!'
              : weeklyProgress >= 0.5
              ? `You're halfway there! Stay consistent to reach your ${settings.weeklyGoalHours}h target.`
              : 'Start strong this week! Even small study sessions add up over time.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 28, fontWeight: '700' },
  card: { padding: 20, borderRadius: 16, gap: 16 },
  progressCenter: { alignItems: 'center' },
  progressMeta: { alignItems: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  metaText: { fontSize: 14 },
  comparisonRow: { flexDirection: 'row', gap: 10 },
  compCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4 },
  compLabel: { fontSize: 12 },
  compValue: { fontSize: 18, fontWeight: '700' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  tipsCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14 },
  tipsText: { fontSize: 13, flex: 1, lineHeight: 18 },
});
