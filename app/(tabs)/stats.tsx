import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronUp, ChevronRight, Check } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';

import {
  getPastSessions,
  getStatsForExercise,
  getSessionSets,
  getExercisePRs,
  getLifetimeStats,
  getAllExercisesOverloadStatus,
} from '../../src/db/statsQueries';
import {
  Session,
  Exercise,
  SetRecord,
  WeeklyRepStat,
  DailyStat,
  TimeRange,
  ExercisePR,
  LifetimeStats,
  ExerciseOverloadStatus,
} from '../../src/db/types';
import { getExercises } from '../../src/db/queries';
import { useTheme } from '../../src/theme/useTheme';
import { Screen, Text, Badge, Rule } from '../../src/components/ui';

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '4W', value: '4W' },
  { label: '3M', value: '3M' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' },
];

interface GroupedSetItem {
  id: string;
  exercise_name: string;
  weight_lb: number;
  reps: number;
  setCount: number;
}

function groupSessionSets(sets: (SetRecord & { exercise_name: string })[]): GroupedSetItem[] {
  const exerciseOrder: number[] = [];
  const exerciseMap = new Map<
    number,
    {
      exercise_name: string;
      weightOrder: number[];
      weights: Map<number, { weight_lb: number; reps: number; setCount: number }>;
    }
  >();

  for (const set of sets) {
    if (!exerciseMap.has(set.exercise_id)) {
      exerciseOrder.push(set.exercise_id);
      exerciseMap.set(set.exercise_id, {
        exercise_name: set.exercise_name,
        weightOrder: [],
        weights: new Map(),
      });
    }

    const exEntry = exerciseMap.get(set.exercise_id)!;
    if (!exEntry.weights.has(set.weight_lb)) {
      exEntry.weightOrder.push(set.weight_lb);
      exEntry.weights.set(set.weight_lb, {
        weight_lb: set.weight_lb,
        reps: set.reps,
        setCount: 1,
      });
    } else {
      const wEntry = exEntry.weights.get(set.weight_lb)!;
      wEntry.reps += set.reps;
      wEntry.setCount += 1;
    }
  }

  const result: GroupedSetItem[] = [];
  for (const exId of exerciseOrder) {
    const exEntry = exerciseMap.get(exId)!;
    for (const w of exEntry.weightOrder) {
      const wEntry = exEntry.weights.get(w)!;
      result.push({
        id: `grouped-${exId}-${w}`,
        exercise_name: exEntry.exercise_name,
        weight_lb: wEntry.weight_lb,
        reps: wEntry.reps,
        setCount: wEntry.setCount,
      });
    }
  }

  return result;
}

