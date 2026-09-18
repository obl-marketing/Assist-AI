import React from 'react';
import { ScrollView, View, Text, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../src/lib/api';
import { colors } from '../src/theme';
import { text } from '../src/components/ui';
import { ExpertCard } from '../src/components/ExpertCard';

/** AI matching / "Talk now" results — relevant people, with reasons. */
export default function Match() {
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string; live?: string }>();
  const liveOnly = params.live === '1';

  const q = useQuery({
    queryKey: ['match', params.text, liveOnly],
    queryFn: () => api.match({ text: params.text, liveOnly, limit: 6 }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <Pressable onPress={() => router.back()}><Text style={{ fontSize: 22 }}>‹</Text></Pressable>
        <Text style={[text.tiny, { flex: 1, textAlign: 'center' }]}>Your matches</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
        <Text style={[text.h1]}>
          {liveOnly ? 'People available right now.' : 'People who may be a good fit.'}
        </Text>
        {params.text ? (
          <Text style={[text.muted, { marginTop: 6 }]}>"{params.text}"</Text>
        ) : null}

        {q.isLoading && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator color={colors.green} />
            <Text style={[text.muted, { marginTop: 12 }]}>Finding someone for you…</Text>
          </View>
        )}

        {q.data && (
          <>
            <Text style={[text.muted, { marginTop: 8, marginBottom: 12 }]}>
              {q.data.count} {q.data.count === 1 ? 'person' : 'people'} who can help.
            </Text>
            {q.data.experts.map((e) => (
              <View key={e.id} style={{ marginBottom: 12 }}>
                <ExpertCard e={e} />
              </View>
            ))}
          </>
        )}

        {q.isError && <Text style={[text.muted, { marginTop: 20 }]}>Couldn't reach the matcher. Is the API running?</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
