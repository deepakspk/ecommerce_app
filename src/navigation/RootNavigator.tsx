import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { AuthStack } from './AuthStack';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * MainTabs is the base route (browsing is guest-accessible). AuthStack is
 * presented as a modal on top whenever a protected action needs a session —
 * the AuthGuard wrapper that triggers this is built in Prompt 2.
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AuthModal" component={AuthStack} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
