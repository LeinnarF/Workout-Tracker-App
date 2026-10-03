import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { lbToKg, kgToLb, miToKm, kmToMi } from '../../src/logic/conversions';

export default function ConvertScreen() {
  const [lbStr, setLbStr] = useState('');
  const [kgStr, setKgStr] = useState('');

  const [miStr, setMiStr] = useState('');
  const [kmStr, setKmStr] = useState('');

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

  const handleMiChange = (text: string) => {
    setMiStr(text);
    const val = parseFloat(text);
    if (!isNaN(val)) {
      setKmStr(miToKm(val).toString());
    } else {
      setKmStr('');
    }
  };

  const handleKmChange = (text: string) => {
    setKmStr(text);
    const val = parseFloat(text);
    if (!isNaN(val)) {
      setMiStr(kmToMi(val).toString());
    } else {
      setMiStr('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Unit Converter</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weight</Text>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pounds (lb)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={lbStr}
                  onChangeText={handleLbChange}
                  placeholder="0"
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
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance</Text>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Miles (mi)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={miStr}
                  onChangeText={handleMiChange}
                  placeholder="0"
                />
              </View>
              <Text style={styles.equals}>=</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kilometers (km)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={kmStr}
                  onChangeText={handleKmChange}
                  placeholder="0"
                />
              </View>
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
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 40,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
  },
  equals: {
    fontSize: 24,
    color: '#888',
    marginHorizontal: 16,
    marginTop: 20, // Align with inputs, roughly
  },
});
