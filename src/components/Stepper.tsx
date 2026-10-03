import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  step: number;
  min?: number;
  label: string;
}

export function Stepper({ value, onChange, step, min = 0, label }: StepperProps) {
  const handleMinus = () => {
    const next = value - step;
    if (next >= min) {
      onChange(Math.round(next * 10) / 10);
    }
  };

  const handlePlus = () => {
    const next = value + step;
    onChange(Math.round(next * 10) / 10);
  };

  const handleTextChange = (text: string) => {
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity onPress={handleMinus} style={styles.button}>
          <FontAwesome name="minus" size={16} color="white" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={value.toString()}
          onChangeText={handleTextChange}
          selectTextOnFocus
        />

        <TouchableOpacity onPress={handlePlus} style={styles.button}>
          <FontAwesome name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
    marginHorizontal: 10,
  },
});
