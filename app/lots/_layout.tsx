/**
 * 📦 LOTS LAYOUT - Stack navigation for lot screens
 */

import { useColorScheme } from '@/components/useColorScheme';
import { Theme, Typography } from '@/constants/Theme';
import { Stack } from 'expo-router';

export default function LotsLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: theme.surface },
                headerTintColor: theme.text,
                headerTitleStyle: Typography.heading.sm,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: theme.background },
            }}
        >
            <Stack.Screen 
                name="new" 
                options={{ 
                    title: 'New Inventory Lot',
                    presentation: 'modal',
                    headerShown: false,
                }} 
            />
            <Stack.Screen 
                name="[id]" 
                options={{ 
                    title: 'Lot Details',
                }} 
            />
        </Stack>
    );
}
