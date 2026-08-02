import React from 'react';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';

const { government } = colors;

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.light.background },
        headerTintColor: '#1A2332',
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 17,
          color: '#1A2332',
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.light.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Sign In', headerShown: true }} />
      <Stack.Screen name="register" options={{ title: 'New Employee Registration', headerShown: true }} />
      <Stack.Screen name="verify-otp" options={{ title: 'Verify Account', headerShown: true }} />
      <Stack.Screen name="waiting" options={{ headerShown: false }} />
      <Stack.Screen name="rejected" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password', headerShown: true }} />
      <Stack.Screen name="reset-password"  options={{ title: 'Reset Password',   headerShown: true }} />
    </Stack>
  );
}
