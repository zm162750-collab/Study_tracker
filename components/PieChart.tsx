import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size: number;
  textColor: string;
}

export function PieChart({ data, size, textColor }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const radius = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  let startAngle = -90;
  const paths: { d: string; color: string }[] = [];

  data.forEach((item) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const endAngle = startAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    paths.push({ d, color: item.color });

    startAngle = endAngle;
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G>
          {paths.map((path, i) => (
            <Path key={i} d={path.d} fill={path.color} />
          ))}
        </G>
      </Svg>
      <View style={styles.legend}>
        {data.slice(0, 5).map((item, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: textColor }]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
