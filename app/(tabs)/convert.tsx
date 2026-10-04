import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { ArrowUpDown, Copy } from 'lucide-react-native';

import { lbToKg, kgToLb } from '../../src/logic/conversions';
import { useTheme } from '../../src/theme/useTheme';
import { Screen, Text, Rule } from '../../src/components/ui';

const BARBELL_MILESTONES = [
  { lb: 45, label: 'EMPTY BAR' },
  { lb: 135, label: '1 PLATE' },
  { lb: 185, label: '1 PL + 25' },
  { lb: 225, label: '2 PLATES' },
  { lb: 275, label: '2 PL + 25' },
  { lb: 315, label: '3 PLATES' },
  { lb: 405, label: '4 PLATES' },
];

function getPlateBreakdown(totalLb: number): {
  bar: number;
  perSideLoad: number;
  perSide: { weight: number; count: number }[];
  remainder: number;
} | null {
  if (isNaN(totalLb) || totalLb < 45) return null;
  const perSideLoad = (totalLb - 45) / 2;
  if (perSideLoad === 0) {
    return { bar: 45, perSideLoad: 0, perSide: [], remainder: 0 };
  }
  const plateSizes = [45, 35, 25, 10, 5, 2.5];
  let remaining = perSideLoad;
  const perSide: { weight: number; count: number }[] = [];

  for (const plate of plateSizes) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate);
      perSide.push({ weight: plate, count });
      remaining = Math.round((remaining - count * plate) * 10) / 10;
    }
  }
  return { bar: 45, perSideLoad, perSide, remainder: remaining };
}

