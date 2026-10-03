import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Session, Exercise, SetRecord } from '../../src/db/types';
import {
  getActiveSession,
  startSession,
  finishSession,
  getExercises,
  getSetsForSession,
  addSet,
  deleteSet,
  getLastSessionSetsForExercise,
  ensurePresetExercises,
  addExercise,
  updateExercise,
  updateExerciseDefaultWeight,
  deleteExercise,
} from '../../src/db/queries';
import { suggestNext, ProgressionSuggestion } from '../../src/logic/suggestNext';
import { lbToKg } from '../../src/logic/conversions';
import { Stepper } from '../../src/components/Stepper';
import { ExerciseModal } from '../../src/components/ExerciseModal';

const PRESET_ORDER = [
  'Dips',
  'Pull ups',
  'Overhead Press',
  'Barbell Row',
  "Farmer's Carry",
  'Bulgarian Split Squat',
  'Romanian Deadlift',
];

export default function LogScreen() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [sets, setSets] = useState<(SetRecord & { exercise_name: string })[]>([]);

  // Expanded exercise state (which exercise is currently selected for logging)
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number>(45);
  const [currentReps, setCurrentReps] = useState<number>(4);
  const [suggestion, setSuggestion] = useState<ProgressionSuggestion | null>(null);
  const [showKgId, setShowKgId] = useState<number | null>(null);

  // Exercise Add/Edit modal state
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const loadData = useCallback(async () => {
    try {
      await ensurePresetExercises(db);
      const exList = await getExercises(db);

      // Sort with preset order first
      const sorted = [...exList].sort((a, b) => {
        const indexA = PRESET_ORDER.indexOf(a.name);
        const indexB = PRESET_ORDER.indexOf(b.name);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
      setExercises(sorted);

      const active = await getActiveSession(db);
      setSession(active);
      if (active) {
        const activeSets = await getSetsForSession(db, active.id);
        setSets(activeSets);
      } else {
        setSets([]);
      }
    } catch (e) {
      console.error('Error loading exercises:', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSelectExercise = async (ex: Exercise) => {
    if (selectedExerciseId === ex.id) {
      // Toggle collapse
      setSelectedExerciseId(null);
      setSuggestion(null);
      return;
    }

    setSelectedExerciseId(ex.id);

    try {
      const history = await getLastSessionSetsForExercise(db, ex.id, session?.id);
      const sug = suggestNext(ex, history);

      // Determine default weight:
      // 1. If exercise has an accepted or specified default_weight_lb, use it
      // 2. Otherwise use the weight from the last session
      // 3. Fallback to 45 lb
      let baseWeight = 45;
      if (ex.default_weight_lb != null && ex.default_weight_lb > 0) {
        baseWeight = ex.default_weight_lb;
      } else if (history.length > 0) {
        baseWeight = history[history.length - 1].weight_lb;
      }

      setCurrentWeight(baseWeight);

      // Double progression suggestion is accepted once:
      // If the exercise's current base weight already reached or exceeded the suggested weight,
      // it has already been accepted! Do not show the prompt again.
      if (sug.shouldIncrease && baseWeight < sug.suggestedWeightLb) {
        setSuggestion(sug);
      } else {
        setSuggestion(null);
      }

      // Default rep count to 4
      setCurrentReps(4);
    } catch (e) {
      console.error('Error getting history for exercise:', e);
    }
  };

  const handleAcceptSuggestion = async (ex: Exercise, suggestedWeight: number) => {
    setCurrentWeight(suggestedWeight);
    setSuggestion(null);

    // Save accepted weight as the new default weight for this exercise in DB
    await updateExerciseDefaultWeight(db, ex.id, suggestedWeight);

    // Update in-memory state so subsequent opens use this accepted default weight
    setExercises((prev) =>
      prev.map((item) =>
        item.id === ex.id ? { ...item, default_weight_lb: suggestedWeight } : item
      )
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLogSet = async (ex: Exercise) => {
    try {
      const exerciseSets = sets.filter((s) => s.exercise_id === ex.id);

      // Prevent adding sets if maximum number of sets is reached
      if (exerciseSets.length >= ex.target_sets) {
        Alert.alert(
          'Max Sets Reached',
          `You have reached the maximum of ${ex.target_sets} sets for ${ex.name}.`
        );
        return;
      }

      let currentSession = session;
      if (!currentSession) {
        // Automatically start session on the first logged set
        currentSession = await startSession(db);
        setSession(currentSession);
      }

      const nextIndex = exerciseSets.length;

      await addSet(
        db,
        currentSession.id,
        ex.id,
        nextIndex,
        currentWeight,
        currentReps,
        false
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updatedSets = await getSetsForSession(db, currentSession.id);
      setSets(updatedSets);

      // Keep default weight in sync with the exercise
      await updateExerciseDefaultWeight(db, ex.id, currentWeight);
      setExercises((prev) =>
        prev.map((item) =>
          item.id === ex.id ? { ...item, default_weight_lb: currentWeight } : item
        )
      );

      // Keep rep count at default 4 for next set
      setCurrentReps(4);
    } catch (e) {
      Alert.alert('Error', 'Failed to log set: ' + String(e));
    }
  };

  const handleDeleteSet = async (setId: number) => {
    if (!session) return;
    try {
      await deleteSet(db, setId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updatedSets = await getSetsForSession(db, session.id);
      setSets(updatedSets);
    } catch (e) {
      Alert.alert('Error', 'Failed to delete set: ' + String(e));
    }
  };

  const handleFinishWorkout = () => {
    if (!session) return;
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout? It will be saved to your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'default',
          onPress: async () => {
            await finishSession(db, session.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSession(null);
            setSets([]);
            setSelectedExerciseId(null);
          },
        },
      ]
    );
  };

  const handleExerciseLongPress = (ex: Exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      ex.name,
      `Target: ${ex.target_sets} sets × ${ex.rep_min}-${ex.rep_max} reps (${ex.increment_lb} lb inc)`,
      [
        {
          text: 'Edit Exercise',
          onPress: () => {
            setEditingExercise(ex);
            setExerciseModalVisible(true);
          },
        },
        {
          text: 'Delete Exercise',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Exercise',
              `Are you sure you want to remove "${ex.name}"? Past workout history will be safely preserved.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteExercise(db, ex.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (selectedExerciseId === ex.id) {
                      setSelectedExerciseId(null);
                    }
                    loadData();
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveExerciseModal = async (data: {
    name: string;
    repMin: number;
    repMax: number;
    targetSets: number;
    incrementLb: number;
    defaultWeightLb?: number;
  }) => {
    if (editingExercise) {
      await updateExercise(
        db,
        editingExercise.id,
        data.name,
        data.repMin,
        data.repMax,
        data.targetSets,
        data.incrementLb,
        data.defaultWeightLb !== undefined ? data.defaultWeightLb : editingExercise.default_weight_lb
      );
    } else {
      await addExercise(
        db,
        data.name,
        data.repMin,
        data.repMax,
        data.targetSets,
        data.incrementLb,
        data.defaultWeightLb ?? 45
      );
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    loadData();
  };

  if (loading && exercises.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Workout Log</Text>
          <Text style={styles.headerSubtitle}>
            {sets.length > 0
              ? `${sets.length} set${sets.length > 1 ? 's' : ''} logged today`
              : 'Tap any exercise to log reps & sets'}
          </Text>
        </View>
        {session && sets.length > 0 && (
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinishWorkout}>
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {exercises.map((ex) => {
          const isExpanded = selectedExerciseId === ex.id;
          const exSets = sets.filter((s) => s.exercise_id === ex.id);
          const isMaxSetsReached = exSets.length >= ex.target_sets;

          return (
            <View key={ex.id} style={[styles.exerciseCard, isExpanded && styles.exerciseCardActive]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => handleSelectExercise(ex)}
                onLongPress={() => handleExerciseLongPress(ex)}
                delayLongPress={350}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeaderLeft}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.targetInfo}>
                      Target: {ex.target_sets} sets × {ex.rep_min}-{ex.rep_max} reps
                    </Text>
                  </View>
                </View>

                <View style={styles.cardHeaderRight}>
                  {exSets.length > 0 && (
                    <View style={[styles.countBadge, isMaxSetsReached && styles.completedBadge]}>
                      {isMaxSetsReached && (
                        <FontAwesome name="check" size={11} color="#fff" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[styles.countBadgeText, isMaxSetsReached && styles.completedBadgeText]}>
                        {isMaxSetsReached ? `Done (${exSets.length}/${ex.target_sets})` : `${exSets.length}/${ex.target_sets} sets`}
                      </Text>
                    </View>
                  )}
                  <FontAwesome
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#666"
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </TouchableOpacity>

              {/* Logged sets summary pills if not expanded */}
              {!isExpanded && exSets.length > 0 && (
                <View style={styles.pillsRow}>
                  {exSets.map((s, i) => (
                    <View key={s.id} style={styles.setMiniPill}>
                      <Text style={styles.setMiniPillText}>
                        S{i + 1}: {s.weight_lb}lb × {s.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Expanded Logging Controls */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {/* Overload suggestion banner if applicable */}
                  {suggestion?.shouldIncrease && (
                    <View style={styles.badgeContainer}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.badgeTitle}>Ready to increase weight!</Text>
                        <Text style={styles.badgeSubtitle}>
                          Suggesting → {suggestion.suggestedWeightLb} lb
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.badgeAccept}
                        onPress={() => handleAcceptSuggestion(ex, suggestion.suggestedWeightLb)}
                      >
                        <Text style={styles.badgeAcceptText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Previous sets list for this exercise in current session */}
                  {exSets.length > 0 && (
                    <View style={styles.setsListContainer}>
                      <Text style={styles.sectionHeading}>Today's Sets:</Text>
                      {exSets.map((s, i) => (
                        <View key={s.id} style={styles.setRecordRow}>
                          <Text style={styles.setRecordText}>
                            <Text style={styles.boldText}>Set {i + 1}:</Text>{' '}
                            <TouchableOpacity
                              onPress={() => setShowKgId(showKgId === s.id ? null : s.id)}
                            >
                              <Text style={styles.clickableWeight}>
                                {showKgId === s.id ? `${lbToKg(s.weight_lb)} kg` : `${s.weight_lb} lb`}
                              </Text>
                            </TouchableOpacity>{' '}
                            × <Text style={styles.boldText}>{s.reps} reps</Text>
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleDeleteSet(s.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <FontAwesome name="trash-o" size={18} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* If max sets reached, prevent adding another set */}
                  {isMaxSetsReached ? (
                    <View style={styles.maxSetsReachedBanner}>
                      <FontAwesome name="check-circle" size={22} color="#34C759" style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.maxSetsReachedTitle}>Target sets completed!</Text>
                        <Text style={styles.maxSetsReachedSubtitle}>
                          You've finished all {ex.target_sets} sets for this exercise. Delete a set above if you need to adjust.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Steppers for Reps & Weight */}
                      <View style={styles.stepperContainer}>
                        <Stepper
                          label="Reps"
                          value={currentReps}
                          onChange={setCurrentReps}
                          step={1}
                          min={1}
                        />
                        <Stepper
                          label="Weight (lb)"
                          value={currentWeight}
                          onChange={setCurrentWeight}
                          step={2.5}
                          min={0}
                        />
                      </View>

                      {/* Log button */}
                      <TouchableOpacity
                        style={styles.logButton}
                        onPress={() => handleLogSet(ex)}
                        activeOpacity={0.8}
                      >
                        <FontAwesome name="plus" size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.logButtonText}>
                          Log Set {exSets.length + 1} of {ex.target_sets} ({currentWeight} lb × {currentReps} reps)
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.newExerciseTrigger}
          onPress={() => {
            setEditingExercise(null);
            setExerciseModalVisible(true);
          }}
        >
          <FontAwesome name="plus-circle" size={18} color="#007AFF" style={{ marginRight: 8 }} />
          <Text style={styles.newExerciseTriggerText}>Add Another Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      <ExerciseModal
        visible={exerciseModalVisible}
        exercise={editingExercise}
        onClose={() => setExerciseModalVisible(false)}
        onSave={handleSaveExerciseModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  finishBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  exerciseCardActive: {
    borderColor: '#007AFF',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  targetInfo: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  completedBadgeText: {
    color: '#fff',
  },
  maxSetsReachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  maxSetsReachedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  maxSetsReachedSubtitle: {
    fontSize: 13,
    color: '#388E3C',
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
  },
  setMiniPill: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  setMiniPillText: {
    fontSize: 12,
    color: '#3A3A3C',
    fontWeight: '500',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    padding: 14,
    backgroundColor: '#FAFAFC',
  },
  badgeContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  badgeSubtitle: {
    fontSize: 12,
    color: '#388E3C',
    marginTop: 2,
  },
  badgeAccept: {
    backgroundColor: '#2E7D32',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  badgeAcceptText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  setsListContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  setRecordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
  },
  setRecordText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  boldText: {
    fontWeight: '700',
  },
  clickableWeight: {
    fontWeight: '700',
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  logButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  newExerciseTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#007AFF',
    borderRadius: 10,
    backgroundColor: '#F0F6FF',
    marginTop: 6,
  },
  newExerciseTriggerText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
