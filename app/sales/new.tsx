/**
 * 💰 NEW SALE SCREEN - Premium Sale Form
 */

import { PremiumButton, PremiumCard, PremiumInput } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { Item, ItemsRepository, SalesRepository } from '@/db/repositories';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewSaleScreen() {
    const params = useLocalSearchParams<{ itemId?: string; lotId?: string }>();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    
    const [price, setPrice] = useState('');
    const [platformFees, setPlatformFees] = useState('');
    const [shippingFees, setShippingFees] = useState('0');
    const [item, setItem] = useState<Item | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (params.itemId) {
            ItemsRepository.getById(parseInt(params.itemId)).then((result) => {
                setItem(result || null);
            });
        }
    }, [params.itemId]);

    const netAmount = price
        ? (parseFloat(price) - (parseFloat(platformFees) || 0) - (parseFloat(shippingFees) || 0)).toFixed(2)
        : '0.00';

    const profit = item && price
        ? (parseFloat(netAmount) - parseFloat(String(item.unitCost))).toFixed(2)
        : '0.00';

    const handleSave = async () => {
        if (!price || !item) {
            Alert.alert("Missing", "Price or item is missing.");
            return;
        }

        setIsSubmitting(true);
        try {
            const pGross = parseFloat(price.replace(',', '.'));
            const pFees = parseFloat(platformFees.replace(',', '.') || '0');
            const pShip = parseFloat(shippingFees.replace(',', '.') || '0');
            const pNet = pGross - pFees - pShip;

            await SalesRepository.create({
                itemId: item.id,
                lotId: item.lotId,
                platform: 'VINTED',
                priceGross: pGross.toFixed(2),
                platformFees: pFees.toFixed(2),
                shippingFees: pShip.toFixed(2),
                priceNet: pNet.toFixed(2),
                saleDate: new Date().toISOString().split('T')[0],
                status: 'COMPLETED'
            });

            await ItemsRepository.updateStatus(item.id, 'SOLD');

            Alert.alert("Congrats! 💸", `Sale recorded. Net profit: €${pNet.toFixed(2)}`, [
                { text: "Awesome", onPress: () => {
                    // Dismiss modal stack first, then navigate to sales tab
                    router.dismissAll();
                    router.replace('/(tabs)/sales');
                }}
            ]);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not record the sale.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!params.itemId && !item) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.errorIcon, { backgroundColor: theme.dangerSubtle }]}>
                    <MaterialIcons name="error-outline" size={40} color={theme.danger} />
                </View>
                <Text style={[Typography.heading.md, { color: theme.text }]}>No Item Selected</Text>
                <Text style={[Typography.body.sm, { color: theme.textMuted, textAlign: 'center' }]}>
                    Please select an item from the Stock screen to record a sale.
                </Text>
                <PremiumButton
                    title="Go to Stock"
                    variant="primary"
                    size="md"
                    onPress={() => {
                        // Dismiss modal stack first, then navigate to stock tab
                        router.dismissAll();
                        router.replace('/(tabs)/stock');
                    }}
                    style={{ marginTop: Spacing.xl }}
                />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <Stack.Screen
                options={{
                    title: 'New Sale',
                    presentation: 'formSheet',
                    headerStyle: { backgroundColor: theme.surface },
                    headerTintColor: theme.text,
                }}
            />

            <View style={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
                {/* Item Header */}
                <Animated.View entering={FadeInUp.delay(100).duration(400)}>
                    <PremiumCard variant="highlight" style={styles.itemHeader}>
                        <View style={[styles.itemIcon, { backgroundColor: theme.primaryMuted }]}>
                            <MaterialIcons name="checkroom" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.itemInfo}>
                            <Text style={[Typography.heading.sm, { color: theme.text }]}>
                                {item ? `${item.type || 'Item'} ${item.brand || ''}` : 'Loading...'}
                            </Text>
                            <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                                Lot #{item?.lotId} • ID: {item?.id} • Cost: €{item ? parseFloat(String(item.unitCost)).toFixed(2) : '0.00'}
                            </Text>
                        </View>
                    </PremiumCard>
                </Animated.View>

                {/* Sale Form */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <PremiumCard variant="elevated" style={styles.formCard}>
                        <Text style={[Typography.heading.sm, { color: theme.text, marginBottom: Spacing.lg }]}>
                            Sale Details
                        </Text>

                        <PremiumInput
                            label="Gross Sale Price (€) *"
                            value={price}
                            onChangeText={setPrice}
                            placeholder="0.00"
                            keyboardType="numeric"
                        />

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <PremiumInput
                                    label="Platform Fees"
                                    value={platformFees}
                                    onChangeText={setPlatformFees}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <PremiumInput
                                    label="Shipping"
                                    value={shippingFees}
                                    onChangeText={setShippingFees}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Net Calculation */}
                        <View style={[styles.calcCard, { backgroundColor: theme.surfaceSecondary }]}>
                            <View style={styles.calcRow}>
                                <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>Net Amount</Text>
                                <Text style={[Typography.number.md, { color: theme.text }]}>€{netAmount}</Text>
                            </View>
                            <View style={[styles.calcDivider, { backgroundColor: theme.divider }]} />
                            <View style={styles.calcRow}>
                                <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>Profit</Text>
                                <Text style={[
                                    Typography.number.lg,
                                    { color: parseFloat(profit) >= 0 ? theme.success : theme.danger }
                                ]}>
                                    {parseFloat(profit) >= 0 ? '+' : ''}€{profit}
                                </Text>
                            </View>
                        </View>
                    </PremiumCard>
                </Animated.View>
            </View>

            {/* Sticky CTA */}
            <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
                <LinearGradient
                    colors={[theme.background + '00', theme.background]}
                    style={styles.ctaGradient}
                />
                <PremiumButton
                    title={isSubmitting ? 'Recording...' : 'Record Sale'}
                    variant="success"
                    size="lg"
                    onPress={handleSave}
                    disabled={isSubmitting || !price}
                    icon={<MaterialIcons name="check-circle" size={20} color="#FFF" />}
                    style={styles.ctaButton}
                />
            </View>

            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    errorIcon: {
        width: 80,
        height: 80,
        borderRadius: Radius['2xl'],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    content: {
        flex: 1,
        padding: Spacing.xl,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    itemIcon: {
        width: 48,
        height: 48,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    itemInfo: {
        flex: 1,
    },
    formCard: {
        padding: Spacing.xl,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    halfInput: {
        flex: 1,
    },
    calcCard: {
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginTop: Spacing.lg,
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    calcDivider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    ctaContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
    },
    ctaGradient: {
        ...StyleSheet.absoluteFillObject,
        height: 80,
        top: -40,
    },
    ctaButton: {
        width: '100%',
    },
});
