import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Exercise } from '../db/types';
import { useTheme } from '../theme/useTheme';
import { Text, Button, Field, Stepper, Rule } from './ui';

interface Props {
  visible: boolean;
  exercise?: Exercise | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    repMin: number;
    repMax: number;
    targetSets: number;
    incrementLb: number;
    defaultWeightLb?: number;
  }) => Promise<void>;
}

export function ExerciseModal({ visible, exercise, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [targetSets, setTargetSets] = useState(3);
  const [repMin, setRepMin] = useState(5);
  const [repMax, setRepMax] = useState(10);
  const [incrementLb, setIncrementLb] = useState(5);
  const [defaultWeightLb, setDefaultWeightLb] = useState(45);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (exercise) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(exercise.name);
      setTargetSets(exercise.target_sets || 3);
      setRepMin(exercise.rep_min || 5);
      setRepMax(exercise.rep_max || 10);
      setIncrementLb(exercise.increment_lb || 5);
      setDefaultWeightLb(exercise.default_weight_lb != null ? exercise.default_weight_lb : 45);
    } else {
      setName('');
      setTargetSets(3);
      setRepMin(5);
      setRepMax(10);
      setIncrementLb(5);
      setDefaultWeightLb(45);
    }
  }, [exercise, visible]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter an exercise name.');
      return;
    }
    if (repMin > repMax) {
      Alert.alert('Invalid Rep Range', 'Minimum reps cannot be greater than maximum reps.');
      return;
    }
    if (targetSets < 1) {
      Alert.alert('Invalid Sets', 'Target sets must be at least 1.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        name: trimmed,
        repMin,
        repMax,
        targetSets,
        incrementLb,
        defaultWeightLb,
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save exercise.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.dialogSheet, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.outline }]}>
              <Text variant="title" color="primary">
                {exercise ? 'EDIT EXERCISE' : 'NEW EXERCISE'}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={20} color={colors.text} strokeWidth={1.75} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              overScrollMode="never"
            >
              {/* Exercise Name */}
              <Field
                label="EXERCISE NAME"
                placeholder="e.g. INCLINE BENCH PRESS"
                value={name}
                onChangeText={setName}
                autoFocus={!exercise}
                returnKeyType="done"
              />

              <Rule style={styles.ruleSpacing} />

              {/* Target Sets & Increment */}
              <View style={styles.stepperRow}>
                <Stepper
                  compact
                  label="TARGET SETS"
                  value={targetSets}
                  onChange={setTargetSets}
                  step={1}
                  min={1}
                />
                <Stepper
                  compact
                  label="INCREMENT"
                  unit="LB"
                  value={incrementLb}
                  onChange={setIncrementLb}
                  step={2.5}
                  min={1}
                />
              </View>

              <Rule style={styles.ruleSpacing} />

              {/* Rep Range */}
              <View style={styles.stepperRow}>
                <Stepper
                  compact
                  label="MIN REPS"
                  value={repMin}
                  onChange={setRepMin}
                  step={1}
                  min={1}
                />
                <Stepper
                  compact
                  label="MAX REPS"
                  value={repMax}
                  onChange={setRepMax}
                  step={1}
                  min={1}
                />
              </View>

              <Rule style={styles.ruleSpacing} />

              {/* Default Starting Weight */}
              <View style={styles.stepperRow}>
                <Stepper
                  compact
                  label="DEFAULT WEIGHT"
                  unit="LB"
                  value={defaultWeightLb}
                  onChange={setDefaultWeightLb}
                  step={2.5}
                  min={0}
                />
              </View>

              <Rule style={styles.ruleSpacing} />

              {/* Stacked Action Buttons: Primary on top */}
              <View style={styles.buttonStack}>
                <Button
                  label={exercise ? 'UPDATE EXERCISE' : 'CREATE EXERCISE'}
                  variant="primary"
                  onPress={handleSave}
                  loading={saving}
                />
                <Button
                  label="CANCEL"
                  variant="secondary"
                  onPress={onClose}
                  disabled={saving}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 50% black per design rules
    justifyContent: 'center',
    padding: 16,
  },
  dialogSheet: {
    maxHeight: '90%',
    borderWidth: 1,
    borderRadius: 0,
  },
  keyboardContainer: {
    width: '100%',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  ruleSpacing: {
    marginVertical: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  buttonStack: {
    marginTop: 8,
    gap: 12,
  },
});
