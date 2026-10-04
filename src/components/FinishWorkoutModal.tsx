import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { Text, Button, Rule } from './ui';

interface FinishWorkoutModalProps {
  visible: boolean;
  totalSets: number;
  totalVolumeLb: number;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function FinishWorkoutModal({
  visible,
  totalSets,
  totalVolumeLb,
  onClose,
  onConfirm,
}: FinishWorkoutModalProps) {
  const { colors } = useTheme();
  const [finishing, setFinishing] = useState(false);

  const handleConfirm = async () => {
    try {
      setFinishing(true);
      await onConfirm();
    } finally {
      setFinishing(false);
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
        <View style={[styles.dialogSheet, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.outline }]}>
            <Text variant="title" color="primary">
              FINISH WORKOUT
            </Text>
            <Pressable onPress={onClose} hitSlop={12} disabled={finishing}>
              <X size={20} color={colors.text} strokeWidth={1.75} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={[styles.specBox, { borderColor: colors.outline, backgroundColor: colors.raised }]}>
              <Text variant="title" color="primary" style={styles.specTitle}>
                FINALIZE SESSION?
              </Text>
              <Text variant="body" color="muted" style={{ marginTop: 6, lineHeight: 20 }}>
                Save and record this session into your lifetime statistics and workout history.
              </Text>

              <Rule style={{ marginVertical: 12 }} />

              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text variant="micro" color="muted">
                    TOTAL SETS
                  </Text>
                  <Text variant="numeral" color="primary" style={styles.metricVal}>
                    {totalSets}
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text variant="micro" color="muted">
                    SESSION VOLUME
                  </Text>
                  <Text variant="numeral" color="primary" style={styles.metricVal}>
                    {totalVolumeLb} LB
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonStack}>
              <Button
                label="FINISH WORKOUT"
                variant="primary"
                onPress={handleConfirm}
                loading={finishing}
              />
              <Button
                label="KEEP TRAINING"
                variant="secondary"
                onPress={onClose}
                disabled={finishing}
              />
            </View>
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
  specTitle: {
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricVal: {
    fontSize: 20,
    lineHeight: 24,
    marginTop: 4,
  },
  buttonStack: {
    gap: 10,
  },
});
