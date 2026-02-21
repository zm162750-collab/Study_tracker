import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, useColorScheme, Platform,
  TextInput, Pressable, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/constants/colors';
import { useStudyData } from '@/lib/useStudyData';
import { formatDate } from '@/lib/storage';
import { CircularProgress } from '@/components/CircularProgress';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

function MonthCalendar({ habitId, habitLogs, colors, currentMonth }: {
  habitId: string;
  habitLogs: { habit_id: string; date: string; completed: boolean }[];
  colors: any;
  currentMonth: Date;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const today = formatDate(new Date());
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const cells: { dayNum: number | null; date: string | null; completed: boolean; isToday: boolean }[] = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push({ dayNum: null, date: null, completed: false, isToday: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(new Date(year, month, d));
    const log = habitLogs.find(l => l.habit_id === habitId && l.date === dateStr && l.completed);
    cells.push({
      dayNum: d,
      date: dateStr,
      completed: !!log,
      isToday: dateStr === today,
    });
  }

  return (
    <View style={calStyles.container}>
      <View style={calStyles.headerRow}>
        {dayNames.map((name, i) => (
          <View key={i} style={calStyles.headerCell}>
            <Text style={[calStyles.headerText, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>{name}</Text>
          </View>
        ))}
      </View>
      <View style={calStyles.grid}>
        {cells.map((cell, i) => (
          <View
            key={i}
            style={[
              calStyles.cell,
              cell.dayNum ? {
                backgroundColor: cell.completed ? colors.success : 'transparent',
                borderWidth: cell.isToday ? 2 : cell.dayNum ? 1 : 0,
                borderColor: cell.isToday ? colors.tint : colors.border,
              } : null,
            ]}
          >
            {cell.dayNum ? (
              <Text style={[calStyles.cellText, {
                color: cell.completed ? '#fff' : colors.text,
                fontFamily: 'Inter_400Regular',
              }]}>{cell.dayNum}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: { gap: 4 },
  headerRow: { flexDirection: 'row', gap: 4 },
  headerCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  headerText: { fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: '13%', aspectRatio: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexGrow: 0, flexBasis: '13%' },
  cellText: { fontSize: 12 },
});

export default function HabitsScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const {
    habits, habitLogs, createHabit, removeHabit, toggleHabit,
    getHabitStreak, getHabitLongestStreak, getHabitCompletionRate,
  } = useStudyData();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  const [newHabitName, setNewHabitName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const today = formatDate(new Date());

  const completedToday = habits.filter(h =>
    habitLogs.some(l => l.habit_id === h.id && l.date === today && l.completed)
  ).length;

  const handleAddHabit = useCallback(async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Missing Name', 'Please enter a habit name.');
      return;
    }
    await createHabit(newHabitName.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewHabitName('');
    setShowAdd(false);
  }, [newHabitName, createHabit]);

  const handleToggle = useCallback(async (habitId: string) => {
    await toggleHabit(habitId, today);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [toggleHabit, today]);

  const handleDeleteHabit = useCallback(async (id: string, name: string) => {
    Alert.alert('Delete Habit', `Remove "${name}" and all its data?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeHabit(id) },
    ]);
  }, [removeHabit]);

  const changeCalendarMonth = (offset: number) => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() + offset);
    setCalendarMonth(d);
  };

  if (!fontsLoaded) return null;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const monthLabel = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Habits</Text>
          <Pressable
            onPress={() => setShowAdd(!showAdd)}
            style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name={showAdd ? 'close' : 'add'} size={22} color="#fff" />
          </Pressable>
        </View>

        {habits.length > 0 ? (
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryRow}>
              <CircularProgress
                progress={habits.length > 0 ? completedToday / habits.length : 0}
                size={80}
                strokeWidth={7}
                color={colors.tint}
                trackColor={colors.border}
                textColor={colors.text}
                valueText={`${completedToday}/${habits.length}`}
              />
              <View style={styles.summaryInfo}>
                <Text style={[styles.summaryTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Today's Progress</Text>
                <Text style={[styles.summaryDesc, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  {completedToday === habits.length && habits.length > 0
                    ? 'All habits completed! Great job!'
                    : `${habits.length - completedToday} habit${habits.length - completedToday !== 1 ? 's' : ''} remaining`}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {showAdd ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              placeholder="Habit name (e.g. Exercise, Meditation)"
              placeholderTextColor={colors.textSecondary}
              value={newHabitName}
              onChangeText={setNewHabitName}
            />
            <Pressable
              onPress={handleAddHabit}
              style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={[styles.saveButtonText, { fontFamily: 'Inter_600SemiBold' }]}>Add Habit</Text>
            </Pressable>
          </View>
        ) : null}

        {habits.length > 0 ? (
          habits.map(habit => {
            const isCompleted = habitLogs.some(l => l.habit_id === habit.id && l.date === today && l.completed);
            const streak = getHabitStreak(habit.id);
            const longestStreak = getHabitLongestStreak(habit.id);
            const completionRate = getHabitCompletionRate(habit.id);
            const isExpanded = expandedHabit === habit.id;

            return (
              <View key={habit.id} style={[styles.habitCard, { backgroundColor: colors.card }]}>
                <View style={styles.habitRow}>
                  <Pressable
                    onPress={() => handleToggle(habit.id)}
                    style={[
                      styles.toggleCircle,
                      {
                        backgroundColor: isCompleted ? colors.success : 'transparent',
                        borderColor: isCompleted ? colors.success : colors.border,
                      },
                    ]}
                  >
                    {isCompleted ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                  </Pressable>

                  <Pressable style={styles.habitInfo} onPress={() => setExpandedHabit(isExpanded ? null : habit.id)}>
                    <Text style={[styles.habitName, {
                      color: colors.text,
                      fontFamily: 'Inter_600SemiBold',
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                      opacity: isCompleted ? 0.6 : 1,
                    }]}>{habit.name}</Text>
                    <View style={styles.habitMeta}>
                      <Ionicons name="flame" size={14} color={streak > 0 ? colors.accent : colors.textSecondary} />
                      <Text style={[styles.habitMetaText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                        {streak}d streak
                      </Text>
                    </View>
                  </Pressable>

                  <View style={styles.habitActions}>
                    <Pressable onPress={() => setExpandedHabit(isExpanded ? null : habit.id)} hitSlop={8}>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteHabit(habit.id, habit.name)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={colors.accent} />
                    </Pressable>
                  </View>
                </View>

                {isExpanded ? (
                  <View style={styles.expandedSection}>
                    <View style={styles.statsRow}>
                      <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                        <Ionicons name="flame" size={18} color={colors.accent} />
                        <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{streak}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Current</Text>
                      </View>
                      <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                        <Ionicons name="trophy" size={18} color={colors.gold} />
                        <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{longestStreak}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Best</Text>
                      </View>
                      <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                        <Feather name="percent" size={18} color={colors.tint} />
                        <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{completionRate.toFixed(0)}%</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>30d Rate</Text>
                      </View>
                    </View>

                    <View style={styles.calendarSection}>
                      <View style={styles.calendarNav}>
                        <Pressable onPress={() => changeCalendarMonth(-1)} hitSlop={12}>
                          <Ionicons name="chevron-back" size={20} color={colors.tint} />
                        </Pressable>
                        <Text style={[styles.calendarMonthText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{monthLabel}</Text>
                        <Pressable onPress={() => changeCalendarMonth(1)} hitSlop={12}>
                          <Ionicons name="chevron-forward" size={20} color={colors.tint} />
                        </Pressable>
                      </View>
                      <MonthCalendar
                        habitId={habit.id}
                        habitLogs={habitLogs}
                        colors={colors}
                        currentMonth={calendarMonth}
                      />
                    </View>

                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendBox, { backgroundColor: colors.success }]} />
                        <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Completed</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendBox, { borderWidth: 1, borderColor: colors.border }]} />
                        <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Missed</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendBox, { borderWidth: 2, borderColor: colors.tint }]} />
                        <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Today</Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>No Habits Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Tap + to add habits you want to track daily like Exercise, Meditation, Reading, etc.
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700' },
  addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { borderRadius: 16, padding: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  summaryInfo: { flex: 1, gap: 4 },
  summaryTitle: { fontSize: 18 },
  summaryDesc: { fontSize: 14, lineHeight: 20 },
  card: { padding: 20, borderRadius: 16, gap: 14 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, borderWidth: 1 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  habitCard: { borderRadius: 16, padding: 16, gap: 14 },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center' },
  habitInfo: { flex: 1, gap: 2 },
  habitName: { fontSize: 16 },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  habitMetaText: { fontSize: 13 },
  habitActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expandedSection: { gap: 16, paddingTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  calendarSection: { gap: 12 },
  calendarNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calendarMonthText: { fontSize: 15 },
  legendRow: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 12 },
  emptyCard: { padding: 40, borderRadius: 16, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
