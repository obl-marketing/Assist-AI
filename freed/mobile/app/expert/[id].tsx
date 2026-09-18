import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme';
import { Avatar, Button, Card, ClassBadge, Stars, text } from '../../src/components/ui';
import type { TrustProfile } from '../../src/types';

const rupee = (n?: number | null) => '₹' + Number(n ?? 0).toLocaleString('en-IN');

export default function ExpertProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useQuery({ queryKey: ['expert', id], queryFn: () => api.expert(id!), enabled: !!id });
  const e = q.data;
  const trust: TrustProfile | undefined = e?.trustProfile;

  if (!e) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <Text style={[text.muted, { padding: 20 }]}>{q.isLoading ? 'Loading…' : 'Not found'}</Text>
      </SafeAreaView>
    );
  }

  const instant = e.services?.find((s: any) => s.pricingModel === 'PER_MINUTE');
  const live = e.availability?.state === 'AVAILABLE';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        <Pressable onPress={() => router.back()}><Text style={{ fontSize: 22 }}>‹</Text></Pressable>

        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <Avatar name={e.user?.name ?? '—'} size={90} />
          <Text style={[text.h1, { marginTop: 12 }]}>{e.user?.name}</Text>
          {trust && (
            <View style={{ marginTop: 6 }}>
              <ClassBadge value={trust.professionalClass} />
            </View>
          )}
          <Text style={text.muted}>{e.headline}</Text>
          <Text style={text.muted}>{e.yearsExperience}+ years experience</Text>
        </View>

        {trust?.professionalClass === 'LICENSED_PROFESSIONAL' && (
          <Card style={{ marginTop: 14, backgroundColor: colors.pinkSoft, borderColor: 'transparent' }}>
            <Text style={{ color: '#8a4b52', fontSize: 12.5, lineHeight: 18 }}>
              🛡️ Licensed mental-health professional. This is professional psychological care,
              distinct from general coaching.
            </Text>
          </Card>
        )}

        <Text style={[text.h2, { marginTop: 20, marginBottom: 8 }]}>About</Text>
        <Text style={[text.muted, { lineHeight: 22 }]}>{e.bio}</Text>

        {/* Trust Profile — claim by claim, never a single score */}
        <Text style={[text.h2, { marginTop: 20, marginBottom: 10 }]}>
          Trust Profile{trust ? ` · ${trust.verifiedCount} verified` : ''}
        </Text>
        <Card style={{ padding: 4, paddingHorizontal: 16 }}>
          {trust?.claims.map((c) => (
            <View key={c.type + c.title} style={styles.claim}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>{c.label}</Text>
              <Text style={{ fontSize: 12.5, color: c.verified ? colors.avail : colors.ink3 }}>
                {c.verified ? '✓ Verified' : c.status.replace('_', ' ').toLowerCase()}
              </Text>
            </View>
          ))}
          {trust && (
            <View style={[styles.claim, { borderBottomWidth: 0 }]}>
              <Text style={text.muted}>Track record</Text>
              <Text style={{ fontSize: 13 }}>
                <Stars rating={trust.ratingAvg} /> {trust.ratingAvg.toFixed(1)} · {trust.consultCount.toLocaleString('en-IN')} consults
              </Text>
            </View>
          )}
        </Card>

        <Text style={[text.h2, { marginTop: 20, marginBottom: 10 }]}>Ways to consult</Text>
        {e.services?.map((s: any) => (
          <Card key={s.id} style={{ marginBottom: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontWeight: '600' }}>{s.title}</Text>
              <Text style={text.tiny}>
                {s.pricingModel === 'PER_MINUTE' ? 'per minute' : s.durationMinutes ? `${s.durationMinutes} min session` : 'fixed price'}
              </Text>
            </View>
            <Text style={{ fontWeight: '700' }}>
              {rupee(s.ratePerMinute ?? s.sessionPrice ?? s.productPrice)}
              {s.pricingModel === 'PER_MINUTE' ? '/min' : ''}
            </Text>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.cta}>
        <Button
          title={live ? `Talk now · ${rupee(instant?.ratePerMinute)}/min` : 'Book a session'}
          onPress={() => {}}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  claim: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
