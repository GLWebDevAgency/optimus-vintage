/**
 * 📱 TAB LAYOUT - Premium Navigation
 */

import { useColorScheme } from '@/components/useColorScheme';
import { Layout, Palette, Theme } from '@/constants/Theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  focused: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Theme[colorScheme];
  
  return (
    <View style={[
      styles.iconContainer,
      props.focused && { 
        backgroundColor: theme.primaryMuted,
      }
    ]}>
      <MaterialIcons 
        size={22} 
        name={props.name} 
        color={props.color} 
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Theme[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isDark ? 'rgba(26, 23, 20, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          borderTopWidth: 0,
          height: Layout.tabBar.height,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          // Premium shadow
          shadowColor: Palette.neutral[900],
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 20,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 10,
          marginTop: 4,
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={isDark ? 40 : 80} 
            tint={isDark ? 'dark' : 'light'} 
            style={StyleSheet.absoluteFill} 
          />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="lots"
        options={{
          title: 'Lots',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="inventory-2" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="checkroom" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="point-of-sale" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
