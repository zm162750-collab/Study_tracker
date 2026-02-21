import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface BarChartProps {
  data: { label: string; value: number }[];
  maxValue?: number;
  barColor: string;
  textColor: string;
  trackColor: string;
  height?: number;
}

function AnimatedBar({ value, maxValue, barColor, trackColor, height }: {
  value: number; maxValue: number; barColor: string; trackColor: string; height: number;
}) {
  const barHeight = maxValue > 0 ? (value / maxValue) * height : 0;
  const animStyle = useAnimatedStyle(() => ({
    height: withTiming(barHeight, { duration: 600 }),
  }));

  return (
    <View style={[styles.barTrack, { height, backgroundColor: trackColor }]}>
      <Animated.View style={[styles.bar, { backgroundColor: barColor }, animStyle]} />
    </View>
  );
}

export function BarChart({ data, maxValue, barColor, textColor, trackColor, height = 120 }: BarChartProps) {
  const computedMax = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {data.map((item, i) => (
          <View key={i} style={styles.barContainer}>
            <Text style={[styles.valueLabel, { color: textColor }]}>
              {item.value > 0 ? item.value.toFixed(1) : ''}
            </Text>
            <AnimatedBar
              value={item.value}
              maxValue={computedMax}
              barColor={barColor}
              trackColor={trackColor}
              height={height}
            />
            <Text style={[styles.dayLabel, { color: textColor, opacity: 0.6 }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 2,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
