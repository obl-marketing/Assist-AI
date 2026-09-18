import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme';
import type { MatchExpert } from '../types';
import { Avatar, AvailabilityPill, Button, Card, ClassBadge, Stars } from './ui';

const rupee = (n?: number | null) => '₹' + Number(n ?? 0).toLocaleString('en-IN');

export function ExpertCard({ e }: { e: MatchExpert }) {
  const router = useRouter();
  const instant = e.services.find((s) => s.pricingModel === 'PER_MINUTE');
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Avatar name={e.name ?? '—'} size={54} />
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Text style={styles.name}>{e.name}</Text>
            <ClassBadge value={e.professionalClass} />
          </View>
          <Text style={styles.sub}>
            {e.headline} · {e.yearsExperience} yrs
          </Text>
        </View>
      </View>

      {/* Why this person — concrete reasons, not just a star rating */}
      {e.whyThisPerson.length > 0 && (
        <View style={styles.why}>
          <Text style={styles.whyHead}>Why this person may fit</Text>
          {e.whyThisPerson.map((r) => (
            <Text key={r} style={styles.whyItem}>✓ {r}</Text>
          ))}
        </View>
      )}

      <View style={[styles.row, { marginTop: 12 }]}>
        <Text style={styles.small}>
          <Stars rating={e.ratingAvg} /> {e.ratingAvg.toFixed(1)} · {e.verifiedCount} verified
        </Text>
        <AvailabilityPill view={e.availability} />
      </View>

      <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
        <Button
          title={e.availability.liveNow ? `Talk now · ${rupee(instant?.ratePerMinute)}/min` : 'View'}
          onPress={() => router.push(`/expert/${e.id}`)}
          style={{ flex: 1 }}
        />
        <Button title="Book" variant="ghost" onPress={() => router.push(`/expert/${e.id}`)} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '600', color: colors.ink },
  sub: { color: colors.ink2, fontSize: 12.5, marginTop: 3 },
  small: { fontSize: 13, color: colors.ink },
  why: { backgroundColor: colors.cream, borderRadius: 14, padding: 12, marginTop: 11 },
  whyHead: { fontSize: 12, fontWeight: '700', color: '#6b6a2c', marginBottom: 4 },
  whyItem: { fontSize: 13, color: '#6b6a2c', lineHeight: 20 },
});
