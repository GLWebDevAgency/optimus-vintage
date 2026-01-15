/**
 * ⚙️ SETTINGS SCREEN - Premium Preferences
 */

import { GlassHeader, PremiumCard } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { useSettingsStore } from '@/store/settings';
import { exportDataToCSV } from '@/utils/data/export';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Settings Row Component
function SettingsRow({ 
    label, 
    description, 
    value, 
    onChangeText, 
    onBlur,
    keyboardType = 'default',
    maxLength,
    isLast = false,
}: {
    label: string;
    description: string;
    value: string;
    onChangeText: (text: string) => void;
    onBlur: () => void;
    keyboardType?: 'default' | 'numeric';
    maxLength?: number;
    isLast?: boolean;
}) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];

    return (
        <View style={[
            styles.row, 
            { borderBottomColor: theme.divider },
            isLast && { borderBottomWidth: 0 }
        ]}>
            <View style={styles.rowLabel}>
                <Text style={[Typography.body.md, { color: theme.text, fontFamily: 'Manrope_600SemiBold' }]}>
                    {label}
                </Text>
                <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                    {description}
                </Text>
            </View>
            <TextInput
                style={[
                    styles.input,
                    { 
                        backgroundColor: theme.surfaceSecondary,
                        color: theme.primary,
                    }
                ]}
                value={value}
                onChangeText={onChangeText}
                onBlur={onBlur}
                keyboardType={keyboardType}
                maxLength={maxLength}
                placeholderTextColor={theme.textMuted}
            />
        </View>
    );
}

// Action Row Component
function ActionRow({ 
    icon, 
    label, 
    onPress, 
    variant = 'default',
    disabled = false,
    isLast = false,
}: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    onPress: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
    isLast?: boolean;
}) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const isDanger = variant === 'danger';

    return (
        <Pressable 
            style={({ pressed }) => [
                styles.actionRow,
                { 
                    borderBottomColor: theme.divider,
                    opacity: pressed ? 0.7 : 1,
                },
                isLast && { borderBottomWidth: 0 }
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <View style={[
                styles.actionIcon,
                { backgroundColor: isDanger ? theme.dangerSubtle : theme.surfaceSecondary }
            ]}>
                <MaterialIcons 
                    name={icon} 
                    size={20} 
                    color={isDanger ? theme.danger : theme.text} 
                />
            </View>
            <Text style={[
                Typography.body.md,
                { 
                    color: isDanger ? theme.danger : theme.text,
                    fontFamily: 'Manrope_600SemiBold',
                    flex: 1,
                }
            ]}>
                {label}
            </Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
        </Pressable>
    );
}

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const { currency, setCurrency, targetMargin, setTargetMargin, resetOnboarding } = useSettingsStore();

    const [currencyInput, setCurrencyInput] = React.useState(currency);
    const [marginInput, setMarginInput] = React.useState(String(targetMargin));
    const [exporting, setExporting] = React.useState(false);

    const handleSave = () => {
        setCurrency(currencyInput);
        setTargetMargin(Number(marginInput) || 0);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportDataToCSV();
        } catch (e) {
            Alert.alert("Error", "Export failed.");
        } finally {
            setExporting(false);
        }
    };

    const handleReset = () => {
        Alert.alert(
            "Reset App?",
            "This will clear local preference data and restart onboarding.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", style: "destructive", onPress: resetOnboarding }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <GlassHeader
                paddingTop={insets.top}
                title="Settings"
                leftContent={
                    <View>
                        <Text style={[Typography.display.sm, { color: theme.text }]}>Settings</Text>
                        <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                            Preferences & Data
                        </Text>
                    </View>
                }
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Preferences Section */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                    <PremiumCard variant="elevated" style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: theme.primaryMuted }]}>
                                <MaterialIcons name="tune" size={20} color={theme.primary} />
                            </View>
                            <Text style={[Typography.heading.sm, { color: theme.text }]}>
                                Preferences
                            </Text>
                        </View>

                        <SettingsRow
                            label="Currency"
                            description="Symbol used for prices"
                            value={currencyInput}
                            onChangeText={setCurrencyInput}
                            onBlur={handleSave}
                            maxLength={3}
                        />
                        <SettingsRow
                            label="Target Margin"
                            description="Profit goal per item"
                            value={marginInput}
                            onChangeText={setMarginInput}
                            onBlur={handleSave}
                            keyboardType="numeric"
                            isLast
                        />
                    </PremiumCard>
                </Animated.View>

                {/* Data Management Section */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <PremiumCard variant="elevated" style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIcon, { backgroundColor: theme.primaryMuted }]}>
                                <MaterialIcons name="storage" size={20} color={theme.primary} />
                            </View>
                            <Text style={[Typography.heading.sm, { color: theme.text }]}>
                                Data Management
                            </Text>
                        </View>

                        <ActionRow
                            icon="download"
                            label={exporting ? 'Exporting...' : 'Export All Data (CSV)'}
                            onPress={handleExport}
                            disabled={exporting}
                        />
                        <ActionRow
                            icon="refresh"
                            label="Reset Onboarding"
                            onPress={handleReset}
                            variant="danger"
                            isLast
                        />
                    </PremiumCard>
                </Animated.View>

                {/* App Info Section */}
                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                    <PremiumCard variant="glass" style={styles.infoCard}>
                        <LinearGradient
                            colors={[theme.primary + '20', theme.primaryMuted]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.infoGradient}
                        >
                            <View style={styles.appIcon}>
                                <Text style={styles.appIconText}>🌿</Text>
                            </View>
                            <Text style={[Typography.heading.md, { color: theme.text }]}>
                                Optimus Vintage
                            </Text>
                            <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                                Version 1.0.0
                            </Text>
                            <Text style={[Typography.body.xs, { color: theme.textMuted, marginTop: Spacing.md, textAlign: 'center' }]}>
                                Premium vintage inventory management{'\n'}for the modern reseller
                            </Text>
                        </LinearGradient>
                    </PremiumCard>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['4xl'],
    },
    section: {
        marginBottom: Spacing.lg,
        padding: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
    },
    rowLabel: {
        flex: 1,
    },
    input: {
        textAlign: 'right',
        fontSize: 18,
        fontFamily: 'Manrope_700Bold',
        minWidth: 100,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        gap: Spacing.md,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCard: {
        overflow: 'hidden',
        padding: 0,
    },
    infoGradient: {
        alignItems: 'center',
        paddingVertical: Spacing['3xl'],
        paddingHorizontal: Spacing.xl,
    },
    appIcon: {
        width: 72,
        height: 72,
        borderRadius: Radius.xl,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        ...{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
        },
    },
    appIconText: {
        fontSize: 32,
    },
});
