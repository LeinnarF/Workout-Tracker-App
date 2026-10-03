import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Session, Exercise, SetRecord } from '../src/db/types';

export default function SettingsModal() {
  const db = useSQLiteContext();
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const handleExportJSON = async () => {
    try {
      const exercises = await db.getAllAsync<Exercise>('SELECT * FROM exercises');
      const sessions = await db.getAllAsync<Session>('SELECT * FROM sessions');
      const sets = await db.getAllAsync<SetRecord>('SELECT * FROM sets');

      const data = { exercises, sessions, sets };
      const json = JSON.stringify(data, null, 2);

      const file = new File(Paths.document, 'gym_backup.json');
      await file.write(json);
      const fileUri = file.uri;
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        setLastBackup(new Date().toLocaleDateString());
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (e) {
      Alert.alert('Export Error', String(e));
    }
  };

  const handleExportCSV = async () => {
    try {
      const sets = await db.getAllAsync<SetRecord & { exercise_name: string, date: string }>(
        `SELECT sets.*, exercises.name as exercise_name, sessions.started_at as date 
         FROM sets 
         JOIN exercises ON sets.exercise_id = exercises.id 
         JOIN sessions ON sets.session_id = sessions.id 
         ORDER BY sessions.started_at ASC`
      );

      let csv = 'Date,Exercise,Set,Weight(lb),Reps,Warmup\n';
      sets.forEach(s => {
        csv += `${s.date.split('T')[0]},${s.exercise_name},${s.set_index + 1},${s.weight_lb},${s.reps},${s.is_warmup}\n`;
      });

      const file = new File(Paths.document, 'gym_data.csv');
      await file.write(csv);
      const fileUri = file.uri;
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (e) {
      Alert.alert('Export Error', String(e));
    }
  };

  const handleImportJSON = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
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
          'Confirm Import',
          'This will replace all your current data. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: async () => {
                // Clear tables
                await db.execAsync(`
                  PRAGMA foreign_keys = OFF;
                  DELETE FROM sets;
                  DELETE FROM sessions;
                  DELETE FROM exercises;
                `);

                // We can insert them back. Since SQLite in Expo async API doesn't support bulk easily without prepared statements, we loop.
                for (const ex of data.exercises) {
                  await db.runAsync(
                    'INSERT INTO exercises (id, name, rep_min, rep_max, target_sets, increment_lb, archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [ex.id, ex.name, ex.rep_min, ex.rep_max, ex.target_sets, ex.increment_lb, ex.archived, ex.created_at]
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
                    [set.id, set.session_id, set.exercise_id, set.set_index, set.weight_lb, set.reps, set.is_warmup]
                  );
                }

                await db.execAsync('PRAGMA foreign_keys = ON;');
                Alert.alert('Success', 'Data restored successfully!');
              }
            }
          ]
        );
      }
    } catch (e) {
      Alert.alert('Import Error', String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup & Export</Text>
        
        <View style={styles.buttonRow}>
          <Button title="Export JSON (Backup)" onPress={handleExportJSON} />
        </View>
        {lastBackup && <Text style={styles.subtext}>Last Backup: {lastBackup}</Text>}

        <View style={styles.buttonRow}>
          <Button title="Import JSON (Restore)" onPress={handleImportJSON} color="red" />
        </View>

        <View style={styles.buttonRow}>
          <Button title="Export CSV (Analysis)" onPress={handleExportCSV} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonRow: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  subtext: {
    color: '#888',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
  }
});
