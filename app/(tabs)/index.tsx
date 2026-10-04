import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, Settings as SettingsIcon, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react-native';

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
import { ExerciseModal } from '../../src/components/ExerciseModal';
import { ExerciseActionModal } from '../../src/components/ExerciseActionModal';
import { FinishWorkoutModal } from '../../src/components/FinishWorkoutModal';
import { useTheme } from '../../src/theme/useTheme';
import {
  Screen,
  Text,
  Button,
  Badge,
  Stepper,
  SetRow,
} from '../../src/components/ui';

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
  const { colors, isDark, setThemeMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [sets, setSets] = useState<(SetRecord & { exercise_name: string })[]>([]);

  // Selected exercise for logging
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number>(45);
  const [currentReps, setCurrentReps] = useState<number>(4);
  const [suggestion, setSuggestion] = useState<ProgressionSuggestion | null>(null);

  // Exercise modal
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [actionModalExercise, setActionModalExercise] = useState<Exercise | null>(null);
  const [finishModalVisible, setFinishModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await ensurePresetExercises(db);
      const exList = await getExercises(db);

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
      setSelectedExerciseId(null);
      setSuggestion(null);
      return;
    }

    setSelectedExerciseId(ex.id);

    try {
      const history = await getLastSessionSetsForExercise(db, ex.id, session?.id);
      const sug = suggestNext(ex, history);

      let baseWeight = 45;
      if (history.length > 0) {
        baseWeight = history[history.length - 1].weight_lb;
      } else if (ex.default_weight_lb != null) {
        baseWeight = ex.default_weight_lb;
      }

      setCurrentWeight(baseWeight);

      if (sug.shouldIncrease && baseWeight < sug.suggestedWeightLb) {
        setSuggestion(sug);
      } else {
        setSuggestion(null);
      }

      setCurrentReps(Math.min(ex.rep_max, Math.max(1, ex.rep_min || 4)));
    } catch (e) {
      console.error('Error getting history for exercise:', e);
    }
  };

  const handleAcceptSuggestion = async (ex: Exercise, suggestedWeight: number) => {
    setCurrentWeight(suggestedWeight);
    setSuggestion(null);

    await updateExerciseDefaultWeight(db, ex.id, suggestedWeight);
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

      if (exerciseSets.length >= ex.target_sets) {
        Alert.alert(
          'Target Reached',
          `You have reached the maximum target of ${ex.target_sets} sets for ${ex.name}.`
        );
        return;
      }

      let currentSession = session;
      if (!currentSession) {
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

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const updatedSets = await getSetsForSession(db, currentSession.id);
      setSets(updatedSets);

      await updateExerciseDefaultWeight(db, ex.id, currentWeight);
      setExercises((prev) =>
        prev.map((item) =>
          item.id === ex.id ? { ...item, default_weight_lb: currentWeight } : item
        )
      );

      setCurrentReps(Math.min(ex.rep_max, Math.max(1, ex.rep_min || 4)));
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
    setFinishModalVisible(true);
  };

  const handleConfirmFinish = async () => {
    if (!session) return;
    await finishSession(db, session.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSession(null);
    setSets([]);
    setSelectedExerciseId(null);
    setFinishModalVisible(false);
  };

  const handleExerciseLongPress = (ex: Exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActionModalExercise(ex);
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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  const headerRight = (
    <View style={styles.headerActions}>
      {session && sets.length > 0 && (
        <Pressable
          onPress={handleFinishWorkout}
          hitSlop={8}
          style={[styles.finishHeaderBtn, { borderColor: colors.accent, backgroundColor: colors.accentTint }]}
        >
          <Text variant="micro" color="accent">
            FINISH
          </Text>
        </Pressable>
      )}
      <Pressable
        onPress={() => {
          setEditingExercise(null);
          setExerciseModalVisible(true);
        }}
        hitSlop={8}
        style={styles.iconBtn}
      >
        <Plus size={20} color={colors.text} strokeWidth={1.75} />
      </Pressable>
      <Pressable
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {
            // ignore
          }
          setThemeMode(isDark ? 'light' : 'dark');
        }}
        hitSlop={8}
        style={styles.iconBtn}
      >
        {isDark ? (
          <Sun size={20} color={colors.textMuted} strokeWidth={1.75} />
        ) : (
          <Moon size={20} color={colors.textMuted} strokeWidth={1.75} />
        )}
      </Pressable>
      <Pressable
        onPress={() => router.push('/(tabs)/settings')}
        hitSlop={8}
        style={styles.iconBtn}
      >
        <SettingsIcon size={20} color={colors.textMuted} strokeWidth={1.75} />
      </Pressable>
    </View>
  );

  const sessionSubtitle = sets.length > 0
    ? `${sets.length} SET${sets.length > 1 ? 'S' : ''} TODAY`
    : undefined;

  return (
    <Screen
      title="LOG"
      subtitle={sessionSubtitle}
      headerRight={headerRight}
      contentContainerStyle={styles.screenContent}
    >
      {/* Exercise Ticket List */}
      <View style={[styles.listContainer, { borderColor: colors.outline }]}>
        {exercises.map((ex, index) => {
          const isExpanded = selectedExerciseId === ex.id;
          const exSets = sets.filter((s) => s.exercise_id === ex.id);
          const isMaxSetsReached = exSets.length >= ex.target_sets;
          const hasOverload = suggestion?.shouldIncrease && isExpanded;

          return (
            <View
              key={ex.id}
              style={[
                styles.exerciseItem,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.outline,
                  borderBottomWidth: index === exercises.length - 1 && !isExpanded ? 0 : 1,
                },
              ]}
            >
              {/* Exercise Header Row */}
              <Pressable
                onPress={() => handleSelectExercise(ex)}
                onLongPress={() => handleExerciseLongPress(ex)}
                delayLongPress={350}
                style={[
                  styles.exerciseHeaderRow,
                  isExpanded && { backgroundColor: colors.raised },
                ]}
              >
                <View style={styles.exerciseHeaderLeft}>
                  <Text variant="title" color="primary">
                    {ex.name}
                  </Text>
                  <Text variant="label" color="muted">
                    {ex.target_sets} × {ex.rep_min}-{ex.rep_max} REPS
                  </Text>
                </View>

                <View style={styles.exerciseHeaderRight}>
                  {exSets.length > 0 && (
                    <Badge
                      label={isMaxSetsReached ? 'DONE' : `${exSets.length}/${ex.target_sets}`}
                      variant={isMaxSetsReached ? 'overload' : 'neutral'}
                    />
                  )}
                  {isExpanded ? (
                    <ChevronUp size={18} color={colors.text} strokeWidth={1.75} />
                  ) : (
                    <ChevronDown size={18} color={colors.textMuted} strokeWidth={1.75} />
                  )}
                </View>
              </Pressable>



              {/* Expanded Ticket View */}
              {isExpanded && (
                <View style={[styles.expandedTicket, { backgroundColor: colors.surface }]}>
                  {/* Overload badge banner */}
                  {hasOverload && (
                    <Pressable
                      onPress={() => handleAcceptSuggestion(ex, suggestion.suggestedWeightLb)}
                      style={[
                        styles.overloadBanner,
                        { backgroundColor: colors.accentTint, borderColor: colors.accent },
                      ]}
                    >
                      <Badge
                        label={`READY +${ex.increment_lb} LB → ${suggestion.suggestedWeightLb} LB`}
                        variant="overload"
                      />
                      <Text variant="micro" color="accent" style={styles.tapToAccept}>
                        TAP TO APPLY
                      </Text>
                    </Pressable>
                  )}

                  {/* Steppers: Weight and Reps */}
                  <View style={styles.stepperContainer}>
                    <Stepper
                      label="WEIGHT"
                      unit="LB"
                      value={currentWeight}
                      onChange={setCurrentWeight}
                      step={ex.increment_lb}
                      min={0}
                    />
                    <Stepper
                      label="REPS"
                      value={currentReps}
                      onChange={setCurrentReps}
                      step={1}
                      min={1}
                      max={ex.rep_max}
                    />
                  </View>

                  {/* Single Primary Action: LOG SET */}
                  <Button
                    label="LOG SET"
                    variant="primary"
                    onPress={() => handleLogSet(ex)}
                    disabled={isMaxSetsReached}
                    style={styles.logSetButton}
                  />

                  {/* Logged sets table for today */}
                  {exSets.length > 0 && (
                    <View style={styles.setsTable}>
                      {/* Table Column Headers */}
                      <View style={[styles.tableHeader, { borderBottomColor: colors.outline }]}>
                        <Text variant="label" color="muted" style={styles.thSet}>
                          SET
                        </Text>
                        <Text variant="label" color="muted" style={styles.thWeight}>
                          WEIGHT LB
                        </Text>
                        <Text variant="label" color="muted" style={styles.thReps}>
                          REPS
                        </Text>
                        <View style={styles.thAction} />
                      </View>

                      {exSets.map((s, i) => (
                        <SetRow
                          key={s.id}
                          index={i + 1}
                          weight={s.weight_lb}
                          reps={s.reps}
                          onDelete={() => handleDeleteSet(s.id)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <ExerciseModal
        visible={exerciseModalVisible}
        exercise={editingExercise}
        onClose={() => {
          setExerciseModalVisible(false);
          setEditingExercise(null);
        }}
        onSave={handleSaveExerciseModal}
      />

      <ExerciseActionModal
        visible={actionModalExercise !== null}
        exercise={actionModalExercise}
        onClose={() => setActionModalExercise(null)}
        onEdit={(ex) => {
          setActionModalExercise(null);
          setEditingExercise(ex);
          setExerciseModalVisible(true);
        }}
        onDelete={async (ex) => {
          setActionModalExercise(null);
          await deleteExercise(db, ex.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (selectedExerciseId === ex.id) {
            setSelectedExerciseId(null);
          }
          loadData();
        }}
      />

      <FinishWorkoutModal
        visible={finishModalVisible}
        totalSets={sets.length}
        totalVolumeLb={sets.reduce((acc, s) => acc + s.weight_lb * s.reps, 0)}
        onClose={() => setFinishModalVisible(false)}
        onConfirm={handleConfirmFinish}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  finishHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 2,
  },
  iconBtn: {
    padding: 4,
  },
  listContainer: {
    borderWidth: 1,
    borderRadius: 0,
  },
  exerciseItem: {
    width: '100%',
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  exerciseHeaderLeft: {
    flex: 1,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  expandedTicket: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#DADAD3',
  },
  overloadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 2,
    padding: 8,
    marginBottom: 16,
  },
  tapToAccept: {
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  logSetButton: {
    marginBottom: 16,
  },
  setsTable: {
    width: '100%',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    height: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  thSet: {
    width: 48,
  },
  thWeight: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 16,
  },
  thReps: {
    width: 80,
    textAlign: 'right',
    paddingRight: 8,
  },
  thAction: {
    width: 44,
  },
});
