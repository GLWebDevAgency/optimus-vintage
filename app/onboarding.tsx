/**
 * 🌿 ONBOARDING SCREEN - Premium Welcome Experience
 */

import { PremiumButton, PremiumCard } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette, Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { useSettingsStore } from '@/store/settings';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const { setCurrency, setTargetMargin, completeOnboarding } = useSettingsStore();
    const [currencyInput, setCurrencyInput] = React.useState('EUR');
    const [marginInput, setMarginInput] = React.useState('10');

    const handleFinish = () => {
        setCurrency(currencyInput);
        setTargetMargin(Number(marginInput) || 0);
        completeOnboarding();
        router.replace('/(tabs)');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <LinearGradient
                colors={[theme.primary + '15', 'transparent']}
                style={styles.gradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top + Spacing['3xl'], paddingBottom: insets.bottom + Spacing.xl }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.hero}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.primaryMuted }]}>
                        <Text style={styles.emoji}>🌿</Text>
                    </View>
                    <Text style={[Typography.body.sm, { color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 2 }]}>
                        Welcome to
                    </Text>
                    <Text style={[Typography.display.lg, { color: theme.text, marginTop: Spacing.xs }]}>
                        Optimus Vintage
                    </Text>
                    <Text style={[Typography.body.md, { color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.md }]}>
                        Track your thrift flips with style.{'\n'}Premium inventory management for resellers.
                    </Text>
                </Animated.View>

                {/* Setup Card */}
                <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                    <PremiumCard variant="elevated" style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: theme.primaryMuted }]}>
                                <MaterialIcons name="tune" size={16} color={theme.primary} />
                            </View>
                            <Text style={[Typography.heading.md, { color: theme.text }]}>Quick Setup</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[Typography.label.sm, { color: theme.textSecondary }]}>CURRENCY</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: theme.surfaceSecondary,
                                        borderColor: theme.border,
                                        color: theme.text,
                                    }
                                ]}
                                value={currencyInput}
                                onChangeText={setCurrencyInput}
                                placeholder="EUR"
                                placeholderTextColor={theme.textMuted}
                                maxLength={3}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[Typography.label.sm, { color: theme.textSecondary }]}>TARGET MARGIN / ITEM</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: theme.surfaceSecondary,
                                        borderColor: theme.border,
                                        color: theme.text,
                                    }
                                ]}
                                value={marginInput}
                                onChangeText={setMarginInput}
                                placeholder="10"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="numeric"
                            />
                        </View>
                    </PremiumCard>
                </Animated.View>

                {/* Features Preview */}
                <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.features}>
                    <View style={styles.featureRow}>
                        <View style={[styles.featureIcon, { backgroundColor: Palette.emerald[500] + '20' }]}>
                            <MaterialIcons name="trending-up" size={18} color={Palette.emerald[500]} />
                        </View>
                        <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>Real-time profit tracking</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <View style={[styles.featureIcon, { backgroundColor: Palette.sky[500] + '20' }]}>
                            <MaterialIcons name="inventory-2" size={18} color={Palette.sky[500]} />
                        </View>
                        <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>Smart lot management</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <View style={[styles.featureIcon, { backgroundColor: Palette.amber[500] + '20' }]}>
                            <MaterialIcons name="offline-bolt" size={18} color={Palette.amber[500]} />
                        </View>
                        <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>Offline-first storage</Text>
                    </View>
                </Animated.View>

                {/* CTA Button */}
                <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.footer}>
                    <PremiumButton
                        title="Get Started"
                        variant="primary"
                        size="lg"
                        onPress={handleFinish}
                        icon={<MaterialIcons name="arrow-forward" size={20} color="#FFF" />}
                        style={styles.button}
                    />
                    <Text style={[Typography.body.xs, { color: theme.textMuted, marginTop: Spacing.lg }]}>
                        Your data stays on your device
                    </Text>
                </Animated.View>
            </ScrollView>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        height: '50%',
    },
    content: {
        paddingHorizontal: Spacing.xl,
        flexGrow: 1,
    },
    hero: {
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: Radius['2xl'],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    emoji: {
        fontSize: 40,
    },
    card: {
        padding: Spacing['2xl'],
        marginBottom: Spacing.xl,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    stepBadge: {
        width: 32,
        height: 32,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    input: {
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        fontSize: 16,
        fontFamily: 'Manrope_600SemiBold',
        marginTop: Spacing.sm,
    },
    features: {
        marginBottom: Spacing['2xl'],
        gap: Spacing.md,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    featureIcon: {
        width: 36,
        height: 36,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        alignItems: 'center',
        marginTop: 'auto',
    },
    button: {
        width: '100%',
    },
});
