import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Session, Exercise, SetRecord } from '../../src/db/types';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const exercises = await db.getAllAsync<Exercise>('SELECT * FROM exercises');
      const sessions = await db.getAllAsync<Session>('SELECT * FROM sessions');
      const sets = await db.getAllAsync<SetRecord>('SELECT * FROM sets');

      const data = {
        version: 3,
        exported_at: new Date().toISOString(),
        exercises,
        sessions,
        sets,
      };
      const json = JSON.stringify(data, null, 2);

      const file = new File(Paths.document, 'gym_backup.json');
      await file.write(json);
      const fileUri = file.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Workout Backup',
        });
        const todayStr = new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        setLastBackup(todayStr);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      }
    } catch (e) {
      Alert.alert('Export Error', String(e));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const sets = await db.getAllAsync<SetRecord & { exercise_name: string; date: string }>(
        `SELECT sets.*, exercises.name as exercise_name, sessions.started_at as date 
         FROM sets 
         JOIN exercises ON sets.exercise_id = exercises.id 
         JOIN sessions ON sets.session_id = sessions.id 
         ORDER BY sessions.started_at ASC, sets.id ASC`
      );

      let csv = 'Date,Exercise,Set,Weight(lb),Reps,Warmup\n';
      sets.forEach((s) => {
        csv += `${s.date.split('T')[0]},"${s.exercise_name}",${s.set_index + 1},${s.weight_lb},${s.reps},${s.is_warmup}\n`;
      });

      const file = new File(Paths.document, 'workout_data.csv');
      await file.write(csv);
      const fileUri = file.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Workout Data (CSV)',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      }
    } catch (e) {
      Alert.alert('Export Error', String(e));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportJSON = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', '*/*'],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const file = new File(fileUri);
        const contents = await file.text();
        const data = JSON.parse(contents);

        if (!data.exercises || !data.sessions || !data.sets) {
          Alert.alert('Invalid Format', 'This file does not appear to be a valid backup.');
          return;
        }

        Alert.alert(
          'Confirm Restore',
          `This backup contains ${data.exercises.length} exercises, ${data.sessions.length} sessions, and ${data.sets.length} sets.\n\nRestoring will replace all current data. Continue?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restore Data',
              style: 'destructive',
              onPress: async () => {
                try {
                  await db.execAsync(`
                    PRAGMA foreign_keys = OFF;
                    DELETE FROM sets;
                    DELETE FROM sessions;
                    DELETE FROM exercises;
                  `);

                  for (const ex of data.exercises) {
                    await db.runAsync(
                      'INSERT INTO exercises (id, name, rep_min, rep_max, target_sets, increment_lb, default_weight_lb, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                      [
                        ex.id,
                        ex.name,
                        ex.rep_min,
                        ex.rep_max,
                        ex.target_sets,
                        ex.increment_lb,
                        ex.default_weight_lb ?? null,
                        ex.archived,
                        ex.created_at,
                      ]
                    );
                  }
                  for (const s of data.sessions) {
                    await db.runAsync(
                      'INSERT INTO sessions (id, started_at, ended_at, notes) VALUES (?, ?, ?, ?)',
                      [s.id, s.started_at, s.ended_at, s.notes]
                    );
                  }
                  for (const set of data.sets) {
                    await db.runAsync(
                      'INSERT INTO sets (id, session_id, exercise_id, set_index, weight_lb, reps, is_warmup) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [
                        set.id,
                        set.session_id,
                        set.exercise_id,
                        set.set_index,
                        set.weight_lb,
                        set.reps,
                        set.is_warmup,
                      ]
                    );
                  }

                  await db.execAsync('PRAGMA foreign_keys = ON;');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Restore Complete', 'Your data was restored successfully!');
                } catch (err) {
                  Alert.alert('Restore Error', String(err));
                }
              },
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('Import Error', String(e));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Data & Backup Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
              <FontAwesome name="cloud-download" size={13} color="#007AFF" />
            </View>
            <Text style={styles.cardTitle}>Data & Backup</Text>
          </View>

          <Text style={styles.cardSubtitle}>
            Save snapshots of your workouts or export your training history to spreadsheet format.
          </Text>

          {/* Export JSON Button */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleExportJSON}
            disabled={isExporting}
            activeOpacity={0.7}
          >
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                <FontAwesome name="file-code-o" size={14} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.actionRowTitle}>Export JSON Backup</Text>
                <Text style={styles.actionRowSub}>
                  {lastBackup ? `Last backed up: ${lastBackup}` : 'Full database archive'}
                </Text>
              </View>
            </View>
            <FontAwesome name="share" size={14} color="#8E8E93" />
          </TouchableOpacity>

          {/* Export CSV Button */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleExportCSV}
            disabled={isExporting}
            activeOpacity={0.7}
          >
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
                <FontAwesome name="file-excel-o" size={14} color="#2E7D32" />
              </View>
              <View>
                <Text style={styles.actionRowTitle}>Export CSV Spreadsheet</Text>
                <Text style={styles.actionRowSub}>All working sets for Excel / Sheets</Text>
              </View>
            </View>
            <FontAwesome name="download" size={14} color="#8E8E93" />
          </TouchableOpacity>

          {/* Import JSON Restore Button */}
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomWidth: 0 }]}
            onPress={handleImportJSON}
            activeOpacity={0.7}
          >
            <View style={styles.actionRowLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FFF0F0' }]}>
                <FontAwesome name="history" size={14} color="#FF3B30" />
              </View>
              <View>
                <Text style={[styles.actionRowTitle, { color: '#FF3B30' }]}>
                  Restore from JSON Backup
                </Text>
                <Text style={styles.actionRowSub}>Replace current data with backup file</Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={13} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Training Routine Defaults Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#FFF7ED' }]}>
              <FontAwesome name="sliders" size={13} color="#E65100" />
            </View>
            <Text style={styles.cardTitle}>Routine Defaults</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Routine Structure</Text>
            <Text style={styles.infoValue}>Full-Body (3 Days / Week)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Progression Model</Text>
            <Text style={styles.infoValue}>Double Progression</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Standard Increment</Text>
            <Text style={styles.infoValue}>+5 lb</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Primary Weight Unit</Text>
            <Text style={styles.infoValue}>Pounds (lb)</Text>
          </View>
        </View>

        {/* Offline Privacy Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E8F5E9' }]}>
              <FontAwesome name="shield" size={13} color="#2E7D32" />
            </View>
            <Text style={styles.cardTitle}>Privacy & Storage</Text>
          </View>

          <View style={styles.privacyBanner}>
            <FontAwesome name="check-circle" size={16} color="#2E7D32" style={{ marginRight: 10 }} />
            <Text style={styles.privacyBannerText}>
              100% Offline Storage. All workout records are stored exclusively in your local SQLite database (<Text style={styles.code}>gym.db</Text>). No tracking, telemetry, or external cloud servers.
            </Text>
          </View>
        </View>

        {/* App Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#F2F2F7' }]}>
              <FontAwesome name="info-circle" size={14} color="#8E8E93" />
            </View>
            <Text style={styles.cardTitle}>About</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App</Text>
            <Text style={styles.infoValue}>Workout Tracker</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Engine</Text>
            <Text style={styles.infoValue}>Expo SDK 57 • React Native</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 17,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  actionRowSub: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  privacyBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 18,
  },
  code: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
