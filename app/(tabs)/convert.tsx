import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { lbToKg, kgToLb } from '../../src/logic/conversions';

export default function ConvertScreen() {
  const [lbStr, setLbStr] = useState('');
  const [kgStr, setKgStr] = useState('');

  const handleLbChange = (text: string) => {
    setLbStr(text);
    const val = parseFloat(text);
    if (!isNaN(val)) {
      setKgStr(lbToKg(val).toString());
    } else {
      setKgStr('');
    }
  };

  const handleKgChange = (text: string) => {
    setKgStr(text);
    const val = parseFloat(text);
    if (!isNaN(val)) {
      setLbStr(kgToLb(val).toString());
    } else {
      setLbStr('');
    }
  };

  const handleClear = () => {
    setLbStr('');
    setKgStr('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Weight Converter</Text>
            {(lbStr !== '' || kgStr !== '') && (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pounds (lb)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={lbStr}
                  onChangeText={handleLbChange}
                  placeholder="0"
                  placeholderTextColor="#A0A0A5"
                />
              </View>

              <Text style={styles.equals}>=</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kilograms (kg)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={kgStr}
                  onChangeText={handleKgChange}
                  placeholder="0"
                  placeholderTextColor="#A0A0A5"
                />
              </View>
            </View>
          </View>

          <View style={styles.quickBarCard}>
            <Text style={styles.quickBarTitle}>Quick Barbell Weights</Text>
            <View style={styles.quickGrid}>
              {[45, 95, 135, 185, 225, 275, 315].map((lb) => (
                <TouchableOpacity
                  key={lb}
                  style={styles.quickPill}
                  onPress={() => handleLbChange(lb.toString())}
                >
                  <Text style={styles.quickPillLb}>{lb} lb</Text>
                  <Text style={styles.quickPillKg}>≈ {lbToKg(lb)} kg</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  clearBtn: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#3A3A3C',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 14,
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  equals: {
    fontSize: 26,
    fontWeight: '700',
    color: '#8E8E93',
    marginHorizontal: 12,
    marginTop: 24,
  },
  quickBarCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  quickBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickPill: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickPillLb: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  quickPillKg: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});
