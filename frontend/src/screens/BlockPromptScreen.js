import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { decideTransaction } from '../api/client';
import { colors, font } from '../theme';

const USER_ID = 'demo-user';

export default function BlockPromptScreen({ route, navigation }) {
  const { transaction } = route.params;
  const promptShownAt = useRef(Date.now());

  const handleDismiss = () => {
    const latency = Date.now() - promptShownAt.current;
    decideTransaction({
      transaction_token: transaction.id,
      user_token: USER_ID,
      amount: transaction.amount,
      merchant_name: transaction.merchant || '',
      approved: false,
      decision_latency_ms: latency,
    }).catch(() => {});
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.top}>
        <Text style={s.label}>Blocked</Text>
      </View>

      <View style={s.body}>
        <Text style={s.amount}>{'\u00A3'}{transaction.amount?.toFixed(2)}</Text>
        <Text style={s.merchant}>{transaction.merchant || 'Unknown'}</Text>

        {transaction.context_line && (
          <Text style={s.context}>{transaction.context_line}</Text>
        )}
      </View>

      <View style={s.bottom}>
        <Text style={s.hint}>This transaction was automatically blocked.</Text>
        <TouchableOpacity
          style={s.dismissBtn}
          onPress={handleDismiss}
          activeOpacity={0.7}
        >
          <Text style={s.dismissText}>OK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  top: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.red,
  },

  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  amount: {
    fontFamily: font.bold,
    fontSize: 64,
    color: colors.text,
    letterSpacing: -2,
  },
  merchant: {
    fontFamily: font.regular,
    fontSize: 18,
    color: colors.sub,
    marginTop: 6,
  },
  context: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.muted,
    marginTop: 20,
    lineHeight: 20,
  },

  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  hint: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  dismissBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  dismissText: {
    fontFamily: font.semi,
    fontSize: 16,
    color: colors.text,
  },
});
