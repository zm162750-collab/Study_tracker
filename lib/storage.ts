import { supabase } from './supabase';

export interface StudyEntry {
  id: string;
  date: string;
  subject: string;
  hours: number;
  user_id?: string;
}

export interface HabitEntry {
  id: string;
  name: string;
  created_at: string;
  user_id?: string;
}

export interface HabitLog {
  id?: string;
  habit_id: string;
  date: string;
  completed: boolean;
}

export interface UserSettings {
  daily_goal_hours: number;
  weekly_goal_hours: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string | null;
}

export interface SavedSubject {
  id: string;
  name: string;
  user_id?: string;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getStudyEntries(): Promise<StudyEntry[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('study_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) { console.error('getStudyEntries error:', error); return []; }
  return data || [];
}

export async function addStudyEntry(entry: { date: string; subject: string; hours: number }): Promise<StudyEntry | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('study_entries')
    .insert({ ...entry, user_id: userId })
    .select()
    .single();
  if (error) { console.error('addStudyEntry error:', error); return null; }
  await ensureSavedSubject(entry.subject);
  return data;
}

export async function deleteStudyEntry(id: string): Promise<void> {
  const { error } = await supabase.from('study_entries').delete().eq('id', id);
  if (error) console.error('deleteStudyEntry error:', error);
}

export async function getSavedSubjects(): Promise<SavedSubject[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('saved_subjects')
    .select('*')
    .eq('user_id', userId)
    .order('name');
  if (error) { console.error('getSavedSubjects error:', error); return []; }
  return data || [];
}

export async function ensureSavedSubject(name: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  const { data: existing } = await supabase
    .from('saved_subjects')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();
  if (!existing) {
    await supabase.from('saved_subjects').insert({ name, user_id: userId });
  }
}

export async function deleteSavedSubject(id: string): Promise<void> {
  const { error } = await supabase.from('saved_subjects').delete().eq('id', id);
  if (error) console.error('deleteSavedSubject error:', error);
}

export async function getHabits(): Promise<HabitEntry[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (error) { console.error('getHabits error:', error); return []; }
  return data || [];
}

export async function addHabit(name: string): Promise<HabitEntry | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('habits')
    .insert({ name, user_id: userId })
    .select()
    .single();
  if (error) { console.error('addHabit error:', error); return null; }
  return data;
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) console.error('deleteHabit error:', error);
}

export async function getHabitLogs(): Promise<HabitLog[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*, habits!inner(user_id)')
    .eq('habits.user_id', userId);
  if (error) { console.error('getHabitLogs error:', error); return []; }
  return (data || []).map((l: any) => ({
    id: l.id,
    habit_id: l.habit_id,
    date: l.date,
    completed: l.completed,
  }));
}

export async function toggleHabitLog(habitId: string, date: string): Promise<void> {
  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id, completed')
    .eq('habit_id', habitId)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    if (existing.completed) {
      await supabase.from('habit_logs').delete().eq('id', existing.id);
    } else {
      await supabase.from('habit_logs').update({ completed: true }).eq('id', existing.id);
    }
  } else {
    await supabase.from('habit_logs').insert({ habit_id: habitId, date, completed: true });
  }
}

export async function getSettings(): Promise<UserSettings> {
  const userId = await getUserId();
  if (!userId) return { daily_goal_hours: 2, weekly_goal_hours: 14 };
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (data) return { daily_goal_hours: data.daily_goal_hours, weekly_goal_hours: data.weekly_goal_hours };
  return { daily_goal_hours: 2, weekly_goal_hours: 14 };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('user_settings').upsert({
    id: userId,
    daily_goal_hours: settings.daily_goal_hours,
    weekly_goal_hours: settings.weekly_goal_hours,
  });
}

export async function getBadges(): Promise<Badge[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId);
  
  const DEFAULT_BADGES: Badge[] = [
    { id: 'streak_7', title: '7 Day Streak', description: 'Study 7 days in a row', icon: 'flame', unlocked_at: null },
    { id: 'streak_30', title: '30 Day Streak', description: 'Study 30 days in a row', icon: 'trophy', unlocked_at: null },
    { id: 'hours_100', title: '100 Hours', description: 'Accumulate 100 study hours', icon: 'star', unlocked_at: null },
    { id: 'first_session', title: 'First Session', description: 'Log your first study session', icon: 'rocket', unlocked_at: null },
    { id: 'five_subjects', title: 'Well Rounded', description: 'Study 5 different subjects', icon: 'school', unlocked_at: null },
  ];

  if (!data || data.length === 0) return DEFAULT_BADGES;

  return DEFAULT_BADGES.map(badge => {
    const userBadge = data.find((b: any) => b.badge_id === badge.id);
    return { ...badge, unlocked_at: userBadge?.unlocked_at || null };
  });
}

export async function unlockBadge(badgeId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle();
  if (!existing) {
    await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: badgeId,
      unlocked_at: new Date().toISOString(),
    });
  }
}

export async function checkAndUnlockBadges(entries: StudyEntry[]): Promise<Badge | null> {
  const badges = await getBadges();
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const uniqueSubjects = new Set(entries.map(e => e.subject)).size;
  const settings = await getSettings();
  const streak = calculateStudyStreak(entries, settings.daily_goal_hours);

  for (const badge of badges) {
    if (badge.unlocked_at) continue;
    let shouldUnlock = false;
    switch (badge.id) {
      case 'first_session': shouldUnlock = entries.length > 0; break;
      case 'streak_7': shouldUnlock = streak >= 7; break;
      case 'streak_30': shouldUnlock = streak >= 30; break;
      case 'hours_100': shouldUnlock = totalHours >= 100; break;
      case 'five_subjects': shouldUnlock = uniqueSubjects >= 5; break;
    }
    if (shouldUnlock) {
      await unlockBadge(badge.id);
      return { ...badge, unlocked_at: new Date().toISOString() };
    }
  }
  return null;
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
    .filter(l => l.habit_id === habitId && l.completed)
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
    .filter(l => l.habit_id === habitId && l.completed)
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

export function calculateHabitCompletionRate(logs: HabitLog[], habitId: string, days: number = 30): number {
  const today = new Date();
  let completed = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    if (logs.some(l => l.habit_id === habitId && l.date === dateStr && l.completed)) {
      completed++;
    }
  }
  return days > 0 ? (completed / days) * 100 : 0;
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
