import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { getPastSessions, getStatsForExercise, getSessionSets } from '../../src/db/statsQueries';
import { Session, Exercise, SetRecord, WeeklyRepStat } from '../../src/db/types';
import { getExercises } from '../../src/db/queries';
import { LineChart, BarChart } from 'react-native-gifted-charts';

export default function StatsScreen() {
  const db = useSQLiteContext();
  const { width: windowWidth } = useWindowDimensions();
  const [viewMode, setViewMode] = useState<'history' | 'charts'>('history');

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
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartData, setChartData] = useState<
    { date: string; volume: number; bestE1rm: number; bestWeight: number }[]
  >([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyRepStat[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyRepStat | null>(null);

  const loadHistory = useCallback(async () => {
    const past = await getPastSessions(db);
    setSessions(past);
  }, [db]);

  const loadExercises = useCallback(async () => {
    const list = await getExercises(db);
    setExercises(list);
    if (list.length > 0) {
      if (selectedEx === null || !list.some((e) => e.id === selectedEx)) {
        setSelectedEx(list[0].id);
        setLoadingChart(true);
        try {
          const stats = await getStatsForExercise(db, list[0].id);
          setChartData(stats.daily);
          setWeeklyData(stats.weekly);
          setSelectedWeek(null);
        } finally {
          setLoadingChart(false);
        }
      }
    }
  }, [db, selectedEx]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      loadExercises();
    }, [loadHistory, loadExercises])
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

  const handleSelectExercise = async (id: number) => {
    setSelectedEx(id);
    setLoadingChart(true);
    setSelectedWeek(null);
    try {
      const stats = await getStatsForExercise(db, id);
      setChartData(stats.daily);
      setWeeklyData(stats.weekly);
    } catch (e) {
      console.error('Error fetching stats for exercise:', e);
    } finally {
      setLoadingChart(false);
    }
  };

  const formatSessionDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatSessionTime = (startedAt: string, endedAt: string | null) => {
    const start = new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!endedAt) return `Started at ${start} (In progress)`;
    const end = new Date(endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'history' && styles.toggleBtnActive]}
          onPress={() => setViewMode('history')}
        >
          <Text style={[styles.toggleText, viewMode === 'history' && styles.toggleTextActive]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'charts' && styles.toggleBtnActive]}
          onPress={() => setViewMode('charts')}
        >
          <Text style={[styles.toggleText, viewMode === 'charts' && styles.toggleTextActive]}>
            Charts
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'history' ? (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.historyList}
          renderItem={({ item }) => {
            const isExpanded = expandedSessionId === item.id;
            const sets = sessionDetails[item.id] || [];

            // Group sets by exercise
            const groupedByExercise = sets.reduce((acc, set) => {
              if (!acc[set.exercise_id]) {
                acc[set.exercise_id] = {
                  name: set.exercise_name,
                  sets: [],
                };
              }
              acc[set.exercise_id].sets.push(set);
              return acc;
            }, {} as Record<number, { name: string; sets: (SetRecord & { exercise_name: string })[] }>);

            const exerciseGroups = Object.values(groupedByExercise);
            const totalVolume = sets.reduce((sum, s) => sum + s.weight_lb * s.reps, 0);

            return (
              <View style={[styles.historyCard, isExpanded && styles.historyCardActive]}>
                <TouchableOpacity
                  style={styles.historyCardHeader}
                  onPress={() => handleToggleSession(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{formatSessionDate(item.started_at)}</Text>
                    <Text style={styles.historySub}>
                      {formatSessionTime(item.started_at, item.ended_at)}
                    </Text>
                  </View>

                  <View style={styles.headerRightRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        item.ended_at ? styles.statusCompleted : styles.statusInProgress,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.ended_at
                            ? styles.statusCompletedText
                            : styles.statusInProgressText,
                        ]}
                      >
                        {item.ended_at ? 'Done' : 'Active'}
                      </Text>
                    </View>
                    <FontAwesome
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={15}
                      color="#8E8E93"
                      style={{ marginLeft: 10 }}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded exercises breakdown */}
                {isExpanded && (
                  <View style={styles.historyCardBody}>
                    {loadingDetails === item.id ? (
                      <View style={styles.detailsLoading}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.detailsLoadingText}>Loading workout details...</Text>
                      </View>
                    ) : exerciseGroups.length === 0 ? (
                      <Text style={styles.noExercisesText}>No exercises recorded in this session.</Text>
                    ) : (
                      <>
                        <View style={styles.summaryBar}>
                          <Text style={styles.summaryBarItem}>
                            <Text style={styles.summaryBold}>{exerciseGroups.length}</Text> Exercises
                          </Text>
                          <Text style={styles.summaryDivider}>•</Text>
                          <Text style={styles.summaryBarItem}>
                            <Text style={styles.summaryBold}>{sets.length}</Text> Sets
                          </Text>
                          <Text style={styles.summaryDivider}>•</Text>
                          <Text style={styles.summaryBarItem}>
                            <Text style={styles.summaryBold}>{Math.round(totalVolume)}</Text> lb Volume
                          </Text>
                        </View>

                        {exerciseGroups.map((group) => {
                          const groupVolume = group.sets.reduce(
                            (v, s) => v + s.weight_lb * s.reps,
                            0
                          );
                          const maxWeight = Math.max(...group.sets.map((s) => s.weight_lb));

                          return (
                            <View key={group.name} style={styles.exerciseSection}>
                              <View style={styles.exerciseSectionHeader}>
                                <Text style={styles.exerciseSectionTitle}>{group.name}</Text>
                                <Text style={styles.exerciseSectionSubtitle}>
                                  Top: {maxWeight} lb • Vol: {Math.round(groupVolume)} lb
                                </Text>
                              </View>

                              <View style={styles.setsGrid}>
                                {group.sets.map((s, idx) => (
                                  <View key={s.id} style={styles.setPill}>
                                    <Text style={styles.setPillIndex}>Set {idx + 1}</Text>
                                    <Text style={styles.setPillValue}>
                                      {s.weight_lb} lb × {s.reps}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          );
                        })}
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="calendar-o" size={40} color="#C7C7CC" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Workouts Yet</Text>
              <Text style={styles.emptySubtitle}>
                Completed workout sessions with logged sets will appear here.
              </Text>
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Exercise Dropdown */}
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsDropdownOpen((prev) => !prev)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownLeft}>
                <View style={styles.dropdownIconContainer}>
                  <FontAwesome name="bar-chart" size={13} color="#007AFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownLabel}>Exercise</Text>
                  <Text style={styles.dropdownSelectedText} numberOfLines={1}>
                    {exercises.find((e) => e.id === selectedEx)?.name ||
                      (exercises.length > 0 ? 'Select Exercise' : 'No Exercises')}
                  </Text>
                </View>
              </View>
              <FontAwesome
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#8E8E93"
              />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled bounces={false}>
                  {exercises.map((ex, index) => {
                    const isSelected = selectedEx === ex.id;
                    return (
                      <TouchableOpacity
                        key={ex.id}
                        style={[
                          styles.dropdownOption,
                          isSelected && styles.dropdownOptionActive,
                          index === exercises.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => {
                          handleSelectExercise(ex.id);
                          setIsDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            isSelected && styles.dropdownOptionTextActive,
                          ]}
                        >
                          {ex.name}
                        </Text>
                        {isSelected && (
                          <FontAwesome name="check" size={14} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.chartScroll}
            onScrollBeginDrag={() => {
              if (isDropdownOpen) setIsDropdownOpen(false);
            }}
          >
            {loadingChart ? (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.chartLoadingText}>Loading stats...</Text>
              </View>
            ) : weeklyData.length > 0 || chartData.length > 0 ? (
              <>
                {/* 1. Weekly Total Reps Bar Graph */}
                <View style={styles.chartHeaderBlock}>
                  <Text style={styles.chartTitle}>Weekly Total Reps</Text>
                  <Text style={styles.chartSubtitle}>
                    Total reps completed per week. Bar color changes when weight increased.
                  </Text>

                  {/* Legend */}
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendIndicator, { backgroundColor: '#007AFF' }]} />
                      <Text style={styles.legendText}>Standard Week</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendIndicator, { backgroundColor: '#34C759' }]} />
                      <Text style={styles.legendText}>Weight Increased (+lb)</Text>
                    </View>
                  </View>
                </View>

                {weeklyData.length > 0 ? (
                  <View style={styles.barChartContainer}>
                    <BarChart
                      data={weeklyData.map((w) => {
                        const isSelected = selectedWeek?.weekStart === w.weekStart;
                        return {
                          value: w.totalReps,
                          label: w.label,
                          frontColor: w.hasWeightIncrease ? '#34C759' : '#007AFF',
                          onPress: () => setSelectedWeek(isSelected ? null : w),
                          topLabelComponent: () => (
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: w.hasWeightIncrease ? '#2E7D32' : '#007AFF',
                                marginBottom: 2,
                              }}
                            >
                              {w.totalReps}
                            </Text>
                          ),
                        };
                      })}
                      width={Math.max(280, windowWidth - 70)}
                      height={190}
                      barWidth={Math.min(
                        32,
                        Math.max(
                          22,
                          Math.floor((Math.max(280, windowWidth - 70) - 70) / Math.max(1, weeklyData.length * 1.5))
                        )
                      )}
                      spacing={Math.min(
                        24,
                        Math.max(
                          12,
                          Math.floor((Math.max(280, windowWidth - 70) - 70) / Math.max(1, weeklyData.length * 2))
                        )
                      )}
                      initialSpacing={16}
                      roundedTop
                      roundedBottom={false}
                      xAxisThickness={1}
                      xAxisColor="#E5E5EA"
                      yAxisThickness={1}
                      yAxisColor="#E5E5EA"
                      yAxisTextStyle={{ color: '#8E8E93', fontSize: 11 }}
                      xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 11 }}
                      noOfSections={4}
                      rulesColor="#F2F2F7"
                      isAnimated
                      animationDuration={400}
                    />

                    {selectedWeek && (
                      <View style={styles.weekDetailCard}>
                        <View style={styles.weekDetailHeader}>
                          <Text style={styles.weekDetailTitle}>
                            Week of {selectedWeek.label}
                          </Text>
                          {selectedWeek.hasWeightIncrease ? (
                            <View style={styles.increaseBadge}>
                              <FontAwesome name="arrow-up" size={10} color="#2E7D32" />
                              <Text style={styles.increaseBadgeText}>Weight Increased</Text>
                            </View>
                          ) : (
                            <View style={styles.standardBadge}>
                              <Text style={styles.standardBadgeText}>Standard</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.weekDetailText}>
                          Total Reps: <Text style={styles.bold}>{selectedWeek.totalReps}</Text> • Peak Weight: <Text style={styles.bold}>{selectedWeek.maxWeight} lb</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.chartNoData}>No weekly sets recorded yet.</Text>
                )}

                {/* 2. Estimated 1RM */}
                {chartData.length > 0 && (
                  <>
                    <Text style={[styles.chartTitle, { marginTop: 36 }]}>Estimated 1RM (lb)</Text>
                    <LineChart
                      data={chartData.map((d) => ({
                        value: d.bestE1rm,
                        label: d.date.slice(5),
                      }))}
                      width={Math.max(280, windowWidth - 70)}
                      height={190}
                      color="#FF9500"
                      thickness={3}
                      dataPointsColor="#FF9500"
                    />

                    {/* 3. Volume */}
                    <Text style={[styles.chartTitle, { marginTop: 36 }]}>Volume (lb × reps)</Text>
                    <LineChart
                      data={chartData.map((d) => ({
                        value: d.volume,
                        label: d.date.slice(5),
                      }))}
                      width={Math.max(280, windowWidth - 70)}
                      height={190}
                      color="#34C759"
                      thickness={3}
                      dataPointsColor="#34C759"
                    />
                  </>
                )}
              </>
            ) : (
              <View style={styles.chartEmptyContainer}>
                <FontAwesome name="line-chart" size={40} color="#C7C7CC" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No Data for this Exercise</Text>
                <Text style={styles.emptySubtitle}>
                  Log sets for {exercises.find((e) => e.id === selectedEx)?.name || 'this exercise'} to track progression here.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  toggleRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    justifyContent: 'center',
    gap: 16,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  toggleBtnActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 15,
    color: '#3A3A3C',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  historyList: {
    padding: 14,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  historyCardActive: {
    borderColor: '#007AFF',
    borderWidth: 1.5,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  historySub: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusInProgress: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusCompletedText: {
    color: '#2E7D32',
  },
  statusInProgressText: {
    color: '#E65100',
  },
  historyCardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    padding: 14,
    backgroundColor: '#FAFAFC',
  },
  detailsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  detailsLoadingText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  noExercisesText: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
    justifyContent: 'center',
  },
  summaryBarItem: {
    fontSize: 13,
    color: '#636366',
  },
  summaryBold: {
    fontWeight: '700',
    color: '#1C1C1E',
  },
  summaryDivider: {
    marginHorizontal: 8,
    color: '#C7C7CC',
  },
  exerciseSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 10,
  },
  exerciseSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  exerciseSectionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  setsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setPill: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  setPillIndex: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 2,
  },
  setPillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3A3A3C',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  dropdownWrapper: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  dropdownIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dropdownLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dropdownSelectedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  dropdownList: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    backgroundColor: '#FAFAFC',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dropdownOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#3A3A3C',
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  chartScroll: {
    padding: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    alignSelf: 'flex-start',
    color: '#1C1C1E',
  },
  chartHeaderBlock: {
    width: '100%',
    marginBottom: 12,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    marginBottom: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: '#636366',
    fontWeight: '500',
  },
  barChartContainer: {
    alignItems: 'center',
    width: '100%',
  },
  weekDetailCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
    width: '100%',
  },
  weekDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  weekDetailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  weekDetailText: {
    fontSize: 13,
    color: '#636366',
  },
  bold: {
    fontWeight: '700',
    color: '#1C1C1E',
  },
  increaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  increaseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  standardBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  standardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  chartNoData: {
    fontSize: 13,
    color: '#8E8E93',
    paddingVertical: 20,
    textAlign: 'center',
  },
  chartLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  chartLoadingText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  chartEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
});
