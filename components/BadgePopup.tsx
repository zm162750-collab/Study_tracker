import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Badge } from '@/lib/storage';

interface BadgePopupProps {
  badge: Badge | null;
  onClose: () => void;
  tintColor: string;
  cardColor: string;
  textColor: string;
}

const BADGE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  flame: 'local-fire-department',
  trophy: 'emoji-events',
  star: 'star',
  rocket: 'rocket-launch',
  school: 'school',
};

export function BadgePopup({ badge, onClose, tintColor, cardColor, textColor }: BadgePopupProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (badge) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSpring(1, { damping: 8, stiffness: 120 });
      rotate.value = withSequence(
        withSpring(10, { damping: 4 }),
        withSpring(-10, { damping: 4 }),
        withSpring(0, { damping: 6 })
      );
    } else {
      scale.value = 0;
      rotate.value = 0;
    }
  }, [badge]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  if (!badge) return null;

  const iconName = BADGE_ICONS[badge.icon] || 'star';

  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { backgroundColor: cardColor }, animStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: tintColor + '20' }]}>
            <MaterialIcons name={iconName} size={48} color={tintColor} />
          </View>
          <Text style={[styles.title, { color: tintColor }]}>Badge Unlocked!</Text>
          <Text style={[styles.badgeName, { color: textColor }]}>{badge.title}</Text>
          <Text style={[styles.description, { color: textColor, opacity: 0.6 }]}>{badge.description}</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.button, { backgroundColor: tintColor, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.buttonText}>Awesome!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  badgeName: {
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
