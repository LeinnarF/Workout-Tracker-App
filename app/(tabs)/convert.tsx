import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { lbToKg, kgToLb } from '../../src/logic/conversions';

const BARBELL_MILESTONES = [
  { lb: 45, label: 'Empty Bar' },
  { lb: 135, label: '1 Plate / side' },
  { lb: 185, label: '1 Plate + 25' },
  { lb: 225, label: '2 Plates / side' },
  { lb: 275, label: '2 Plates + 25' },
  { lb: 315, label: '3 Plates / side' },
  { lb: 405, label: '4 Plates / side' },
];

const DUMBBELL_PRESETS = [15, 25, 35, 50, 70, 100];

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
  const [lbStr, setLbStr] = useState('');
  const [kgStr, setKgStr] = useState('');

  const handleLbChange = (text: string) => {
    setLbStr(text);
    const val = parseFloat(text);
    if (!isNaN(val)) {
      setKgStr(lbToKg(val).toString());
    } else {
      setKgStr('');
    }
  };

  const handleKgChange = (text: string) => {
    setKgStr(text);
    const val = parseFloat(text);
    if (!isNaN(val)) {
      setLbStr(kgToLb(val).toString());
    } else {
      setLbStr('');
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLbStr('');
    setKgStr('');
  };

  const handleSelectWeight = (lbVal: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleLbChange(lbVal.toString());
  };

  const numericLb = parseFloat(lbStr);
  const plateInfo = !isNaN(numericLb) && numericLb >= 45 ? getPlateBreakdown(numericLb) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Converter Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.cardIconBox}>
                  <FontAwesome name="exchange" size={13} color="#007AFF" />
                </View>
                <Text style={styles.cardTitle}>Weight Converter</Text>
              </View>
              {(lbStr !== '' || kgStr !== '') && (
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Pounds Input Field */}
            <View style={styles.inputBox}>
              <View style={styles.inputLeft}>
                <Text style={styles.inputSubLabel}>POUNDS</Text>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="decimal-pad"
                  value={lbStr}
                  onChangeText={handleLbChange}
                  placeholder="0"
                  placeholderTextColor="#C7C7CC"
                />
              </View>
              <View style={styles.unitBadgeLb}>
                <Text style={styles.unitBadgeLbText}>LB</Text>
              </View>
            </View>

            {/* Divider with swap icon */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <View style={styles.swapCircle}>
                <FontAwesome name="arrows-v" size={12} color="#8E8E93" />
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* Kilograms Input Field */}
            <View style={styles.inputBox}>
              <View style={styles.inputLeft}>
                <Text style={styles.inputSubLabel}>KILOGRAMS</Text>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="decimal-pad"
                  value={kgStr}
                  onChangeText={handleKgChange}
                  placeholder="0"
                  placeholderTextColor="#C7C7CC"
                />
              </View>
              <View style={styles.unitBadgeKg}>
                <Text style={styles.unitBadgeKgText}>KG</Text>
              </View>
            </View>

            {/* Quick conversion ratio footer */}
            <View style={styles.conversionFooter}>
              <Text style={styles.conversionFormula}>1 lb ≈ 0.4536 kg • 1 kg ≈ 2.2046 lb</Text>
            </View>
          </View>

          {/* Barbell Plate Breakdown Card (Appears when >= 45 lb) */}
          {plateInfo && (
            <View style={styles.plateCard}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.cardIconBox, { backgroundColor: '#E8F5E9' }]}>
                    <FontAwesome name="circle-o" size={13} color="#2E7D32" />
                  </View>
                  <Text style={styles.cardTitle}>Plate Calculator (45 lb Bar)</Text>
                </View>
                <Text style={styles.perSideLoadText}>
                  {plateInfo.perSideLoad} lb / side
                </Text>
              </View>

              {plateInfo.perSide.length === 0 ? (
                <Text style={styles.emptyBarText}>
                  Empty Olympic Barbell (No extra plates needed)
                </Text>
              ) : (
                <View style={styles.platesGrid}>
                  {plateInfo.perSide.map((p) => (
                    <View key={p.weight} style={styles.plateChip}>
                      <Text style={styles.plateChipCount}>{p.count}×</Text>
                      <Text style={styles.plateChipWeight}>{p.weight} lb</Text>
                    </View>
                  ))}
                  {plateInfo.remainder > 0 && (
                    <Text style={styles.plateRemainderText}>
                      +{plateInfo.remainder} lb remainder
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Quick Barbell Milestones Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.cardIconBox}>
                  <FontAwesome name="trophy" size={13} color="#007AFF" />
                </View>
                <Text style={styles.cardTitle}>Barbell Milestones</Text>
              </View>
            </View>

            <View style={styles.milestonesGrid}>
              {BARBELL_MILESTONES.map((item) => {
                const isSelected = numericLb === item.lb;
                return (
                  <TouchableOpacity
                    key={item.lb}
                    style={[styles.milestoneBtn, isSelected && styles.milestoneBtnActive]}
                    onPress={() => handleSelectWeight(item.lb)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.milestoneTopRow}>
                      <Text
                        style={[
                          styles.milestoneLb,
                          isSelected && styles.milestoneLbActive,
                        ]}
                      >
                        {item.lb} lb
                      </Text>
                      <Text
                        style={[
                          styles.milestoneKg,
                          isSelected && styles.milestoneKgActive,
                        ]}
                      >
                        {lbToKg(item.lb)} kg
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.milestoneLabel,
                        isSelected && styles.milestoneLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Dumbbell Weights Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.cardIconBox}>
                  <FontAwesome name="cube" size={13} color="#007AFF" />
                </View>
                <Text style={styles.cardTitle}>Common Dumbbells</Text>
              </View>
            </View>

            <View style={styles.dumbbellGrid}>
              {DUMBBELL_PRESETS.map((lb) => {
                const isSelected = numericLb === lb;
                return (
                  <TouchableOpacity
                    key={lb}
                    style={[styles.dumbbellBtn, isSelected && styles.dumbbellBtnActive]}
                    onPress={() => handleSelectWeight(lb)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dumbbellLb,
                        isSelected && styles.dumbbellLbActive,
                      ]}
                    >
                      {lb} lb
                    </Text>
                    <Text
                      style={[
                        styles.dumbbellKg,
                        isSelected && styles.dumbbellKgActive,
                      ]}
                    >
                      {lbToKg(lb)} kg
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  scroll: {
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
  plateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  clearBtn: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputLeft: {
    flex: 1,
  },
  inputSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  numericInput: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: '#1C1C1E',
    padding: 0,
  },
  unitBadgeLb: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitBadgeLbText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007AFF',
  },
  unitBadgeKg: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitBadgeKgText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  swapCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  conversionFooter: {
    marginTop: 12,
    alignItems: 'center',
  },
  conversionFormula: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  perSideLoadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  emptyBarText: {
    fontSize: 13,
    color: '#636366',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  platesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  plateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  plateChipCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
  },
  plateChipWeight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5E20',
  },
  plateRemainderText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
    marginLeft: 4,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  milestoneBtn: {
    width: '48%',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  milestoneBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF',
  },
  milestoneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  milestoneLb: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  milestoneLbActive: {
    color: '#007AFF',
  },
  milestoneKg: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  milestoneKgActive: {
    color: '#007AFF',
  },
  milestoneLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  milestoneLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dumbbellGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  dumbbellBtn: {
    width: '31%',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dumbbellBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF',
  },
  dumbbellLb: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  dumbbellLbActive: {
    color: '#007AFF',
  },
  dumbbellKg: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  dumbbellKgActive: {
    color: '#007AFF',
  },
});
