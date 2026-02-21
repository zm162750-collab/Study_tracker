import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, useColorScheme, Platform,
  TextInput, Pressable, Alert, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/constants/colors';
import { useStudyData } from '@/lib/useStudyData';
import { formatDate } from '@/lib/storage';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function InputScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const { entries, settings, addEntry, removeEntry, updateSettings } = useStudyData();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [subject, setSubject] = useState('');
  const [hours, setHours] = useState('');
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState(settings.dailyGoalHours.toString());

  const todayEntries = entries.filter(e => e.date === selectedDate);
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.hours, 0);

  const handleSave = useCallback(async () => {
    if (!subject.trim()) {
      Alert.alert('Missing Subject', 'Please enter a subject name.');
      return;
    }
    const h = parseFloat(hours);
    if (isNaN(h) || h <= 0) {
      Alert.alert('Invalid Hours', 'Please enter valid hours.');
      return;
    }
    await addEntry(selectedDate, subject.trim(), h);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubject('');
    setHours('');
  }, [subject, hours, selectedDate, addEntry]);

  const handleDelete = useCallback(async (id: string) => {
    await removeEntry(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [removeEntry]);

  const handleSaveGoal = useCallback(async () => {
    const g = parseFloat(goalInput);
    if (isNaN(g) || g <= 0) return;
    await updateSettings({ ...settings, dailyGoalHours: g });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowGoalInput(false);
  }, [goalInput, settings, updateSettings]);

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(formatDate(d));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const displayDate = new Date(selectedDate + 'T12:00:00');
  const isToday = selectedDate === formatDate(new Date());
  const dateLabel = isToday ? 'Today' : displayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (!fontsLoaded) return null;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Log Study</Text>

        <View style={[styles.dateRow, { backgroundColor: colors.card }]}>
          <Pressable onPress={() => changeDate(-1)} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.tint} />
          </Pressable>
          <View style={styles.dateCenter}>
            <Ionicons name="calendar" size={18} color={colors.tint} />
            <Text style={[styles.dateText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{dateLabel}</Text>
          </View>
          <Pressable onPress={() => changeDate(1)} hitSlop={12}>
            <Ionicons name="chevron-forward" size={24} color={colors.tint} />
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>Subject</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              placeholder="e.g. Mathematics"
              placeholderTextColor={colors.textSecondary}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>Hours</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              placeholder="e.g. 1.5"
              placeholderTextColor={colors.textSecondary}
              value={hours}
              onChangeText={setHours}
              keyboardType="decimal-pad"
            />
          </View>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={[styles.saveButtonText, { fontFamily: 'Inter_600SemiBold' }]}>Add Session</Text>
          </Pressable>
        </View>

        <View style={[styles.goalRow, { backgroundColor: colors.card }]}>
          <View style={styles.goalLeft}>
            <Ionicons name="flag" size={18} color={colors.tint} />
            <Text style={[styles.goalText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              Daily Goal: {settings.dailyGoalHours}h
            </Text>
            <View style={[styles.goalBadge, { backgroundColor: todayTotal >= settings.dailyGoalHours ? colors.success + '20' : colors.accent + '20' }]}>
              <Text style={[styles.goalBadgeText, { color: todayTotal >= settings.dailyGoalHours ? colors.success : colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
                {todayTotal >= settings.dailyGoalHours ? 'Done' : `${todayTotal.toFixed(1)}/${settings.dailyGoalHours}h`}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => setShowGoalInput(!showGoalInput)} hitSlop={12}>
            <Feather name="edit-2" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {showGoalInput ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>Set Daily Goal (hours)</Text>
            <View style={styles.goalInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="decimal-pad"
              />
              <Pressable
                onPress={handleSaveGoal}
                style={({ pressed }) => [styles.miniButton, { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        ) : null}

        {todayEntries.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.entryHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                Sessions ({dateLabel})
              </Text>
              <Text style={[styles.totalText, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>
                {todayTotal.toFixed(1)}h total
              </Text>
            </View>
            {todayEntries.map(entry => (
              <View key={entry.id} style={[styles.entryItem, { borderTopColor: colors.border }]}>
                <View style={styles.entryLeft}>
                  <View style={[styles.entryDot, { backgroundColor: colors.tint }]} />
                  <Text style={[styles.entrySubject, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{entry.subject}</Text>
                </View>
                <View style={styles.entryRight}>
                  <Text style={[styles.entryHours, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>{entry.hours}h</Text>
                  <Pressable onPress={() => handleDelete(entry.id)} hitSlop={12}>
                    <Ionicons name="trash-outline" size={18} color={colors.accent} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center' }]}>
            <Ionicons name="document-text-outline" size={36} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              No sessions logged for this date
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
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16 },
  dateCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 16 },
  card: { padding: 20, borderRadius: 16, gap: 14 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, borderWidth: 1 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16 },
  goalLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalText: { fontSize: 15 },
  goalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  goalBadgeText: { fontSize: 12, fontWeight: '600' },
  goalInputRow: { flexDirection: 'row', gap: 10 },
  miniButton: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  totalText: { fontSize: 14 },
  entryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryDot: { width: 8, height: 8, borderRadius: 4 },
  entrySubject: { fontSize: 15 },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryHours: { fontSize: 15 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 4 },
});
