import { Component, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches uncaught render errors anywhere below it and shows a friendly
 * recovery screen instead of a blank white crash (02-REACT-NATIVE-PROMPTS.md
 * Prompt 12). "Restart" resets local state to re-mount the subtree — there's
 * no native process-reload API available outside a dev/debug build.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) {
      console.error('Uncaught render error:', error);
    }
  }

  handleRestart = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={typography.h1}>Something went wrong</Text>
          <Text style={[typography.muted, styles.message]}>
            An unexpected error occurred. Try restarting the app.
          </Text>
          <Button title="Restart" onPress={this.handleRestart} fullWidth={false} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  message: { textAlign: 'center' },
});
