import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { text } from '../../src/components/ui';

// TODO: build out — mirrors the flows demonstrated in web/freed.html.
export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ padding: 20 }}>
        <Text style={[text.h2, { fontWeight: '800', textTransform: 'capitalize' }]}>profile</Text>
        <Text style={[text.muted, { marginTop: 8 }]}>
          Scaffolded screen. Wire to the API next — see the interactive reference in web/freed.html.
        </Text>
      </View>
    </SafeAreaView>
  );
}
