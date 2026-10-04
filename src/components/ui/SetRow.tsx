import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export interface SetRowProps {
  index: number;
  weight: number;
  reps: number;
  isWarmup?: boolean;
  onDelete?: () => void;
  onPress?: () => void;
  unit?: string;
  isPR?: boolean;
}

export function SetRow({
  index,
  weight,
  reps,
  isWarmup = false,
  onDelete,
  onPress,
  unit = 'LB',
  isPR = false,
}: SetRowProps) {
  const { colors } = useTheme();

  const formattedIndex = index.toString().padStart(2, '0');

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          borderBottomColor: colors.outline,
          backgroundColor: colors.surface,
        },
      ]}
    >
      {/* Index Column */}
      <View style={styles.indexCol}>
        <Text variant="label" color="muted">
          {formattedIndex}
        </Text>
        {isWarmup && (
          <Text variant="micro" color="accent" style={styles.warmupBadge}>
            W
          </Text>
        )}
      </View>

      {/* Weight Column */}
      <View style={styles.weightCol}>
        <Text variant="numeral" color="primary">
          {weight}
        </Text>
        <Text variant="micro" color="muted" style={styles.unitText}>
          {unit}
        </Text>
      </View>

      {/* Reps Column */}
      <View style={styles.repsCol}>
        <Text variant="numeral" color="primary">
          {reps}
        </Text>
        <Text variant="micro" color="muted" style={styles.unitText}>
          REPS
        </Text>
      </View>

      {/* Status / PR / Actions Column */}
      <View style={styles.actionsCol}>
        {isPR && (
          <View style={[styles.prBadge, { borderColor: colors.accent }]}>
            <Text variant="micro" color="accent">
              PR
            </Text>
          </View>
        )}
        {onDelete && (
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={({ pressed }) => [
              styles.deleteBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Trash2 size={16} color={colors.textMuted} strokeWidth={1.75} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  indexCol: {
    width: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warmupBadge: {
    fontWeight: '700',
  },
  weightCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 4,
    paddingRight: 16,
  },
  repsCol: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 4,
    paddingRight: 8,
  },
  actionsCol: {
    width: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  unitText: {
    marginLeft: 2,
  },
  prBadge: {
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 6,
  },
  deleteBtn: {
    padding: 4,
  },
});
