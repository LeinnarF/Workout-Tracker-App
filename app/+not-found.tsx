import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../src/theme/useTheme';
import { Text } from '../src/components/ui/Text';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'PAGE NOT FOUND', headerShown: true }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text variant="title" color="primary">
          THIS SCREEN DOES NOT EXIST.
        </Text>

        <Link href="/" style={styles.link}>
          <Text variant="label" color="accent">
            RETURN TO WORKOUT LOG
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
