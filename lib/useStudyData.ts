import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  StudyEntry, HabitEntry, HabitLog, UserSettings, Badge,
  getStudyEntries, saveStudyEntries, addStudyEntry, deleteStudyEntry,
  getHabits, addHabit, deleteHabit,
  getHabitLogs, toggleHabitLog,
  getSettings, saveSettings,
  getBadges, checkAndUnlockBadges,
  formatDate, getWeekDates, getMonthDates,
  calculateStudyStreak, calculateLongestStreak,
  calculateHabitStreak, calculateHabitLongestStreak,
  getRandomQuote,
} from './storage';
import React from 'react';

interface StudyDataContextValue {
  entries: StudyEntry[];
  habits: HabitEntry[];
  habitLogs: HabitLog[];
  settings: UserSettings;
  badges: Badge[];
  isLoading: boolean;
  quote: string;
  newBadge: Badge | null;
  clearNewBadge: () => void;
  addEntry: (date: string, subject: string, hours: number) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  createHabit: (name: string) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  toggleHabit: (habitId: string, date: string) => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  refreshData: () => Promise<void>;
  getTodayHours: () => number;
  getWeeklyHours: () => number;
  getMonthlyHours: () => number;
  getCurrentStreak: () => number;
  getLongestStreak: () => number;
  getSubjectTotals: () => { subject: string; hours: number; percentage: number }[];
  getWeeklyData: () => { day: string; hours: number }[];
  getLastWeeklyData: () => { day: string; hours: number }[];
}

const StudyDataContext = createContext<StudyDataContextValue | null>(null);

export function StudyDataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<StudyEntry[]>([]);
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ dailyGoalHours: 2, weeklyGoalHours: 14 });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);

  const quote = useMemo(() => getRandomQuote(), []);

  const refreshData = useCallback(async () => {
    try {
      const [e, h, hl, s, b] = await Promise.all([
        getStudyEntries(), getHabits(), getHabitLogs(), getSettings(), getBadges()
      ]);
      setEntries(e);
      setHabits(h);
      setHabitLogs(hl);
      setSettings(s);
      setBadges(b);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const addEntry = useCallback(async (date: string, subject: string, hours: number) => {
    const entry = await addStudyEntry({ date, subject, hours });
    const updated = [...entries, entry];
    setEntries(updated);
    const unlocked = await checkAndUnlockBadges(updated);
    if (unlocked) {
      setNewBadge(unlocked);
      const b = await getBadges();
      setBadges(b);
    }
  }, [entries]);

  const removeEntry = useCallback(async (id: string) => {
    await deleteStudyEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const createHabit = useCallback(async (name: string) => {
    const habit = await addHabit(name);
    setHabits(prev => [...prev, habit]);
  }, []);

  const removeHabit = useCallback(async (id: string) => {
    await deleteHabit(id);
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitLogs(prev => prev.filter(l => l.habitId !== id));
  }, []);

  const toggleHabitCb = useCallback(async (habitId: string, date: string) => {
    await toggleHabitLog(habitId, date);
    const logs = await getHabitLogs();
    setHabitLogs(logs);
  }, []);

  const updateSettings = useCallback(async (newSettings: UserSettings) => {
    await saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const clearNewBadge = useCallback(() => setNewBadge(null), []);

  const getTodayHours = useCallback(() => {
    const today = formatDate(new Date());
    return entries.filter(e => e.date === today).reduce((sum, e) => sum + e.hours, 0);
  }, [entries]);

  const getWeeklyHours = useCallback(() => {
    const weekDates = getWeekDates(new Date());
    return entries.filter(e => weekDates.includes(e.date)).reduce((sum, e) => sum + e.hours, 0);
  }, [entries]);

  const getMonthlyHours = useCallback(() => {
    const monthDates = getMonthDates(new Date());
    return entries.filter(e => monthDates.includes(e.date)).reduce((sum, e) => sum + e.hours, 0);
  }, [entries]);

  const getCurrentStreak = useCallback(() => {
    return calculateStudyStreak(entries, settings.dailyGoalHours);
  }, [entries, settings.dailyGoalHours]);

  const getLongestStreak = useCallback(() => {
    return calculateLongestStreak(entries, settings.dailyGoalHours);
  }, [entries, settings.dailyGoalHours]);

  const getSubjectTotals = useCallback(() => {
    const totals: Record<string, number> = {};
    entries.forEach(e => { totals[e.subject] = (totals[e.subject] || 0) + e.hours; });
    const total = Object.values(totals).reduce((s, h) => s + h, 0);
    return Object.entries(totals)
      .map(([subject, hours]) => ({ subject, hours, percentage: total > 0 ? (hours / total) * 100 : 0 }))
      .sort((a, b) => b.hours - a.hours);
  }, [entries]);

  const getWeeklyData = useCallback(() => {
    const weekDates = getWeekDates(new Date());
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return weekDates.map((date, i) => ({
      day: dayNames[i],
      hours: entries.filter(e => e.date === date).reduce((sum, e) => sum + e.hours, 0),
    }));
  }, [entries]);

  const getLastWeeklyData = useCallback(() => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weekDates = getWeekDates(lastWeek);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return weekDates.map((date, i) => ({
      day: dayNames[i],
      hours: entries.filter(e => e.date === date).reduce((sum, e) => sum + e.hours, 0),
    }));
  }, [entries]);

  const value = useMemo(() => ({
    entries, habits, habitLogs, settings, badges, isLoading, quote, newBadge,
    clearNewBadge, addEntry, removeEntry, createHabit, removeHabit,
    toggleHabit: toggleHabitCb, updateSettings, refreshData,
    getTodayHours, getWeeklyHours, getMonthlyHours,
    getCurrentStreak, getLongestStreak, getSubjectTotals,
    getWeeklyData, getLastWeeklyData,
  }), [entries, habits, habitLogs, settings, badges, isLoading, quote, newBadge,
    clearNewBadge, addEntry, removeEntry, createHabit, removeHabit,
    toggleHabitCb, updateSettings, refreshData,
    getTodayHours, getWeeklyHours, getMonthlyHours,
    getCurrentStreak, getLongestStreak, getSubjectTotals,
    getWeeklyData, getLastWeeklyData]);

  return React.createElement(StudyDataContext.Provider, { value }, children);
}

export function useStudyData() {
  const context = useContext(StudyDataContext);
  if (!context) {
    throw new Error('useStudyData must be used within StudyDataProvider');
  }
  return context;
}
