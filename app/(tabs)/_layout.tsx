import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { BookOpen, BarChart2, ArrowLeftRight, Timer } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../src/theme/useTheme';
import { Text } from '../../src/components/ui/Text';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function IndustrialTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.outline,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        // Skip hidden tabs (like settings)
        if ((options as { href?: string | null }).href === null || route.name === 'settings') {
          return null;
        }

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // ignore
            }
            navigation.navigate(route.name);
          }
        };

        let label = options.title !== undefined ? options.title : route.name;
        if (route.name === 'index') label = 'Log';

        const iconColor = isFocused ? colors.accent : colors.textMuted;

        const renderIcon = () => {
          const iconProps = {
            size: 20,
            strokeWidth: 1.75,
            color: iconColor,
          };
          switch (route.name) {
            case 'index':
              return <BookOpen {...iconProps} />;
            case 'stats':
              return <BarChart2 {...iconProps} />;
            case 'convert':
              return <ArrowLeftRight {...iconProps} />;
            case 'timer':
              return <Timer {...iconProps} />;
            default:
              return null;
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
          >
            {/* Active top 2px bar */}
            {isFocused && (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: colors.accent },
                ]}
              />
            )}

            <View style={styles.tabContent}>
              {renderIcon()}
              <Text
                variant="micro"
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.text : colors.textMuted },
                ]}
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <IndustrialTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Log',
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
        }}
      />
      <Tabs.Screen
        name="convert"
        options={{
          title: 'Convert',
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tabButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
});
