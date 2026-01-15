/**
 * ➕ NEW LOT SCREEN - Premium Form Experience
 * Redesigned with modern UI patterns
 */

import { PremiumButton } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { ItemsRepository, LotsRepository } from '@/db/repositories';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Provider options
const PROVIDERS = [
    { id: 'eureka', label: 'Eureka', icon: 'store' },
    { id: 'fleek', label: 'Fleek', icon: 'local-shipping' },
    { id: 'personnel', label: 'Personnel', icon: 'person' },
] as const;

// Lot types - must match API validation: 'BULK' | 'PIECEWISE'
const LOT_TYPES = [
    { id: 'BULK', label: 'Bulk / Kilo' },
    { id: 'PIECEWISE', label: 'Piecewise' },
] as const;

export default function AddLotScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    
    // Form state
    const [provider, setProvider] = useState('');
    const [buyDate, setBuyDate] = useState(new Date());
    const [showDateSelector, setShowDateSelector] = useState(false);
    const [lotType, setLotType] = useState('BULK');
    
    // Financials
    const [totalCost, setTotalCost] = useState('');
    const [shippingCost, setShippingCost] = useState('');
    
    // Items
    const [quantity, setQuantity] = useState(0);
    const [itemSetupMode, setItemSetupMode] = useState<'bulk' | 'manual' | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculations
    const totalAmount = (parseFloat(totalCost) || 0) + (parseFloat(shippingCost) || 0);
    const unitCost = quantity > 0 ? (totalAmount / quantity).toFixed(2) : '0.00';

    // Generate date options for the picker (last 30 days + next 7 days)
    const generateDateOptions = () => {
        const dates: Date[] = [];
        const today = new Date();
        for (let i = -30; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d);
        }
        return dates;
    };
    const dateOptions = generateDateOptions();

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
        });
    };

    const formatDateFull = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const incrementQuantity = () => setQuantity(q => q + 1);
    const decrementQuantity = () => setQuantity(q => Math.max(0, q - 1));

    const handleCreate = async () => {
        if (!provider || !totalCost || quantity === 0) {
            Alert.alert("Missing Fields", "Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const cost = parseFloat(totalCost);
            const shipping = parseFloat(shippingCost) || 0;
            const uCost = (cost + shipping) / quantity;

            const newLot = await LotsRepository.create({
                provider,
                buyDate: buyDate.toISOString().split('T')[0],
                totalCost: cost.toFixed(2),
                additionalFees: shipping.toFixed(2),
                initialQuantity: quantity,
                type: lotType,
            });

            if (itemSetupMode === 'bulk') {
                const itemsToCreate = Array.from({ length: quantity }).map(() => ({
                    lotId: newLot.id,
                    unitCost: uCost.toFixed(2),
                    status: 'STOCK',
                    type: 'Clothing',
                    brand: 'Unknown',
                    condition: 'Good'
                }));
                await ItemsRepository.createBatch(itemsToCreate);
            }

            Alert.alert("Success! 🎉", "Lot created successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not create the lot.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <Stack.Screen 
                options={{ 
                    title: 'New Inventory Lot',
                    headerShown: true,
                    headerStyle: { backgroundColor: theme.surface },
                    headerTintColor: theme.text,
                    headerTitleStyle: Typography.heading.sm,
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} hitSlop={8}>
                            <MaterialIcons name="close" size={24} color={theme.text} />
                        </Pressable>
                    ),
                }} 
            />

            {/* Progress Bar */}
            <View style={[styles.progressContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: theme.primary, width: '33%' }]} />
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: totalCost ? theme.primary : 'transparent' }]} />
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: quantity > 0 ? theme.primary : 'transparent' }]} />
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Step 1: The Basics */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>Step 1: The Basics</Text>
                    
                    {/* Supplier Selector */}
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>SUPPLIER</Text>
                    <View style={styles.typeSelector}>
                        {PROVIDERS.map((p) => (
                            <Pressable
                                key={p.id}
                                style={[
                                    styles.providerChip,
                                    { 
                                        backgroundColor: provider === p.id ? theme.primary : theme.surface,
                                        borderColor: provider === p.id ? theme.primary : theme.border,
                                    }
                                ]}
                                onPress={() => setProvider(p.id)}
                            >
                                <MaterialIcons 
                                    name={p.icon as any} 
                                    size={18} 
                                    color={provider === p.id ? '#FFF' : theme.textSecondary} 
                                />
                                <Text style={[
                                    styles.typeLabel,
                                    { color: provider === p.id ? '#FFF' : theme.text }
                                ]}>
                                    {p.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Date Selector */}
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PURCHASE DATE</Text>
                    <Pressable 
                        style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => setShowDateSelector(!showDateSelector)}
                    >
                        <Text style={[styles.dateText, { color: theme.text }]}>
                            {formatDate(buyDate)}
                        </Text>
                        <MaterialIcons 
                            name={showDateSelector ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                            size={24} 
                            color={theme.primary} 
                        />
                    </Pressable>
                    
                    {/* Inline Date Options */}
                    {showDateSelector && (
                        <Animated.View 
                            entering={FadeInDown.duration(200)}
                            style={[styles.inlineDatePicker, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        >
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.dateChipsContainer}
                            >
                                {dateOptions.slice(25, 38).map((date, index) => {
                                    const isSelected = date.toDateString() === buyDate.toDateString();
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    return (
                                        <Pressable
                                            key={index}
                                            style={[
                                                styles.dateChip,
                                                { 
                                                    backgroundColor: isSelected ? theme.primary : theme.background,
                                                    borderColor: isToday && !isSelected ? theme.primary : theme.border,
                                                }
                                            ]}
                                            onPress={() => {
                                                setBuyDate(date);
                                                setShowDateSelector(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dateChipDay,
                                                { color: isSelected ? '#FFF' : theme.textSecondary }
                                            ]}>
                                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </Text>
                                            <Text style={[
                                                styles.dateChipNumber,
                                                { color: isSelected ? '#FFF' : theme.text }
                                            ]}>
                                                {date.getDate()}
                                            </Text>
                                            {isToday && (
                                                <View style={[styles.todayDot, { backgroundColor: isSelected ? '#FFF' : theme.primary }]} />
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* Lot Type */}
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>LOT TYPE</Text>
                    <View style={styles.typeSelector}>
                        {LOT_TYPES.map((type) => (
                            <Pressable
                                key={type.id}
                                style={[
                                    styles.typeOption,
                                    { 
                                        backgroundColor: lotType === type.id ? theme.primary : theme.surface,
                                        borderColor: lotType === type.id ? theme.primary : theme.border,
                                    }
                                ]}
                                onPress={() => setLotType(type.id)}
                            >
                                <Text style={[
                                    styles.typeLabel,
                                    { color: lotType === type.id ? '#FFF' : theme.text }
                                ]}>
                                    {type.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* Step 2: Financials */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>Step 2: Financials</Text>
                    
                    <View style={styles.financialsRow}>
                        {/* Total Cost */}
                        <View style={styles.financialField}>
                            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>TOTAL COST</Text>
                            <View style={[styles.currencyInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.currencySymbol, { color: theme.primary }]}>€</Text>
                                <TextInput
                                    style={[styles.currencyValue, { color: theme.text }]}
                                    value={totalCost}
                                    onChangeText={setTotalCost}
                                    placeholder="0.00"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        {/* Shipping */}
                        <View style={styles.financialField}>
                            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>SHIPPING</Text>
                            <View style={[styles.currencyInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.currencySymbol, { color: theme.primary }]}>€</Text>
                                <TextInput
                                    style={[styles.currencyValue, { color: theme.text }]}
                                    value={shippingCost}
                                    onChangeText={setShippingCost}
                                    placeholder="0.00"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Item Count with +/- buttons */}
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>TOTAL ITEM COUNT</Text>
                    <View style={[styles.quantityContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Pressable 
                            style={[styles.quantityButton, { backgroundColor: theme.primaryMuted }]}
                            onPress={decrementQuantity}
                        >
                            <MaterialIcons name="remove" size={24} color={theme.primary} />
                        </Pressable>
                        
                        <TextInput
                            style={[styles.quantityInput, { color: theme.text }]}
                            value={quantity.toString()}
                            onChangeText={(t) => setQuantity(parseInt(t) || 0)}
                            keyboardType="number-pad"
                            textAlign="center"
                        />
                        
                        <Pressable 
                            style={[styles.quantityButton, { backgroundColor: theme.primaryMuted }]}
                            onPress={incrementQuantity}
                        >
                            <MaterialIcons name="add" size={24} color={theme.primary} />
                        </Pressable>
                    </View>

                    {/* Estimated Cost Card */}
                    <View style={[styles.estimatedCard, { backgroundColor: theme.primaryMuted }]}>
                        <Text style={[styles.estimatedLabel, { color: theme.primary }]}>
                            ESTIMATED COST
                        </Text>
                        <Text style={[styles.estimatedSubLabel, { color: theme.textSecondary }]}>
                            Per individual item
                        </Text>
                        <Text style={[styles.estimatedValue, { color: theme.text }]}>
                            €{unitCost}
                        </Text>
                    </View>
                </Animated.View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* Step 3: Setup Items */}
                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>Step 3: Setup Items</Text>

                    {/* Bulk Generate Option */}
                    <Pressable
                        style={[
                            styles.setupOption,
                            { 
                                backgroundColor: theme.surface, 
                                borderColor: itemSetupMode === 'bulk' ? theme.primary : theme.border 
                            }
                        ]}
                        onPress={() => setItemSetupMode('bulk')}
                    >
                        <View style={[styles.setupIcon, { backgroundColor: theme.primaryMuted }]}>
                            <MaterialIcons name="auto-awesome" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.setupText}>
                            <Text style={[styles.setupTitle, { color: theme.text }]}>Bulk Generate</Text>
                            <Text style={[styles.setupDesc, { color: theme.textSecondary }]}>
                                Create anonymous IDs automatically (e.g. Lot-001)
                            </Text>
                        </View>
                        <View style={[
                            styles.radioOuter, 
                            { borderColor: itemSetupMode === 'bulk' ? theme.primary : theme.border }
                        ]}>
                            {itemSetupMode === 'bulk' && (
                                <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                            )}
                        </View>
                    </Pressable>

                    {/* Manual Entry Option */}
                    <Pressable
                        style={[
                            styles.setupOption,
                            { 
                                backgroundColor: theme.surface, 
                                borderColor: itemSetupMode === 'manual' ? theme.primary : theme.border 
                            }
                        ]}
                        onPress={() => setItemSetupMode('manual')}
                    >
                        <View style={[styles.setupIcon, { backgroundColor: theme.primaryMuted }]}>
                            <MaterialIcons name="edit-note" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.setupText}>
                            <Text style={[styles.setupTitle, { color: theme.text }]}>Manual Entry</Text>
                            <Text style={[styles.setupDesc, { color: theme.textSecondary }]}>
                                Log each item's details individually now
                            </Text>
                        </View>
                        <View style={[
                            styles.radioOuter, 
                            { borderColor: itemSetupMode === 'manual' ? theme.primary : theme.border }
                        ]}>
                            {itemSetupMode === 'manual' && (
                                <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                            )}
                        </View>
                    </Pressable>
                </Animated.View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.md }]}>
                <View style={styles.footerInfo}>
                    <Text style={[styles.footerStep, { color: theme.primary }]}>Step 1 of 3</Text>
                    <Text style={[styles.footerNext, { color: theme.textSecondary }]}>Next: Financials</Text>
                </View>
                <PremiumButton
                    title={isSubmitting ? 'Creating...' : 'Continue'}
                    variant="primary"
                    size="lg"
                    onPress={handleCreate}
                    disabled={isSubmitting || !provider}
                    icon={<MaterialIcons name="arrow-forward" size={20} color="#FFF" />}
                    style={styles.continueButton}
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
    progressContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
    },
    progressTrack: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        width: '100%',
        borderRadius: 2,
    },
    content: {
        padding: Spacing.xl,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: Spacing.lg,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    dropdownText: {
        fontSize: 16,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    dateText: {
        fontSize: 16,
    },
    dateModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    dateModalContent: {
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        padding: Spacing.xl,
    },
    dateModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: Spacing.sm,
        flexWrap: 'wrap',
    },
    typeOption: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    typeLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    providerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    inlineDatePicker: {
        marginTop: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    dateChipsContainer: {
        paddingHorizontal: Spacing.sm,
        gap: Spacing.sm,
    },
    dateChip: {
        width: 56,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    dateChipDay: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 4,
    },
    dateChipNumber: {
        fontSize: 18,
        fontWeight: '700',
    },
    todayDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginTop: 4,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.xl,
    },
    financialsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    financialField: {
        flex: 1,
    },
    currencyInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: '600',
    },
    currencyValue: {
        flex: 1,
        fontSize: 16,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    quantityButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        paddingVertical: Spacing.md,
    },
    estimatedCard: {
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        marginTop: Spacing.lg,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    estimatedLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    estimatedSubLabel: {
        fontSize: 13,
        width: '60%',
    },
    estimatedValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    setupOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
        gap: Spacing.md,
    },
    setupIcon: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setupText: {
        flex: 1,
    },
    setupTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    setupDesc: {
        fontSize: 12,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    footerStep: {
        fontSize: 13,
        fontWeight: '600',
    },
    footerNext: {
        fontSize: 13,
    },
    continueButton: {
        width: '100%',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: Spacing.xl,
    },
    modalContent: {
        width: '100%',
        borderRadius: Radius.xl,
        padding: Spacing.xl,
    },
    providerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
    },
    providerLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    dateScrollView: {
        maxHeight: 300,
    },
    dateOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderRadius: Radius.lg,
    },
    dateOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    dateOptionText: {
        fontSize: 16,
        fontWeight: '500',
    },
    todayBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    todayBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFF',
    },
});
