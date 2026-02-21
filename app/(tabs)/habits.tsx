import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, useColorScheme, Platform,
  TextInput, Pressable, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/constants/colors';
import { useStudyData } from '@/lib/useStudyData';
import { formatDate, calculateHabitStreak, calculateHabitLongestStreak } from '@/lib/storage';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

function CalendarGrid({ habitId, habitLogs, colors }: {
  habitId: string;
  habitLogs: { habitId: string; date: string; completed: boolean }[];
  colors: any;
}) {
  const today = new Date();
  const days: { date: string; completed: boolean; isToday: boolean; dayNum: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const log = habitLogs.find(l => l.habitId === habitId && l.date === dateStr);
    days.push({
      date: dateStr,
      completed: log?.completed || false,
      isToday: i === 0,
      dayNum: d.getDate(),
    });
  }

  return (
    <View style={calStyles.grid}>
      {days.map((day) => (
        <View
          key={day.date}
          style={[
            calStyles.cell,
            {
              backgroundColor: day.completed ? colors.success : colors.border,
              borderWidth: day.isToday ? 2 : 0,
              borderColor: colors.tint,
            },
          ]}
        >
          <Text style={[calStyles.cellText, { color: day.completed ? '#fff' : colors.textSecondary }]}>
            {day.dayNum}
          </Text>
        </View>
      ))}
    </View>
  );
}

const calStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  cellText: { fontSize: 10, fontWeight: '600' },
});

export default function HabitsScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const { habits, habitLogs, createHabit, removeHabit, toggleHabit } = useStudyData();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  const [newHabitName, setNewHabitName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  const today = formatDate(new Date());

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

  if (!fontsLoaded) return null;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

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

        {showAdd ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              placeholder="Habit name (e.g. Exercise)"
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
            const isCompleted = habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
            const streak = calculateHabitStreak(habitLogs, habit.id);
            const longestStreak = calculateHabitLongestStreak(habitLogs, habit.id);
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
                    <Text style={[styles.habitName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{habit.name}</Text>
                    <View style={styles.habitMeta}>
                      <Ionicons name="flame" size={14} color={streak > 0 ? colors.accent : colors.textSecondary} />
                      <Text style={[styles.habitMetaText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                        {streak}d streak
                      </Text>
                      <Text style={[styles.habitMetaText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                        {' '}|{' '}Best: {longestStreak}d
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable onPress={() => handleDeleteHabit(habit.id, habit.name)} hitSlop={12}>
                    <Ionicons name="trash-outline" size={18} color={colors.accent} />
                  </Pressable>
                </View>

                {isExpanded ? (
                  <View style={styles.calendarSection}>
                    <Text style={[styles.calendarTitle, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                      Last 30 Days
                    </Text>
                    <CalendarGrid habitId={habit.id} habitLogs={habitLogs} colors={colors} />
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
              Tap the + button to add habits you want to track daily
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
  calendarSection: { gap: 10, paddingTop: 4 },
  calendarTitle: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyCard: { padding: 40, borderRadius: 16, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
