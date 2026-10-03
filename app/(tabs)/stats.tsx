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
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { getPastSessions, getStatsForExercise, getSessionSets } from '../../src/db/statsQueries';
import { Session, Exercise, SetRecord } from '../../src/db/types';
import { getExercises } from '../../src/db/queries';
import { LineChart } from 'react-native-gifted-charts';

export default function StatsScreen() {
  const db = useSQLiteContext();
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
  const [chartData, setChartData] = useState<
    { date: string; volume: number; bestE1rm: number; bestWeight: number }[]
  >([]);

  const loadHistory = useCallback(async () => {
    const past = await getPastSessions(db);
    setSessions(past);
  }, [db]);

  const loadExercises = useCallback(async () => {
    const list = await getExercises(db);
    setExercises(list);
    if (list.length > 0 && selectedEx === null) {
      setSelectedEx(list[0].id);
      const data = await getStatsForExercise(db, list[0].id);
      setChartData(data);
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
    const data = await getStatsForExercise(db, id);
    setChartData(data);
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
          <View style={styles.exPicker}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {exercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.exPill, selectedEx === ex.id && styles.exPillActive]}
                  onPress={() => handleSelectExercise(ex.id)}
                >
                  <Text
                    style={[
                      styles.exPillText,
                      selectedEx === ex.id && styles.exPillTextActive,
                    ]}
                  >
                    {ex.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.chartScroll}>
            {chartData.length > 0 ? (
              <>
                <Text style={styles.chartTitle}>Estimated 1RM (lb)</Text>
                <LineChart
                  data={chartData.map((d) => ({
                    value: d.bestE1rm,
                    label: d.date.slice(5),
                  }))}
                  width={300}
                  height={200}
                  color="#FF9500"
                  thickness={3}
                  dataPointsColor="#FF9500"
                />

                <Text style={[styles.chartTitle, { marginTop: 40 }]}>Volume (lb × reps)</Text>
                <LineChart
                  data={chartData.map((d) => ({
                    value: d.volume,
                    label: d.date.slice(5),
                  }))}
                  width={300}
                  height={200}
                  color="#34C759"
                  thickness={3}
                  dataPointsColor="#34C759"
                />
              </>
            ) : (
              <Text style={styles.empty}>No data for this exercise.</Text>
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
  empty: {
    padding: 20,
    textAlign: 'center',
    color: '#888',
  },
  exPicker: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  exPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginHorizontal: 6,
  },
  exPillActive: {
    backgroundColor: '#007AFF',
  },
  exPillText: {
    color: '#3A3A3C',
    fontSize: 14,
    fontWeight: '500',
  },
  exPillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  chartScroll: {
    padding: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
    color: '#1C1C1E',
  },
});