export default function StatsScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  const [viewMode, setViewMode] = useState<'overview' | 'charts' | 'history'>('overview');

  // Overview state
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null);
  const [prs, setPrs] = useState<ExercisePR[]>([]);
  const [overloadStatuses, setOverloadStatuses] = useState<ExerciseOverloadStatus[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // History state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<
    Record<number, (SetRecord & { exercise_name: string })[]>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null);

  // Charts state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedEx, setSelectedEx] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartData, setChartData] = useState<DailyStat[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyRepStat[]>([]);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const life = await getLifetimeStats(db);
      setLifetimeStats(life);

      const prList = await getExercisePRs(db);
      setPrs(prList);

      const overloadList = await getAllExercisesOverloadStatus(db);
      setOverloadStatuses(overloadList);
    } catch (e) {
      console.error('Error loading overview stats:', e);
    } finally {
      setLoadingOverview(false);
    }
  }, [db]);

  const loadHistory = useCallback(async () => {
    try {
      const past = await getPastSessions(db);
      setSessions(past);
    } catch (e) {
      console.error('Error loading history:', e);
    }
  }, [db]);

  const loadExercises = useCallback(async () => {
    try {
      const list = await getExercises(db);
      setExercises(list);
      if (list.length > 0) {
        const activeId =
          selectedEx && list.some((e) => e.id === selectedEx) ? selectedEx : list[0].id;
        if (selectedEx !== activeId) {
          setSelectedEx(activeId);
        }
        setLoadingChart(true);
        try {
          const stats = await getStatsForExercise(db, activeId, timeRange);
          setChartData(stats.daily);
          setWeeklyData(stats.weekly);
        } finally {
          setLoadingChart(false);
        }
      }
    } catch (e) {
      console.error('Error loading exercises and stats:', e);
    }
  }, [db, selectedEx, timeRange]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadAll = async () => {
        if (!isMounted) return;
        await loadOverview();
        if (!isMounted) return;
        await loadExercises();
        if (!isMounted) return;
        await loadHistory();
      };
      loadAll();
      return () => {
        isMounted = false;
      };
    }, [loadOverview, loadExercises, loadHistory])
  );

  const handleToggleSession = async (sessionId: number) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }

    setExpandedSessionId(sessionId);

    if (!sessionDetails[sessionId]) {
      setLoadingDetails(sessionId);
      try {
        const details = await getSessionSets(db, sessionId);
        setSessionDetails((prev) => ({ ...prev, [sessionId]: details }));
      } catch (e) {
        console.error('Error fetching session sets:', e);
      } finally {
        setLoadingDetails(null);
      }
    }
  };

  const selectedExerciseObj = exercises.find((e) => e.id === selectedEx);
  const targetSets = selectedExerciseObj?.target_sets ?? 3;
  const repMax = selectedExerciseObj?.rep_max ?? 10;
  const maxTargetReps = Math.max(1, targetSets * repMax);

  const chartWidth = Math.max(260, windowWidth - 64);

  // Map daily chart data for LineChart
  const e1rmLinePoints = chartData.map((d) => ({
    value: d.bestE1rm,
    label: d.date.slice(5),
  }));

  const weightLinePoints = chartData.map((d) => ({
    value: d.bestWeight,
    label: d.date.slice(5),
  }));

  // Map daily chart data for Rep Count BarChart
  const dailyRepBarData = chartData.map((d) => {
    const isOverload =
      d.totalReps >= maxTargetReps ||
      (d.setReps &&
        d.setReps.length >= targetSets &&
        d.setReps.slice(0, targetSets).every((r) => r >= repMax));

    return {
      value: Math.min(d.totalReps, maxTargetReps),
      actualReps: d.totalReps,
      label: d.date.slice(5),
      frontColor: isOverload ? colors.accent : colors.raised,
      topLabelComponent: () => (
        <Text
          style={{
            fontSize: 9,
            fontFamily: 'IBMPlexMono_600SemiBold',
            color: isOverload ? colors.accent : colors.textMuted,
            marginBottom: 2,
            textAlign: 'center',
          }}
        >
          {d.totalReps}
        </Text>
      ),
    };
  });

  const latestDaily = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const latestReps = latestDaily ? latestDaily.totalReps : 0;
  const latestIsOverload = latestDaily
    ? latestReps >= maxTargetReps ||
      (latestDaily.setReps &&
        latestDaily.setReps.length >= targetSets &&
        latestDaily.setReps.slice(0, targetSets).every((r) => r >= repMax))
    : false;
  const dailyRepSections = maxTargetReps % 4 === 0 ? 4 : maxTargetReps % 3 === 0 ? 3 : 2;

  // Map weekly data for BarChart
  const weeklyBarData = weeklyData.map((w) => ({
    value: w.totalReps,
    label: w.weekStart.slice(5),
    frontColor: w.hasWeightIncrease ? colors.accent : colors.raised,
  }));

  return (
    <Screen title="STATS">
      {/* Segmented View Mode Strip (0 radius, 1px outline) */}
      <View style={[styles.viewModeStrip, { borderColor: colors.outline }]}>
        <Pressable
          onPress={() => setViewMode('overview')}
          style={[
            styles.modeButton,
            {
              backgroundColor: viewMode === 'overview' ? colors.raised : colors.surface,
              borderRightWidth: 1,
              borderRightColor: colors.outline,
            },
          ]}
        >
          <Text
            variant="label"
            color={viewMode === 'overview' ? 'primary' : 'muted'}
          >
            OVERVIEW
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setViewMode('charts')}
          style={[
            styles.modeButton,
            {
              backgroundColor: viewMode === 'charts' ? colors.raised : colors.surface,
              borderRightWidth: 1,
              borderRightColor: colors.outline,
            },
          ]}
        >
          <Text
            variant="label"
            color={viewMode === 'charts' ? 'primary' : 'muted'}
          >
            CHARTS
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setViewMode('history')}
          style={[
            styles.modeButton,
            {
              backgroundColor: viewMode === 'history' ? colors.raised : colors.surface,
            },
          ]}
        >
          <Text
            variant="label"
            color={viewMode === 'history' ? 'primary' : 'muted'}
          >
            HISTORY
          </Text>
        </Pressable>
      </View>

      {/* OVERVIEW MODE */}
      {viewMode === 'overview' && (
        <View style={styles.tabContent}>
          {loadingOverview ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
          ) : (
            <>
              {/* Spec-sheet KPI Grid: Bordered cells */}
              <View style={[styles.kpiGrid, { borderColor: colors.outline }]}>
                <View style={[styles.kpiCell, { borderRightWidth: 1, borderRightColor: colors.outline }]}>
                  <Text variant="label" color="muted">
                    WORKOUTS
                  </Text>
                  <Text variant="numeral" color="primary" style={styles.kpiValue}>
                    {lifetimeStats?.totalWorkouts || 0}
                  </Text>
                </View>

                <View style={[styles.kpiCell, { borderRightWidth: 1, borderRightColor: colors.outline }]}>
                  <Text variant="label" color="muted">
                    VOLUME LB
                  </Text>
                  <Text variant="numeral" color="primary" style={styles.kpiValue}>
                    {lifetimeStats
                      ? lifetimeStats.totalVolumeLb >= 1000
                        ? `${(lifetimeStats.totalVolumeLb / 1000).toFixed(1)}K`
                        : lifetimeStats.totalVolumeLb
                      : 0}
                  </Text>
                </View>

                <View style={styles.kpiCell}>
                  <Text variant="label" color="muted">
                    TOTAL SETS
                  </Text>
                  <Text variant="numeral" color="primary" style={styles.kpiValue}>
                    {lifetimeStats?.totalSets || 0}
                  </Text>
                </View>
              </View>

              {/* Weekly Consistency Spec Box */}
              <View style={[styles.specBlock, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
                <View style={styles.specHeaderRow}>
                  <Text variant="label" color="primary">
                    WEEKLY CONSISTENCY
                  </Text>
                  <Badge
                    label={`${lifetimeStats?.currentStreakWeeks || 0} WK STREAK`}
                    variant="neutral"
                  />
                </View>
                <Text variant="micro" color="muted" style={styles.specSubtitle}>
                  GOAL: 3 SESSIONS / WEEK
                </Text>

                {/* Consistency Cells */}
                <View style={styles.consistencyPipsRow}>
                  {[1, 2, 3].map((num) => {
                    const isDone = (lifetimeStats?.workoutsThisWeek || 0) >= num;
                    return (
                      <View
                        key={num}
                        style={[
                          styles.consistencyCell,
                          {
                            borderColor: isDone ? colors.accent : colors.outline,
                            backgroundColor: isDone ? colors.accentTint : colors.raised,
                          },
                        ]}
                      >
                        {isDone ? (
                          <Check size={18} color={colors.accent} strokeWidth={2.5} />
                        ) : (
                          <Text variant="label" color="muted">
                            {num}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Progression Radar */}
              <View style={[styles.specBlock, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
                <View style={styles.specHeaderRow}>
                  <Text variant="label" color="primary">
                    PROGRESSION RADAR
                  </Text>
                  <Text variant="micro" color="muted">
                    DOUBLE PROGRESSION
                  </Text>
                </View>

                <View style={styles.radarList}>
                  {overloadStatuses.map((item, idx) => (
                    <View
                      key={item.exerciseId}
                      style={[
                        styles.radarRow,
                        {
                          borderBottomColor: colors.outline,
                          borderBottomWidth: idx === overloadStatuses.length - 1 ? 0 : 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="title" color="primary">
                          {item.exerciseName}
                        </Text>
                        <Text variant="label" color="muted">
                          {item.currentWeightLb} LB · {item.targetSets}×{item.repMax} REPS
                        </Text>
                      </View>

                      {item.isReadyForIncrease ? (
                        <Badge
                          label={`READY +${item.suggestedWeightLb - item.currentWeightLb} LB`}
                          variant="overload"
                        />
                      ) : (
                        <Badge label="IN PROGRESS" variant="neutral" />
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* PR Spec Sheet */}
              <View style={[styles.specBlock, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
                <View style={styles.specHeaderRow}>
                  <Text variant="label" color="primary">
                    PERSONAL RECORDS
                  </Text>
                </View>

                <View style={styles.prList}>
                  {prs.map((pr, idx) => (
                    <View
                      key={pr.exerciseId}
                      style={[
                        styles.prRow,
                        {
                          borderBottomColor: colors.outline,
                          borderBottomWidth: idx === prs.length - 1 ? 0 : 1,
                        },
                      ]}
                    >
                      <View style={styles.prHeader}>
                        <Text variant="title" color="primary">
                          {pr.exerciseName}
                        </Text>
                        <Badge label="PR" variant="pr" />
                      </View>

                      <View style={styles.prGridRow}>
                        <View style={styles.prMetric}>
                          <Text variant="micro" color="muted">
                            MAX WEIGHT
                          </Text>
                          <Text
                            variant="numeral"
                            color="primary"
                            style={styles.prMetricValue}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {pr.heaviestWeightLb} LB
                          </Text>
                        </View>
                        <View style={styles.prMetric}>
                          <Text variant="micro" color="muted">
                            EST. 1RM
                          </Text>
                          <Text
                            variant="numeral"
                            color="primary"
                            style={styles.prMetricValue}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {pr.bestE1rm} LB
                          </Text>
                        </View>
                        <View style={styles.prMetric}>
                          <Text variant="micro" color="muted">
                            MAX VOLUME
                          </Text>
                          <Text
                            variant="numeral"
                            color="primary"
                            style={styles.prMetricValue}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {pr.maxSessionVolume} LB
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* CHARTS MODE */}
      {viewMode === 'charts' && (
        <View style={styles.tabContent}>
          {/* Exercise Picker Segment */}
          <Pressable
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            style={[
              styles.exerciseDropdownBtn,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <View>
              <Text variant="micro" color="muted">
                EXERCISE
              </Text>
              <Text variant="title" color="primary">
                {selectedExerciseObj?.name || 'SELECT EXERCISE'}
              </Text>
            </View>
            {isDropdownOpen ? (
              <ChevronUp size={18} color={colors.text} strokeWidth={1.75} />
            ) : (
              <ChevronDown size={18} color={colors.text} strokeWidth={1.75} />
            )}
          </Pressable>

          {isDropdownOpen && (
            <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              {exercises.map((ex, idx) => (
                <Pressable
                  key={ex.id}
                  onPress={() => {
                    setSelectedEx(ex.id);
                    setIsDropdownOpen(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    {
                      backgroundColor: selectedEx === ex.id ? colors.raised : colors.surface,
                      borderBottomColor: colors.outline,
                      borderBottomWidth: idx === exercises.length - 1 ? 0 : 1,
                    },
                  ]}
                >
                  <Text
                    variant="label"
                    color={selectedEx === ex.id ? 'accent' : 'primary'}
                  >
                    {ex.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Time Range Strip: [ 4W ] [ 3M ] [ 1Y ] [ ALL ] */}
          <View style={[styles.timeRangeStrip, { borderColor: colors.outline }]}>
            {TIME_RANGES.map((tr, idx) => {
              const isSelected = timeRange === tr.value;
              return (
                <Pressable
                  key={tr.value}
                  onPress={() => setTimeRange(tr.value)}
                  style={[
                    styles.rangeButton,
                    {
                      backgroundColor: isSelected ? colors.raised : colors.surface,
                      borderRightColor: colors.outline,
                      borderRightWidth: idx === TIME_RANGES.length - 1 ? 0 : 1,
                    },
                  ]}
                >
                  <Text
                    variant="label"
                    color={isSelected ? 'accent' : 'muted'}
                  >
                    {tr.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {loadingChart ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 24 }} />
          ) : chartData.length === 0 ? (
            <View style={[styles.emptyChartBox, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
              <Text variant="label" color="muted">
                NO WORKOUT DATA RECORDED FOR THIS PERIOD.
              </Text>
            </View>
          ) : (
            <>
              {/* E1RM and Weight Progress Line Chart */}
              <View style={[styles.chartCard, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
                <View style={styles.chartTitleRow}>
                  <Text variant="label" color="primary">
                    EST. 1RM & TOP WEIGHT (LB)
                  </Text>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendBox, { backgroundColor: colors.accent }]} />
                    <Text variant="micro" color="muted">
                      1RM
                    </Text>
                    <View style={[styles.legendBox, { backgroundColor: colors.textMuted }]} />
                    <Text variant="micro" color="muted">
                      TOP
                    </Text>
                  </View>
                </View>

                <LineChart
                  data={e1rmLinePoints}
                  data2={weightLinePoints}
                  width={chartWidth}
                  height={180}
                  color={colors.accent}
                  color2={colors.textMuted}
                  thickness={2}
                  thickness2={2}
                  dataPointsColor={colors.accent}
                  dataPointsColor2={colors.textMuted}
                  dataPointsRadius={3}
                  dataPointsRadius2={3}
                  dataPointsShape="rectangular"
                  dataPointsShape2="rectangular"
                  rulesColor={colors.outline}
                  rulesType="solid"
                  xAxisColor={colors.outline}
                  yAxisColor={colors.outline}
                  xAxisLabelTextStyle={{
                    color: colors.textMuted,
                    fontSize: 10,
                    fontFamily: 'IBMPlexMono_500Medium',
                  }}
                  yAxisTextStyle={{
                    color: colors.textMuted,
                    fontSize: 10,
                    fontFamily: 'IBMPlexMono_500Medium',
                  }}
                  hideRules={false}
                  initialSpacing={12}
                  endSpacing={12}
                />
              </View>

              {/* Daily Session Reps Bar Chart and Rep Count Counter */}
              {dailyRepBarData.length > 0 && (
                <View style={[styles.chartCard, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
                  <View style={styles.chartTitleRow}>
                    <View>
                      <Text variant="label" color="primary">
                        SESSION REPS (PER DAY)
                      </Text>
                      <Text variant="micro" color="muted" style={{ marginTop: 2 }}>
                        TARGET: {maxTargetReps} REPS ({targetSets} SETS × {repMax} MAX)
                      </Text>
                    </View>
                    <Badge
                      label={latestIsOverload ? 'OVERLOAD ACHIEVED' : `${latestReps}/${maxTargetReps} REPS`}
                      variant={latestIsOverload ? 'overload' : 'neutral'}
                    />
                  </View>

                  {/* Latest Session Counter Meter */}
                  {latestDaily && (
                    <View style={[styles.counterContainer, { borderColor: colors.outline, backgroundColor: colors.background }]}>
                      <View style={styles.counterRow}>
                        <Text variant="micro" color="muted">
                          LATEST ({latestDaily.date.slice(5)})
                        </Text>
                        <Text
                          variant="micro"
                          color={latestIsOverload ? 'accent' : 'muted'}
                          style={{ fontFamily: 'IBMPlexMono_600SemiBold' }}
                        >
                          {latestIsOverload
                            ? `OVERLOAD READY (+${selectedExerciseObj?.increment_lb ?? 5} LB NEXT)`
                            : `${Math.max(0, maxTargetReps - latestReps)} REPS TO OVERLOAD`}
                        </Text>
                      </View>

                      <View style={[styles.counterBarTrack, { backgroundColor: colors.raised, borderColor: colors.outline }]}>
                        <View
                          style={[
                            styles.counterBarFill,
                            {
                              width: `${Math.min(100, Math.round((latestReps / maxTargetReps) * 100))}%`,
                              backgroundColor: latestIsOverload ? colors.accent : colors.textMuted,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.counterRow}>
                        <Text variant="title" color={latestIsOverload ? 'accent' : 'primary'}>
                          {latestReps}{' '}
                          <Text variant="micro" color="muted">
                            / {maxTargetReps} REPS
                          </Text>
                        </Text>
                        <Text variant="micro" color="muted">
                          {Math.min(100, Math.round((latestReps / maxTargetReps) * 100))}% CAPACITY
                        </Text>
                      </View>
                    </View>
                  )}

                  <BarChart
                    data={dailyRepBarData}
                    width={chartWidth}
                    height={160}
                    barWidth={18}
                    spacing={14}
                    roundedTop={false}
                    roundedBottom={false}
                    rulesColor={colors.outline}
                    xAxisColor={colors.outline}
                    yAxisColor={colors.outline}
                    maxValue={maxTargetReps}
                    noOfSections={dailyRepSections}
                    showReferenceLine1={true}
                    referenceLine1Position={maxTargetReps}
                    referenceLine1Config={{
                      color: colors.accent,
                      dashWidth: 4,
                      dashGap: 4,
                      thickness: 1,
                    }}
                    xAxisLabelTextStyle={{
                      color: colors.textMuted,
                      fontSize: 10,
                      fontFamily: 'IBMPlexMono_500Medium',
                      transform: [{ rotate: '-45deg' }],
                      width: 44,
                      marginLeft: -8,
                    }}
                    labelsExtraHeight={24}
                    labelsDistanceFromXaxis={8}
                    yAxisTextStyle={{
                      color: colors.textMuted,
                      fontSize: 10,
                      fontFamily: 'IBMPlexMono_500Medium',
                    }}
                    initialSpacing={10}
                  />
                </View>
              )}

              {/* Weekly Rep Volume Bar Chart */}
              {weeklyBarData.length > 0 && (
                <View style={[styles.chartCard, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
                  <View style={styles.chartTitleRow}>
                    <Text variant="label" color="primary">
                      WEEKLY TOTAL REPS
                    </Text>
                    <Badge label="GREEN = OVERLOAD" variant="neutral" />
                  </View>

                  <BarChart
                    data={weeklyBarData}
                    width={chartWidth}
                    height={160}
                    barWidth={18}
                    spacing={14}
                    roundedTop={false}
                    roundedBottom={false}
                    rulesColor={colors.outline}
                    xAxisColor={colors.outline}
                    yAxisColor={colors.outline}
                    xAxisLabelTextStyle={{
                      color: colors.textMuted,
                      fontSize: 10,
                      fontFamily: 'IBMPlexMono_500Medium',
                      transform: [{ rotate: '-45deg' }],
                      width: 44,
                      marginLeft: -8,
                    }}
                    labelsExtraHeight={24}
                    labelsDistanceFromXaxis={8}
                    yAxisTextStyle={{
                      color: colors.textMuted,
                      fontSize: 10,
                      fontFamily: 'IBMPlexMono_500Medium',
                    }}
                    initialSpacing={10}
                  />
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* HISTORY MODE */}
      {viewMode === 'history' && (
        <View style={styles.tabContent}>
          {sessions.length === 0 ? (
            <View style={[styles.emptyChartBox, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
              <Text variant="label" color="muted">
                NO PAST SESSIONS LOGGED YET.
              </Text>
            </View>
          ) : (
            <View style={[styles.historyContainer, { borderColor: colors.outline }]}>
              {sessions.map((sess, idx) => {
                const isExpanded = expandedSessionId === sess.id;
                const details = sessionDetails[sess.id] || [];
                const isLoading = loadingDetails === sess.id;

                const dateStr = new Date(sess.started_at).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <View
                    key={sess.id}
                    style={[
                      styles.historyItem,
                      {
                        backgroundColor: colors.surface,
                        borderBottomColor: colors.outline,
                        borderBottomWidth: idx === sessions.length - 1 && !isExpanded ? 0 : 1,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => handleToggleSession(sess.id)}
                      style={[
                        styles.historyHeaderRow,
                        isExpanded && { backgroundColor: colors.raised },
                      ]}
                    >
                      <View>
                        <Text variant="label" color="muted">
                          {dateStr}
                        </Text>
                        <Text variant="title" color="primary">
                          SESSION {sess.id.toString().padStart(2, '0')}
                        </Text>
                      </View>

                      {isExpanded ? (
                        <ChevronUp size={18} color={colors.text} strokeWidth={1.75} />
                      ) : (
                        <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.75} />
                      )}
                    </Pressable>

                    {isExpanded && (
                      <View style={[styles.historyDetails, { backgroundColor: colors.surface }]}>
                        <Rule variant="dashed" style={{ marginBottom: 12 }} />

                        {isLoading ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : details.length === 0 ? (
                          <Text variant="label" color="muted">
                            NO SETS RECORDED.
                          </Text>
                        ) : (
                          <View style={styles.historySetsTable}>
                            <View style={[styles.tableHeader, { borderBottomColor: colors.outline }]}>
                              <Text variant="label" color="muted" style={{ width: 120 }}>
                                EXERCISE
                              </Text>
                              <Text variant="label" color="muted" style={{ flex: 1, textAlign: 'right', paddingRight: 16 }}>
                                WEIGHT
                              </Text>
                              <Text variant="label" color="muted" style={{ width: 60, textAlign: 'right' }}>
                                REPS
                              </Text>
                            </View>

                            {groupSessionSets(details).map((s, sIdx, arr) => (
                              <View
                                key={s.id}
                                style={[
                                  styles.historySetRow,
                                  {
                                    borderBottomColor: colors.outline,
                                    borderBottomWidth: sIdx === arr.length - 1 ? 0 : 1,
                                  },
                                ]}
                              >
                                <Text variant="label" color="primary" style={{ width: 120 }} numberOfLines={1}>
                                  {s.exercise_name}
                                </Text>
                                <Text variant="numeral" color="primary" style={{ flex: 1, textAlign: 'right', paddingRight: 16 }}>
                                  {s.weight_lb} LB
                                </Text>
                                <Text variant="numeral" color="primary" style={{ width: 60, textAlign: 'right' }}>
                                  {s.reps}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  viewModeStrip: {
    flexDirection: 'row',
    height: 44,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    width: '100%',
  },
  kpiGrid: {
    flexDirection: 'row',
    height: 72,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 16,
  },
  kpiCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  kpiValue: {
    marginTop: 2,
  },
  specBlock: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
  },
  specHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specSubtitle: {
    marginBottom: 12,
  },
  consistencyPipsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  consistencyCell: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarList: {
    marginTop: 8,
  },
  radarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  prList: {
    marginTop: 8,
  },
  prRow: {
    paddingVertical: 12,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  prMetric: {
    flex: 1,
  },
  prMetricValue: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 4,
  },
  exerciseDropdownBtn: {
    height: 52,
    borderWidth: 1,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 12,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  timeRangeStrip: {
    flexDirection: 'row',
    height: 40,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 16,
  },
  rangeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartBox: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 8,
    height: 8,
    borderRadius: 0,
  },
  counterContainer: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 12,
    marginBottom: 16,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterBarTrack: {
    height: 6,
    width: '100%',
    borderWidth: 1,
    marginVertical: 8,
    borderRadius: 0,
    overflow: 'hidden',
  },
  counterBarFill: {
    height: '100%',
  },
  historyContainer: {
    borderWidth: 1,
    borderRadius: 0,
  },
  historyItem: {
    width: '100%',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  historyDetails: {
    padding: 14,
  },
  historySetsTable: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    borderBottomWidth: 1,
  },
  historySetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
});
