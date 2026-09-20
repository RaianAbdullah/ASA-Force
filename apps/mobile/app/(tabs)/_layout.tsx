import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useLanguage } from '@/contexts/LanguageContext';

const NEON   = '#00E676';
const MUTED  = 'rgba(255,255,255,0.38)';
const BG     = 'rgba(10,15,13,0.96)';
const BORDER = 'rgba(255,255,255,0.09)';

// iOS 26 native tab layout (liquid glass)
function NativeTabLayout() {
  const { t } = useLanguage();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>{t('goodMorning')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="schedule">
        <Icon sf={{ default: 'calendar', selected: 'calendar' as any }} />
        <Label>{t('schedules')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="vacations">
        <Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} />
        <Label>{t('vacations')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} />
        <Label>{t('messagesTitle')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person.circle', selected: 'person.circle.fill' }} />
        <Label>{t('profileTitle')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// Android / older iOS / web — Midnight Glass tab bar
function ClassicTabLayout() {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: NEON,
        tabBarInactiveTintColor: MUTED,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : '#0A0F0D',
          borderTopWidth: 1,
          borderTopColor: BORDER,
          elevation: 0,
          height: isWeb ? 70 : 70,
          paddingBottom: isWeb ? 8 : 6,
          paddingTop: 6,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0F0D' }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'house.fill' : 'house'} tintColor={color} size={26} />
            ) : (
              <Feather name="home" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="calendar" tintColor={color} size={26} />
            ) : (
              <Feather name="calendar" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="vacations"
        options={{
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'sun.max.fill' : 'sun.max'} tintColor={color} size={26} />
            ) : (
              <Feather name="sun" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'bubble.left.and.bubble.right.fill' : 'bubble.left.and.bubble.right'} tintColor={color} size={26} />
            ) : (
              <Feather name="message-circle" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'person.circle.fill' : 'person.circle'} tintColor={color} size={26} />
            ) : (
              <Feather name="user" size={24} color={color} />
            ),
        }}
      />
      {/* Hidden from tab bar */}
      <Tabs.Screen name="change-password"    options={{ href: null }} />
      <Tabs.Screen name="attendance-history" options={{ href: null }} />
      <Tabs.Screen name="shift-swap"         options={{ href: null }} />
      <Tabs.Screen name="announcements"      options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
