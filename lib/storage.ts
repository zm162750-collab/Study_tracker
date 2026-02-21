import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StudyEntry {
  id: string;
  date: string;
  subject: string;
  hours: number;
}

export interface HabitEntry {
  id: string;
  name: string;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

export interface UserSettings {
  dailyGoalHours: number;
  weeklyGoalHours: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

const KEYS = {
  STUDY_ENTRIES: 'study_entries',
  HABITS: 'habits',
  HABIT_LOGS: 'habit_logs',
  SETTINGS: 'user_settings',
  BADGES: 'badges',
};

const DEFAULT_SETTINGS: UserSettings = {
  dailyGoalHours: 2,
  weeklyGoalHours: 14,
};

const DEFAULT_BADGES: Badge[] = [
  { id: 'streak_7', title: '7 Day Streak', description: 'Study 7 days in a row', icon: 'flame', unlockedAt: null },
  { id: 'streak_30', title: '30 Day Streak', description: 'Study 30 days in a row', icon: 'trophy', unlockedAt: null },
  { id: 'hours_100', title: '100 Hours', description: 'Accumulate 100 study hours', icon: 'star', unlockedAt: null },
  { id: 'first_session', title: 'First Session', description: 'Log your first study session', icon: 'rocket', unlockedAt: null },
  { id: 'five_subjects', title: 'Well Rounded', description: 'Study 5 different subjects', icon: 'school', unlockedAt: null },
];

export async function getStudyEntries(): Promise<StudyEntry[]> {
  const data = await AsyncStorage.getItem(KEYS.STUDY_ENTRIES);
  return data ? JSON.parse(data) : [];
}

export async function saveStudyEntries(entries: StudyEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.STUDY_ENTRIES, JSON.stringify(entries));
}

export async function addStudyEntry(entry: Omit<StudyEntry, 'id'>): Promise<StudyEntry> {
  const entries = await getStudyEntries();
  const newEntry: StudyEntry = { ...entry, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
  entries.push(newEntry);
  await saveStudyEntries(entries);
  return newEntry;
}

export async function deleteStudyEntry(id: string): Promise<void> {
  const entries = await getStudyEntries();
  await saveStudyEntries(entries.filter(e => e.id !== id));
}

export async function getHabits(): Promise<HabitEntry[]> {
  const data = await AsyncStorage.getItem(KEYS.HABITS);
  return data ? JSON.parse(data) : [];
}

export async function saveHabits(habits: HabitEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
}

export async function addHabit(name: string): Promise<HabitEntry> {
  const habits = await getHabits();
  const newHabit: HabitEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    createdAt: new Date().toISOString(),
  };
  habits.push(newHabit);
  await saveHabits(habits);
  return newHabit;
}

export async function deleteHabit(id: string): Promise<void> {
  const habits = await getHabits();
  await saveHabits(habits.filter(h => h.id !== id));
  const logs = await getHabitLogs();
  await saveHabitLogs(logs.filter(l => l.habitId !== id));
}

export async function getHabitLogs(): Promise<HabitLog[]> {
  const data = await AsyncStorage.getItem(KEYS.HABIT_LOGS);
  return data ? JSON.parse(data) : [];
}

export async function saveHabitLogs(logs: HabitLog[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.HABIT_LOGS, JSON.stringify(logs));
}

export async function toggleHabitLog(habitId: string, date: string): Promise<void> {
  const logs = await getHabitLogs();
  const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === date);
  if (existingIndex >= 0) {
    if (logs[existingIndex].completed) {
      logs.splice(existingIndex, 1);
    } else {
      logs[existingIndex].completed = true;
    }
  } else {
    logs.push({ habitId, date, completed: true });
  }
  await saveHabitLogs(logs);
}

export async function getSettings(): Promise<UserSettings> {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getBadges(): Promise<Badge[]> {
  const data = await AsyncStorage.getItem(KEYS.BADGES);
  return data ? JSON.parse(data) : DEFAULT_BADGES;
}

export async function saveBadges(badges: Badge[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.BADGES, JSON.stringify(badges));
}

export async function checkAndUnlockBadges(entries: StudyEntry[]): Promise<Badge | null> {
  const badges = await getBadges();
  let newlyUnlocked: Badge | null = null;

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const uniqueSubjects = new Set(entries.map(e => e.subject)).size;
  const streak = calculateStudyStreak(entries);

  for (const badge of badges) {
    if (badge.unlockedAt) continue;

    let shouldUnlock = false;
    switch (badge.id) {
      case 'first_session':
        shouldUnlock = entries.length > 0;
        break;
      case 'streak_7':
        shouldUnlock = streak >= 7;
        break;
      case 'streak_30':
        shouldUnlock = streak >= 30;
        break;
      case 'hours_100':
        shouldUnlock = totalHours >= 100;
        break;
      case 'five_subjects':
        shouldUnlock = uniqueSubjects >= 5;
        break;
    }

    if (shouldUnlock) {
      badge.unlockedAt = new Date().toISOString();
      newlyUnlocked = badge;
    }
  }

  await saveBadges(badges);
  return newlyUnlocked;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getWeekDates(date: Date): string[] {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

export function getMonthDates(date: Date): string[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(formatDate(new Date(year, month, i)));
  }
  return dates;
}

export function calculateStudyStreak(entries: StudyEntry[], goalHours: number = 2): number {
  const dateHours: Record<string, number> = {};
  for (const entry of entries) {
    dateHours[entry.date] = (dateHours[entry.date] || 0) + entry.hours;
  }

  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);

  while (true) {
    const dateStr = formatDate(checkDate);
    const hours = dateHours[dateStr] || 0;
    if (hours >= goalHours) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (formatDate(checkDate) === formatDate(today) && hours < goalHours) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return streak;
}

export function calculateLongestStreak(entries: StudyEntry[], goalHours: number = 2): number {
  const dateHours: Record<string, number> = {};
  for (const entry of entries) {
    dateHours[entry.date] = (dateHours[entry.date] || 0) + entry.hours;
  }

  const sortedDates = Object.keys(dateHours).filter(d => dateHours[d] >= goalHours).sort();
  if (sortedDates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function calculateHabitStreak(logs: HabitLog[], habitId: string): number {
  const completedDates = logs
    .filter(l => l.habitId === habitId && l.completed)
    .map(l => l.date)
    .sort()
    .reverse();

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);

  while (true) {
    const dateStr = formatDate(checkDate);
    if (completedDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (formatDate(checkDate) === formatDate(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return streak;
}

export function calculateHabitLongestStreak(logs: HabitLog[], habitId: string): number {
  const completedDates = logs
    .filter(l => l.habitId === habitId && l.completed)
    .map(l => l.date)
    .sort();

  if (completedDates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1]);
    const curr = new Date(completedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The expert in anything was once a beginner.",
  "Education is the most powerful weapon you can use to change the world.",
  "The beautiful thing about learning is that nobody can take it away from you.",
  "Push yourself, because no one else is going to do it for you.",
  "Dream big. Start small. Act now.",
  "Your limitation is only your imagination.",
  "Great things never come from comfort zones.",
  "Discipline is the bridge between goals and accomplishment.",
  "The only way to do great work is to love what you do.",
];

export function getRandomQuote(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}
