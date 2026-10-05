import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus } from 'lucide-react-native';
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
    tags?: string[];
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
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
      const existingTags = exercise.tags
        ? Array.isArray(exercise.tags)
          ? exercise.tags
          : JSON.parse(exercise.tags as any)
        : [];
      setTags(existingTags.slice(0, 3));
      setTagInput('');
    } else {
      setName('');
      setTargetSets(3);
      setRepMin(5);
      setRepMax(10);
      setIncrementLb(5);
      setDefaultWeightLb(45);
      setTags([]);
      setTagInput('');
    }
  }, [exercise, visible]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.length >= 3) {
      Alert.alert('Tag Limit', 'You can add up to 3 tags per exercise.');
      return;
    }
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

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

    let finalTags = [...tags];
    const pendingTag = tagInput.trim();
    if (
      pendingTag &&
      finalTags.length < 3 &&
      !finalTags.some((t) => t.toLowerCase() === pendingTag.toLowerCase())
    ) {
      finalTags.push(pendingTag);
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
        tags: finalTags,
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
              style={styles.scrollArea}
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

              {/* Tags Section (Up to 3 user-defined tags) */}
              <View style={styles.tagSection}>
                <View style={styles.tagHeaderRow}>
                  <Text variant="label" color="muted">
                    TAGS ({tags.length}/3)
                  </Text>
                </View>

                {tags.length > 0 && (
                  <View style={styles.tagChipsRow}>
                    {tags.map((t, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.tagChip,
                          { backgroundColor: colors.raised, borderColor: colors.outline },
                        ]}
                      >
                        <Text variant="micro" color="primary" style={styles.tagChipText}>
                          {t.toUpperCase()}
                        </Text>
                        <Pressable
                          onPress={() => handleRemoveTag(idx)}
                          hitSlop={8}
                          style={styles.tagRemoveBtn}
                        >
                          <X size={12} color={colors.textMuted} strokeWidth={2} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {tags.length < 3 && (
                  <View style={styles.addTagRow}>
                    <TextInput
                      style={[
                        styles.tagInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.surface,
                          borderColor: colors.outline,
                        },
                      ]}
                      // placeholder=""
                      // placeholderTextColor={colors.textMuted}
                      value={tagInput}
                      onChangeText={setTagInput}
                      onSubmitEditing={handleAddTag}
                      returnKeyType="done"
                      maxLength={16}
                      autoCapitalize="characters"
                    />
                    <Pressable
                      onPress={handleAddTag}
                      disabled={!tagInput.trim()}
                      style={[
                        styles.addTagBtn,
                        {
                          backgroundColor: tagInput.trim() ? colors.accent : colors.raised,
                          borderColor: colors.outline,
                        },
                      ]}
                      hitSlop={8}
                    >
                      <Plus
                        size={16}
                        color={tagInput.trim() ? colors.onAccent : colors.textMuted}
                        strokeWidth={2}
                      />
                    </Pressable>
                  </View>
                )}
              </View>

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
            </ScrollView>

            {/* Pinned Action Buttons Footer */}
            <View style={[styles.footer, { borderTopColor: colors.outline, backgroundColor: colors.surface }]}>
              <View style={styles.footerRow}>
                <View style={styles.footerBtnWrapper}>
                  <Button
                    label="CANCEL"
                    variant="secondary"
                    onPress={onClose}
                    disabled={saving}
                    style={styles.actionBtn}
                  />
                </View>
                <View style={styles.footerBtnWrapper}>
                  <Button
                    label={exercise ? 'SAVE' : 'CREATE'}
                    variant="primary"
                    onPress={handleSave}
                    loading={saving}
                    style={styles.actionBtn}
                  />
                </View>
              </View>
            </View>
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
    overflow: 'hidden',
  },
  keyboardContainer: {
    width: '100%',
    maxHeight: '100%',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  ruleSpacing: {
    marginVertical: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  tagSection: {
    gap: 8,
  },
  tagHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 2,
    gap: 6,
  },
  tagChipText: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_600SemiBold',
    letterSpacing: 0.5,
  },
  tagRemoveBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: 'IBMPlexMono_400Regular',
  },
  addTagBtn: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerBtnWrapper: {
    flex: 1,
  },
  actionBtn: {
    height: 48,
  },
});
