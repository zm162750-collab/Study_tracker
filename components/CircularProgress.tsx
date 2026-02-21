import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
  textColor: string;
  label?: string;
  valueText?: string;
}

export function CircularProgress({
  progress,
  size,
  strokeWidth,
  color,
  trackColor,
  textColor,
  label,
  valueText,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        {valueText ? (
          <Text style={[styles.valueText, { color: textColor }]}>{valueText}</Text>
        ) : (
          <Text style={[styles.valueText, { color: textColor }]}>{Math.round(clampedProgress * 100)}%</Text>
        )}
        {label ? <Text style={[styles.label, { color: textColor, opacity: 0.6 }]}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
