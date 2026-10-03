import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Exercise } from '../db/types';
import { Stepper } from './Stepper';

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
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{exercise ? 'Edit Exercise' : 'New Exercise'}</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Exercise Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Exercise Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Incline Bench Press"
                placeholderTextColor="#A0A0A5"
                value={name}
                onChangeText={setName}
                autoFocus={!exercise}
                returnKeyType="done"
              />
            </View>

            {/* Target Sets */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Target Sets</Text>
              <Text style={styles.sectionSubtitle}>
                The number of working sets you aim to complete each session.
              </Text>
              <View style={styles.stepperWrapper}>
                <Stepper
                  label="Sets"
                  value={targetSets}
                  onChange={setTargetSets}
                  step={1}
                  min={1}
                />
              </View>
            </View>

            {/* Rep Range */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Rep Range</Text>
              <Text style={styles.sectionSubtitle}>
                Double progression triggers when all sets reach the top of this range.
              </Text>
              <View style={styles.repRangeRow}>
                <Stepper
                  label="Min Reps"
                  value={repMin}
                  onChange={setRepMin}
                  step={1}
                  min={1}
                />
                <Text style={styles.rangeDivider}>to</Text>
                <Stepper
                  label="Max Reps"
                  value={repMax}
                  onChange={setRepMax}
                  step={1}
                  min={1}
                />
              </View>
            </View>

            {/* Weight Increment */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Weight Increment</Text>
              <Text style={styles.sectionSubtitle}>
                The amount of weight to add when progression criteria is met.
              </Text>
              <View style={styles.stepperWrapper}>
                <Stepper
                  label="Increment (lb)"
                  value={incrementLb}
                  onChange={setIncrementLb}
                  step={2.5}
                  min={1}
                />
              </View>
            </View>

            {/* Default / Starting Weight */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Default Weight</Text>
              <Text style={styles.sectionSubtitle}>
                The base weight prefilled when you log this exercise.
              </Text>
              <View style={styles.stepperWrapper}>
                <Stepper
                  label="Weight (lb)"
                  value={defaultWeightLb}
                  onChange={setDefaultWeightLb}
                  step={2.5}
                  min={0}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primarySaveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.primarySaveBtnText}>
                {exercise ? 'Update Exercise' : 'Create Exercise'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160, // Extra space so keyboard never blocks inputs or buttons
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: '#1C1C1E',
  },
  sectionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 14,
  },
  stepperWrapper: {
    alignItems: 'center',
  },
  repRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  rangeDivider: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  primarySaveBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primarySaveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
