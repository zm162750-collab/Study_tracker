import React from 'react';
import { StyleSheet, Text, View, ScrollView, useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useStudyData } from '@/lib/useStudyData';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

function RankBar({ percentage, color, trackColor }: { percentage: number; color: string; trackColor: string }) {
  const animStyle = useAnimatedStyle(() => ({
    width: withTiming(`${Math.max(percentage, 2)}%` as any, { duration: 600 }),
  }));
  return (
    <View style={[rankStyles.barTrack, { backgroundColor: trackColor }]}>
      <Animated.View style={[rankStyles.barFill, { backgroundColor: color }, animStyle]} />
    </View>
  );
}

const rankStyles = StyleSheet.create({
  barTrack: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});

export default function RankingsScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const { getSubjectTotals } = useStudyData();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;

  const subjectTotals = getSubjectTotals();
  const totalHours = subjectTotals.reduce((sum, s) => sum + s.hours, 0);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }]}
      >
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Subject Rankings</Text>

        {subjectTotals.length > 0 ? (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                <MaterialIcons name="leaderboard" size={22} color={colors.tint} />
                <Text style={[styles.summaryValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{subjectTotals.length}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Subjects</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                <Ionicons name="time" size={22} color={colors.tint} />
                <Text style={[styles.summaryValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalHours.toFixed(1)}h</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Total</Text>
              </View>
            </View>

            {subjectTotals.map((subject, index) => {
              const isTop = index === 0;
              const isBottom = index === subjectTotals.length - 1 && subjectTotals.length > 1;
              const chartColor = colors.chartColors[index % colors.chartColors.length];

              return (
                <View
                  key={subject.subject}
                  style={[
                    styles.rankCard,
                    { backgroundColor: colors.card },
                    isTop ? { borderWidth: 1, borderColor: colors.tint + '40' } : null,
                  ]}
                >
                  <View style={styles.rankHeader}>
                    <View style={styles.rankLeft}>
                      <View style={[styles.rankBadge, {
                        backgroundColor: isTop ? colors.gold + '20' : isBottom ? colors.accent + '20' : colors.border,
                      }]}>
                        <Text style={[styles.rankNumber, {
                          color: isTop ? colors.gold : isBottom ? colors.accent : colors.textSecondary,
                          fontFamily: 'Inter_700Bold',
                        }]}>#{index + 1}</Text>
                      </View>
                      <View>
                        <Text style={[styles.subjectName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                          {subject.subject}
                        </Text>
                        <Text style={[styles.subjectMeta, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                          {subject.hours.toFixed(1)} hours
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rankRight}>
                      <Text style={[styles.percentageText, { color: chartColor, fontFamily: 'Inter_700Bold' }]}>
                        {subject.percentage.toFixed(1)}%
                      </Text>
                      {isTop ? (
                        <View style={[styles.topBadge, { backgroundColor: colors.gold + '20' }]}>
                          <MaterialIcons name="star" size={12} color={colors.gold} />
                          <Text style={[styles.topBadgeText, { color: colors.gold, fontFamily: 'Inter_600SemiBold' }]}>Top</Text>
                        </View>
                      ) : null}
                      {isBottom ? (
                        <View style={[styles.topBadge, { backgroundColor: colors.accent + '20' }]}>
                          <Text style={[styles.topBadgeText, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>Needs Focus</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <RankBar percentage={subject.percentage} color={chartColor} trackColor={colors.border} />
                </View>
              );
            })}
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <MaterialIcons name="leaderboard" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>No Rankings Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Log study sessions to see your subject rankings here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 28, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  summaryLabel: { fontSize: 12 },
  rankCard: { padding: 16, borderRadius: 16, gap: 12 },
  rankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rankNumber: { fontSize: 14, fontWeight: '700' },
  subjectName: { fontSize: 16 },
  subjectMeta: { fontSize: 13, marginTop: 2 },
  rankRight: { alignItems: 'flex-end', gap: 4 },
  percentageText: { fontSize: 18, fontWeight: '700' },
  topBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  topBadgeText: { fontSize: 11, fontWeight: '600' },
  emptyCard: { padding: 40, borderRadius: 16, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
