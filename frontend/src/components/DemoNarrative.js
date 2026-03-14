import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, font } from '../theme';

export default function DemoNarrative({ text, step, total }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [text, opacity]);

  if (!text) return null;

  return (
    <Animated.View style={[s.wrap, { opacity }]} pointerEvents="none">
      <View style={s.card}>
        <View style={s.stepRow}>
          <View style={s.stepBadge}>
            <Text style={s.stepText}>{step}/{total}</Text>
          </View>
          <View style={s.dots}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[s.dot, i + 1 <= step && s.dotActive]} />
            ))}
          </View>
        </View>
        <Text style={s.text}>{text}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  card: {
    backgroundColor: '#111118ee',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.brand + '44',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  stepBadge: {
    backgroundColor: colors.brand + '33',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stepText: {
    fontFamily: font.semi,
    fontSize: 10,
    color: colors.brand,
    letterSpacing: 0.5,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
  },
  dotActive: {
    backgroundColor: colors.brand,
  },
  text: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
