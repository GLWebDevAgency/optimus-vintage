/**
 * 📦 LOTS SCREEN - Premium Enterprise Inventory Management
 */

import { FAB, GlassHeader, PremiumBadge, ProgressBar } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { ItemsRepository, Lot, LotsRepository, SalesRepository } from '@/db/repositories';
import { computeLotSummary, LotSummary } from '@/utils/engine/calculations';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LotWithSummary extends Lot {
    summary: LotSummary;
}

export default function LotsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const [lots, setLots] = useState<LotWithSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLots = async () => {
        setLoading(true);
        try {
            const allLots = await LotsRepository.getAll();
            const enriched = await Promise.all(allLots.map(async (lot) => {
                const items = await ItemsRepository.getByLotId(lot.id);
                const sales = await SalesRepository.getByLotId(lot.id);
                const summary = computeLotSummary(lot, items, sales);
                return { ...lot, summary };
            }));
            setLots(enriched.reverse());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadLots(); }, []));

    const LotCard = ({ item, index }: { item: LotWithSummary; index: number }) => {
        const scaleAnim = useRef(new Animated.Value(1)).current;
        
        const handlePressIn = () => {
            Animated.spring(scaleAnim, {
                toValue: 0.98,
                useNativeDriver: true,
                friction: 8,
            }).start();
        };
        
        const handlePressOut = () => {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 5,
            }).start();
        };

        const isProfitable = item.summary.delta <= 0;
        const progressPercent = item.summary.initialQuantity > 0 
            ? (item.summary.soldQuantity / item.summary.initialQuantity) * 100 
            : 0;

        return (
            <Pressable
                onPress={() => router.push(`/lots/${item.id}`)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <Animated.View 
                    style={[
                        styles.lotCard, 
                        { 
                            backgroundColor: theme.surface,
                            borderColor: theme.borderCard,
                            transform: [{ scale: scaleAnim }],
                        },
                        theme.shadowMd
                    ]}
                >
                    {/* Header Row */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primaryMuted }]}>
                            <MaterialIcons name="inventory-2" size={22} color={theme.primary} />
                        </View>
                        <View style={styles.cardTitleContainer}>
                            <Text style={[Typography.heading.sm, { color: theme.text }]} numberOfLines={1}>
                                {item.name || `Lot #${item.id}`}
                            </Text>
                            <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                                {item.provider} • {item.buyDate}
                            </Text>
                        </View>
                        <PremiumBadge 
                            label={isProfitable ? 'Profit' : 'Active'}
                            variant={isProfitable ? 'success' : 'gold'}
                        />
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={[Typography.label.xs, { color: theme.textMuted }]}>ITEMS</Text>
                            <Text style={[Typography.number.md, { color: theme.text }]}>
                                {item.summary.initialQuantity}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[Typography.label.xs, { color: theme.textMuted }]}>INVESTED</Text>
                            <Text style={[Typography.number.md, { color: theme.text }]}>
                                €{item.summary.totalInvestment}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[Typography.label.xs, { color: theme.textMuted }]}>REVENUE</Text>
                            <Text style={[Typography.number.md, { color: theme.text }]}>
                                €{item.summary.totalRevenue}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[Typography.label.xs, { color: theme.textMuted }]}>DELTA</Text>
                            <Text style={[
                                Typography.number.md, 
                                { color: isProfitable ? theme.success : theme.danger }
                            ]}>
                                {isProfitable ? '+' : '-'}€{Math.abs(item.summary.delta).toFixed(0)}
                            </Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={{ marginTop: Spacing.lg }}>
                        <ProgressBar 
                            progress={progressPercent}
                            variant="gradient"
                            height={6}
                            showLabel
                            label={`${item.summary.soldQuantity}/${item.summary.initialQuantity} Sold`}
                        />
                    </View>
                </Animated.View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <GlassHeader
                paddingTop={insets.top}
                title="My Lots"
                leftContent={
                    <View>
                        <Text style={[Typography.display.sm, { color: theme.text }]}>My Lots</Text>
                        <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                            Batches & Inventory
                        </Text>
                    </View>
                }
                rightContent={
                    <Pressable
                        style={styles.addButtonSmall}
                        onPress={() => router.push('/lots/new')}
                    >
                        <LinearGradient
                            colors={theme.gradientGold as unknown as [string, string, ...string[]]}
                            style={[styles.addButtonGradient, theme.shadowGlow]}
                        >
                            <MaterialIcons name="add" size={24} color="#FFF" />
                        </LinearGradient>
                    </Pressable>
                }
            />

            <FlatList
                data={lots}
                renderItem={({ item, index }) => <LotCard item={item} index={index} />}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 110 }]}
                refreshControl={
                    <RefreshControl 
                        refreshing={loading} 
                        onRefresh={loadLots} 
                        tintColor={theme.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIcon, { backgroundColor: theme.primaryMuted }]}>
                                <MaterialIcons name="inventory-2" size={48} color={theme.primary} />
                            </View>
                            <Text style={[Typography.heading.lg, { color: theme.text, marginTop: Spacing.xl }]}>
                                No Lots Yet
                            </Text>
                            <Text style={[Typography.body.md, { color: theme.textMuted, textAlign: 'center', marginTop: Spacing.sm }]}>
                                Start tracking your inventory batches{'\n'}by adding your first lot.
                            </Text>
                        </View>
                    ) : null
                }
            />

            <FAB
                icon={<MaterialIcons name="add" size={28} color="#FFF" />}
                onPress={() => router.push('/lots/new')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    addButtonSmall: {
        width: 44,
        height: 44,
    },
    addButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 140,
    },
    lotCard: {
        borderRadius: Radius['2xl'],
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitleContainer: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: Spacing['6xl'],
        paddingHorizontal: Spacing['2xl'],
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: Radius['3xl'],
        alignItems: 'center',
        justifyContent: 'center',
    },
});