export default function ConvertScreen() {
  const { colors, radius, typography } = useTheme();

  const [primaryUnit, setPrimaryUnit] = useState<'LB' | 'KG'>('LB');
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');

  const handleVal1Change = (text: string) => {
    setVal1(text);
    const num = parseFloat(text);
    if (!isNaN(num)) {
      if (primaryUnit === 'LB') {
        setVal2(lbToKg(num).toString());
      } else {
        setVal2(kgToLb(num).toString());
      }
    } else {
      setVal2('');
    }
  };

  const handleVal2Change = (text: string) => {
    setVal2(text);
    const num = parseFloat(text);
    if (!isNaN(num)) {
      if (primaryUnit === 'LB') {
        setVal1(kgToLb(num).toString());
      } else {
        setVal1(lbToKg(num).toString());
      }
    } else {
      setVal1('');
    }
  };

  const handleSwap = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    const nextUnit = primaryUnit === 'LB' ? 'KG' : 'LB';
    setPrimaryUnit(nextUnit);
    // Swap values
    const temp = val1;
    setVal1(val2);
    setVal2(temp);
  };

  const handleCopyResult = async () => {
    if (!val2) return;
    try {
      await Clipboard.setStringAsync(val2);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('COPIED', `${val2} ${primaryUnit === 'LB' ? 'KG' : 'LB'} copied to clipboard.`);
    } catch {
      // fallback
    }
  };

  const handleSelectMilestone = (lbVal: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    if (primaryUnit === 'LB') {
      handleVal1Change(lbVal.toString());
    } else {
      handleVal2Change(lbVal.toString());
    }
  };

  const currentLb = primaryUnit === 'LB' ? parseFloat(val1) : parseFloat(val2);
  const plateInfo = !isNaN(currentLb) && currentLb >= 45 ? getPlateBreakdown(currentLb) : null;

  const unit1 = primaryUnit;
  const unit2 = primaryUnit === 'LB' ? 'KG' : 'LB';

  return (
    <Screen title="CONVERT">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Converter Card */}
        <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
          {/* Top Field */}
          <View style={styles.fieldSection}>
            <Text variant="label" color="muted" style={styles.fieldLabel}>
              INPUT ({unit1})
            </Text>
            <View
              style={[
                styles.fieldWrapper,
                {
                  backgroundColor: colors.raised,
                  borderColor: colors.outline,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.numericInput,
                  typography.numeral,
                  { color: colors.text },
                ]}
                keyboardType="decimal-pad"
                value={val1}
                onChangeText={handleVal1Change}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
              <View style={[styles.unitTag, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                <Text variant="label" color="primary">
                  {unit1}
                </Text>
              </View>
            </View>
          </View>

          {/* Swap Button: Square 48dp, raised fill, 1px outline border */}
          <View style={styles.swapRow}>
            <Rule style={{ flex: 1 }} />
            <Pressable
              onPress={handleSwap}
              style={({ pressed }) => [
                styles.swapButton,
                {
                  backgroundColor: colors.raised,
                  borderColor: pressed ? colors.text : colors.outline,
                  borderRadius: radius.control,
                },
              ]}
            >
              <ArrowUpDown size={18} color={colors.text} strokeWidth={1.75} />
            </Pressable>
            <Rule style={{ flex: 1 }} />
          </View>

          {/* Bottom Result Field with Copy button */}
          <View style={styles.fieldSection}>
            <View style={styles.resultLabelRow}>
              <Text variant="label" color="muted">
                RESULT ({unit2})
              </Text>
              {val2 !== '' && (
                <Pressable
                  onPress={handleCopyResult}
                  hitSlop={8}
                  style={styles.copyAction}
                >
                  <Copy size={14} color={colors.accent} strokeWidth={1.75} />
                  <Text variant="micro" color="accent" style={{ marginLeft: 4 }}>
                    COPY
                  </Text>
                </Pressable>
              )}
            </View>

            <View
              style={[
                styles.fieldWrapper,
                {
                  backgroundColor: colors.raised,
                  borderColor: colors.outline,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.numericInput,
                  typography.numeral,
                  { color: colors.text },
                ]}
                keyboardType="decimal-pad"
                value={val2}
                onChangeText={handleVal2Change}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
              <View style={[styles.unitTag, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                <Text variant="label" color="primary">
                  {unit2}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Barbell Plate Spec Sheet */}
        <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
          <Text variant="label" color="primary" style={styles.specTitle}>
            BARBELL PLATE LOAD (45 LB BAR)
          </Text>

          {plateInfo ? (
            <View style={styles.plateTable}>
              <View style={[styles.plateRowHeader, { borderBottomColor: colors.outline }]}>
                <Text variant="label" color="muted">
                  EACH SIDE LOAD
                </Text>
                <Text variant="numeral" color="primary">
                  {plateInfo.perSideLoad} LB
                </Text>
              </View>

              {plateInfo.perSide.length === 0 ? (
                <Text variant="label" color="muted" style={styles.emptyPlateText}>
                  EMPTY 45 LB BAR (NO PLATES REQUIRED)
                </Text>
              ) : (
                plateInfo.perSide.map((p) => (
                  <View
                    key={p.weight}
                    style={[
                      styles.plateItemRow,
                      { borderBottomColor: colors.outline },
                    ]}
                  >
                    <Text variant="title" color="primary">
                      {p.weight} LB PLATE
                    </Text>
                    <Text variant="numeral" color="primary">
                      × {p.count}
                    </Text>
                  </View>
                ))
              )}

              {plateInfo.remainder > 0 && (
                <View style={styles.remainderRow}>
                  <Text variant="micro" color="muted">
                    UNLOADABLE FRACTION: {plateInfo.remainder} LB PER SIDE
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text variant="label" color="muted" style={styles.emptyPlateText}>
              ENTER 45 LB OR HIGHER TO CALCULATE PLATES PER SIDE.
            </Text>
          )}
        </View>

        {/* Barbell Milestones Grid (Square Chips) */}
        <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
          <Text variant="label" color="primary" style={styles.specTitle}>
            BARBELL MILESTONES
          </Text>

          <View style={styles.milestoneGrid}>
            {BARBELL_MILESTONES.map((m) => (
              <Pressable
                key={m.lb}
                onPress={() => handleSelectMilestone(m.lb)}
                style={({ pressed }) => [
                  styles.milestoneChip,
                  {
                    backgroundColor: pressed ? colors.raised : colors.surface,
                    borderColor: colors.outline,
                    borderRadius: radius.control,
                  },
                ]}
              >
                <Text variant="numeral" color="primary">
                  {m.lb}
                </Text>
                <Text variant="micro" color="muted" style={{ marginTop: 2 }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    width: '100%',
  },
  card: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
  },
  fieldSection: {
    width: '100%',
  },
  fieldLabel: {
    marginBottom: 6,
  },
  resultLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  copyAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 0,
  },
  numericInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  unitTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 2,
    marginLeft: 8,
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  specTitle: {
    marginBottom: 12,
  },
  plateTable: {
    width: '100%',
  },
  plateRowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  plateItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  emptyPlateText: {
    paddingVertical: 12,
    textAlign: 'center',
  },
  remainderRow: {
    marginTop: 8,
  },
  milestoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  milestoneChip: {
    width: '31%',
    height: 64,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});
