import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Exercise } from '../db/types';
import { useTheme } from '../theme/useTheme';
import { Text, Button, Rule } from './ui';

interface ExerciseActionModalProps {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export function ExerciseActionModal({
  visible,
  exercise,
  onClose,
  onEdit,
  onDelete,
}: ExerciseActionModalProps) {
  const { colors } = useTheme();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!exercise) return null;

  const handleClose = () => {
    setConfirmingDelete(false);
    onClose();
  };

  const handleEdit = () => {
    setConfirmingDelete(false);
    onEdit(exercise);
  };

  const handleDelete = () => {
    setConfirmingDelete(false);
    onDelete(exercise);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialogSheet, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.outline }]}>
            <Text variant="title" color="primary">
              {confirmingDelete ? 'DELETE EXERCISE' : 'EXERCISE OPTIONS'}
            </Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X size={20} color={colors.text} strokeWidth={1.75} />
            </Pressable>
          </View>

          <View style={styles.content}>
            {!confirmingDelete ? (
              <>
                <View style={[styles.specBox, { borderColor: colors.outline, backgroundColor: colors.raised }]}>
                  <Text variant="title" color="primary" style={styles.exerciseTitle}>
                    {exercise.name}
                  </Text>
                  <Rule style={{ marginVertical: 8 }} />
                  <View style={styles.specRow}>
                    <Text variant="label" color="muted">
                      TARGET
                    </Text>
                    <Text variant="label" color="primary">
                      {exercise.target_sets} SETS × {exercise.rep_min}-{exercise.rep_max} REPS
                    </Text>
                  </View>
                  <View style={[styles.specRow, { marginTop: 4 }]}>
                    <Text variant="label" color="muted">
                      INCREMENT
                    </Text>
                    <Text variant="label" color="primary">
                      +{exercise.increment_lb} LB
                    </Text>
                  </View>
                  {exercise.default_weight_lb != null && (
                    <View style={[styles.specRow, { marginTop: 4 }]}>
                      <Text variant="label" color="muted">
                        DEFAULT WEIGHT
                      </Text>
                      <Text variant="label" color="primary">
                        {exercise.default_weight_lb} LB
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.buttonStack}>
                  <Button
                    label="EDIT EXERCISE"
                    variant="primary"
                    onPress={handleEdit}
                  />
                  <Button
                    label="DELETE EXERCISE"
                    variant="secondary"
                    onPress={() => setConfirmingDelete(true)}
                  />
                  <Button
                    label="CANCEL"
                    variant="secondary"
                    onPress={handleClose}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={[styles.specBox, { borderColor: colors.outline, backgroundColor: colors.raised }]}>
                  <Text variant="title" color="primary" style={styles.exerciseTitle}>
                    REMOVE {exercise.name.toUpperCase()}?
                  </Text>
                  <Text variant="body" color="muted" style={{ marginTop: 8, lineHeight: 20 }}>
                    This will remove the exercise from your active workout list. Past workout history and logged sets will remain preserved.
                  </Text>
                </View>

                <View style={styles.buttonStack}>
                  <Button
                    label="CONFIRM DELETE"
                    variant="primary"
                    onPress={handleDelete}
                  />
                  <Button
                    label="GO BACK"
                    variant="secondary"
                    onPress={() => setConfirmingDelete(false)}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  dialogSheet: {
    borderWidth: 1,
    borderRadius: 0,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  content: {
    padding: 16,
  },
  specBox: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 14,
    marginBottom: 16,
  },
  exerciseTitle: {
    letterSpacing: 0.5,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonStack: {
    gap: 10,
  },
});
