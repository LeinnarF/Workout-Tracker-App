import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Pressable,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Share2, Download, Upload, ChevronRight, ShieldCheck, Trash2 } from 'lucide-react-native';

import { Session, Exercise, SetRecord } from '../../src/db/types';
import { ensurePresetExercises } from '../../src/db/queries';
import { useTheme } from '../../src/theme/useTheme';
import { Screen, Text, Rule } from '../../src/components/ui';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { colors, themeMode, setThemeMode } = useTheme();

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
        Alert.alert('UNAVAILABLE', 'Sharing is not supported on this device.');
      }
    } catch (e) {
      Alert.alert('EXPORT ERROR', String(e));
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
        Alert.alert('UNAVAILABLE', 'Sharing is not supported on this device.');
      }
    } catch (e) {
      Alert.alert('EXPORT ERROR', String(e));
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
          Alert.alert('INVALID FORMAT', 'File does not contain valid backup data.');
          return;
        }

        Alert.alert(
          'CONFIRM RESTORE',
          `Restoring will replace all current database records with ${data.exercises.length} exercises, ${data.sessions.length} sessions, and ${data.sets.length} sets. Proceed?`,
          [
            { text: 'CANCEL', style: 'cancel' },
            {
              text: 'RESTORE DATA',
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
                  Alert.alert('SUCCESS', 'Database restored successfully.');
                } catch (err) {
                  Alert.alert('RESTORE ERROR', String(err));
                }
              },
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('IMPORT ERROR', String(e));
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'CLEAR DATA',
      'Choose what data to clear. This action cannot be undone.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'CLEAR WORKOUT LOGS',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'CONFIRM CLEAR LOGS',
              'Permanently delete all workout sessions and logged sets? Your custom exercises and rep range targets will be preserved.',
              [
                { text: 'CANCEL', style: 'cancel' },
                {
                  text: 'DELETE LOGS',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await db.execAsync(`
                        PRAGMA foreign_keys = OFF;
                        DELETE FROM sets;
                        DELETE FROM sessions;
                        PRAGMA foreign_keys = ON;
                      `);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert('SUCCESS', 'Workout history has been cleared.');
                    } catch (err) {
                      Alert.alert('ERROR', 'Failed to clear workout logs: ' + String(err));
                    }
                  },
                },
              ]
            );
          },
        },
        {
          text: 'RESET ALL TO DEFAULT',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'CONFIRM FULL RESET',
              'Permanently delete all workout history and reset all exercises to factory defaults?',
              [
                { text: 'CANCEL', style: 'cancel' },
                {
                  text: 'RESET EVERYTHING',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await db.execAsync(`
                        PRAGMA foreign_keys = OFF;
                        DELETE FROM sets;
                        DELETE FROM sessions;
                        DELETE FROM exercises;
                        PRAGMA foreign_keys = ON;
                      `);
                      await ensurePresetExercises(db);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert('SUCCESS', 'All data has been reset to defaults.');
                    } catch (err) {
                      Alert.alert('ERROR', 'Failed to reset data: ' + String(err));
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <Screen title="SETTINGS">
      {/* Theme / Appearance Spec Box */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Text variant="label" color="primary" style={styles.cardHeading}>
          APPEARANCE
        </Text>
        <Text variant="body" color="muted" style={styles.cardDescription}>
          Select interface theme or match system default.
        </Text>

        <View style={[styles.themeStrip, { borderColor: colors.outline }]}>
          {(['system', 'light', 'dark'] as const).map((mode, idx) => {
            const isSelected = themeMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setThemeMode(mode);
                }}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: isSelected ? colors.raised : colors.surface,
                    borderRightColor: colors.outline,
                    borderRightWidth: idx === 2 ? 0 : 1,
                  },
                ]}
              >
                <Text
                  variant="label"
                  color={isSelected ? 'accent' : 'muted'}
                >
                  {mode.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {/* Data & Backup Spec Box */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Text variant="label" color="primary" style={styles.cardHeading}>
          DATA & BACKUP
        </Text>
        <Text variant="body" color="muted" style={styles.cardDescription}>
          Export training history or restore from an existing JSON backup archive.
        </Text>

        <Rule style={{ marginVertical: 12 }} />

        {/* Action: Export JSON */}
        <Pressable
          onPress={handleExportJSON}
          disabled={isExporting}
          style={styles.actionRow}
        >
          <View style={styles.actionLeft}>
            <Share2 size={18} color={colors.text} strokeWidth={1.75} />
            <View>
              <Text variant="title" color="primary">
                EXPORT JSON BACKUP
              </Text>
              <Text variant="micro" color="muted">
                {lastBackup ? `LAST: ${lastBackup.toUpperCase()}` : 'FULL DATABASE SNAPSHOT'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.75} />
        </Pressable>

        <Rule style={{ marginVertical: 10 }} />

        {/* Action: Export CSV */}
        <Pressable
          onPress={handleExportCSV}
          disabled={isExporting}
          style={styles.actionRow}
        >
          <View style={styles.actionLeft}>
            <Download size={18} color={colors.text} strokeWidth={1.75} />
            <View>
              <Text variant="title" color="primary">
                EXPORT CSV SPREADSHEET
              </Text>
              <Text variant="micro" color="muted">
                WORKING SETS FOR EXCEL / SHEETS
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.75} />
        </Pressable>

        <Rule style={{ marginVertical: 10 }} />

        {/* Action: Restore JSON */}
        <Pressable
          onPress={handleImportJSON}
          style={styles.actionRow}
        >
          <View style={styles.actionLeft}>
            <Upload size={18} color={colors.text} strokeWidth={1.75} />
            <View>
              <Text variant="title" color="primary">
                RESTORE FROM BACKUP
              </Text>
              <Text variant="micro" color="muted">
                REPLACE CURRENT DATA FROM FILE
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.75} />
        </Pressable>

        <Rule style={{ marginVertical: 10 }} />

        {/* Action: Clear Data */}
        <Pressable
          onPress={handleClearData}
          style={styles.actionRow}
        >
          <View style={styles.actionLeft}>
            <Trash2 size={18} color={colors.text} strokeWidth={1.75} />
            <View>
              <Text variant="title" color="primary">
                CLEAR DATA
              </Text>
              <Text variant="micro" color="muted">
                WIPE WORKOUT LOGS OR RESET DATABASE
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.75} />
        </Pressable>
      </View>

      {/* Routine Defaults Spec Box */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <Text variant="label" color="primary" style={styles.cardHeading}>
          ROUTINE SPECIFICATION
        </Text>

        <View style={styles.specRow}>
          <Text variant="label" color="muted">
            STRUCTURE
          </Text>
          <Text variant="title" color="primary">
            FULL-BODY (3 DAYS / WK)
          </Text>
        </View>
        <Rule style={{ marginVertical: 8 }} />

        <View style={styles.specRow}>
          <Text variant="label" color="muted">
            PROGRESSION
          </Text>
          <Text variant="title" color="primary">
            DOUBLE PROGRESSION
          </Text>
        </View>
        <Rule style={{ marginVertical: 8 }} />

        <View style={styles.specRow}>
          <Text variant="label" color="muted">
            INCREMENT
          </Text>
          <Text variant="title" color="primary">
            +5 LB
          </Text>
        </View>
        <Rule style={{ marginVertical: 8 }} />

        <View style={styles.specRow}>
          <Text variant="label" color="muted">
            PRIMARY UNIT
          </Text>
          <Text variant="title" color="primary">
            POUNDS (LB)
          </Text>
        </View>
      </View>

      {/* Storage and Privacy */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <View style={styles.privacyHeader}>
          <ShieldCheck size={20} color={colors.accent} strokeWidth={1.75} />
          <Text variant="label" color="primary" style={{ marginLeft: 8 }}>
            100% OFFLINE STORAGE
          </Text>
        </View>
        <Text variant="body" color="muted" style={{ marginTop: 8 }}>
          All workout data is stored locally in your SQLite database (gym.db). No telemetry, tracking, or cloud sync.
        </Text>
      </View>

      {/* Version Spec */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <View style={styles.specRow}>
          <Text variant="label" color="muted">
            APPLICATION
          </Text>
          <Text variant="label" color="primary">
            WORKOUT TRACKER V1.0.0
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    marginBottom: 6,
  },
  cardDescription: {
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeStrip: {
    flexDirection: 'row',
    height: 44,
    borderWidth: 1,
    borderRadius: 0,
    marginTop: 12,
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
