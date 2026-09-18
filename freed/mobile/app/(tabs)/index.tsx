import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { colors, radius } from '../../src/theme';
import { Card, text } from '../../src/components/ui';
import { ExpertCard } from '../../src/components/ExpertCard';

const PLACEHOLDERS = [
  'I need help choosing a career',
  'I want to prepare for GATE',
  'I need a mock interview',
  'I want to speak to a psychologist',
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const live = useQuery({ queryKey: ['live'], queryFn: () => api.match({ liveOnly: true, limit: 6 }) });
  const verticals = useQuery({ queryKey: ['verticals'], queryFn: () => api.verticals() });

  const goMatch = () => router.push({ pathname: '/match', params: { text: q } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={text.tiny}>{greeting()} 👋</Text>
        <Text style={styles.logo}>FREED</Text>
        <Text style={[text.h1, { marginTop: 10 }]}>What can we help{'\n'}you with today?</Text>

        <Pressable style={styles.search} onPress={goMatch}>
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder={PLACEHOLDERS[0]}
            placeholderTextColor={colors.ink3}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={goMatch}
            returnKeyType="search"
          />
        </Pressable>

        <Pressable style={styles.talkNow} onPress={() => router.push({ pathname: '/match', params: { live: '1' } })}>
          <Text style={{ fontSize: 22 }}>📞</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>Talk to someone now</Text>
            <Text style={{ color: '#2f5b30', fontSize: 13 }}>See experts available right now</Text>
          </View>
          <Text style={{ fontSize: 18 }}>›</Text>
        </Pressable>

        <Text style={[text.h2, { marginTop: 24, marginBottom: 4 }]}>Available now</Text>
        <Text style={[text.tiny, { marginBottom: 12 }]}>Who can talk to you right now?</Text>
        {live.data?.experts.map((e) => (
          <View key={e.id} style={{ marginBottom: 12 }}>
            <ExpertCard e={e} />
          </View>
        ))}
        {live.data && live.data.experts.length === 0 && (
          <Text style={text.muted}>No one is live this moment — try booking a time.</Text>
        )}

        <Text style={[text.h2, { marginTop: 20, marginBottom: 12 }]}>People who can help</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {verticals.data?.map((v) => (
            <Pressable
              key={v.key}
              style={styles.vertical}
              onPress={() => router.push({ pathname: '/(tabs)/explore', params: { vertical: v.key } })}
            >
              <Text style={{ fontSize: 24 }}>{v.emoji}</Text>
              <Text style={{ fontWeight: '600', marginTop: 6 }}>{v.name}</Text>
              <Text style={text.tiny}>{v.tagline}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logo: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    padding: 16,
    marginTop: 16,
  },
  input: { flex: 1, fontSize: 15, color: colors.ink },
  talkNow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.greenLight,
    borderRadius: radius.md,
    padding: 18,
    marginTop: 20,
  },
  vertical: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 16,
  },
});
