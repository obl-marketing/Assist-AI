import React from 'react';
import { Text, View, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, shadow } from '../theme';
import type { AvailabilityView, ProfessionalClass } from '../types';

export function Avatar({ name, seed, size = 52 }: { name: string; seed?: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.greenMid,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

const CLASS_LABEL: Record<ProfessionalClass, string> = {
  LICENSED_PROFESSIONAL: 'Licensed Professional',
  CERTIFIED_PROFESSIONAL: 'Certified Professional',
  VERIFIED_EXPERT: 'Verified Expert',
  COACH: 'Coach',
  MENTOR: 'Mentor',
  TEACHER: 'Teacher',
  ADVISOR: 'Advisor',
};

/** Class-specific badge — a licensed professional is NEVER shown as a coach. */
export function ClassBadge({ value }: { value: ProfessionalClass }) {
  const licensed = value === 'LICENSED_PROFESSIONAL';
  const bg = licensed ? colors.pinkSoft : '#EAF6EC';
  const fg = licensed ? '#a54952' : '#2f7d3a';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontWeight: '600', fontSize: 11.5 }}>✓ {CLASS_LABEL[value]}</Text>
    </View>
  );
}

export function AvailabilityPill({ view }: { view: AvailabilityView }) {
  return (
    <View style={styles.avail}>
      {view.liveNow && <View style={styles.dot} />}
      <Text style={{ color: view.liveNow ? colors.avail : colors.ink3, fontWeight: '600', fontSize: 12.5 }}>
        {view.label}
      </Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'soft';
  style?: ViewStyle;
}) {
  const bg = variant === 'primary' ? colors.green : variant === 'soft' ? colors.cream : colors.surface;
  const fg = variant === 'primary' ? '#0f2a12' : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderWidth: variant === 'ghost' ? 1 : 0, borderColor: colors.line, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}
    >
      <Text style={{ color: fg, fontWeight: '600', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, shadow.card, style]}>{children}</View>;
}

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return <Text style={{ color: '#F2B33D' }}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</Text>;
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, alignSelf: 'flex-start' } as ViewStyle,
  avail: { flexDirection: 'row', alignItems: 'center', gap: 6 } as ViewStyle,
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.avail } as ViewStyle,
  btn: { paddingVertical: 15, paddingHorizontal: 20, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: 16 } as ViewStyle,
});

export const text = {
  h1: { fontSize: 26, fontWeight: '600', color: colors.ink } as TextStyle,
  h2: { fontSize: 20, fontWeight: '600', color: colors.ink } as TextStyle,
  muted: { color: colors.ink2, fontSize: 14 } as TextStyle,
  tiny: { color: colors.ink3, fontSize: 12 } as TextStyle,
};
