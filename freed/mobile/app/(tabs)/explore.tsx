import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme';
import { text } from '../../src/components/ui';

export default function Explore() {
  const router = useRouter();
  const verticals = useQuery({ queryKey: ['verticals'], queryFn: () => api.verticals() });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[text.h2, { fontWeight: '800' }]}>Explore</Text>
        <Text style={[text.muted, { marginTop: 6, marginBottom: 16 }]}>
          Five founding verticals — supply built one at a time.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {verticals.data?.map((v) => (
            <Pressable
              key={v.key}
              style={styles.card}
              onPress={() => router.push({ pathname: '/match', params: { text: v.name } })}
            >
              <Text style={{ fontSize: 26 }}>{v.emoji}</Text>
              <Text style={{ fontWeight: '600', marginTop: 8 }}>{v.name}</Text>
              <Text style={text.tiny}>{v.categoryCount} areas</Text>
              <Text style={[text.tiny, { marginTop: 4 }]}>{v.tagline}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 16,
  },
});
