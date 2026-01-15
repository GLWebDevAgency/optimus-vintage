/**
 * 💰 SALES SCREEN - Premium Transaction History
 */

import { FAB, GlassHeader, ListItem, PremiumCard } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { Sale, SalesRepository } from '@/db/repositories';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SalesScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [salesCount, setSalesCount] = useState(0);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await SalesRepository.getAll();
            setSales(data.reverse());
            
            const completed = data.filter(s => s.status === 'COMPLETED');
            const total = completed.reduce((sum, s) => sum + parseFloat(String(s.priceNet)), 0);
            setTotalRevenue(total);
            setSalesCount(completed.length);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const renderItem = ({ item, index }: { item: Sale; index: number }) => {
        const isCompleted = item.status === 'COMPLETED';
        
        return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
                <ListItem
                    title={`Lot #${item.lotId} • Item #${item.itemId}`}
                    subtitle={new Date(item.saleDate).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}
                    leftIcon={
                        <MaterialIcons 
                            name={isCompleted ? 'check-circle' : 'cancel'} 
                            size={20} 
                            color={isCompleted ? theme.success : theme.danger} 
                        />
                    }
                    rightContent={
                        <View style={styles.priceContainer}>
                            <Text style={[
                                Typography.number.sm,
                                { 
                                    color: isCompleted ? theme.success : theme.textMuted,
                                    textDecorationLine: isCompleted ? 'none' : 'line-through',
                                }
                            ]}>
                                {isCompleted ? '+' : ''}€{parseFloat(String(item.priceNet)).toFixed(2)}
                            </Text>
                            {!isCompleted && (
                                <Text style={[Typography.label.xs, { color: theme.danger }]}>
                                    {item.status}
                                </Text>
                            )}
                        </View>
                    }
                    badge={isCompleted ? undefined : { label: item.status, variant: 'danger' }}
                    showDivider={index < sales.length - 1}
                />
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <GlassHeader
                paddingTop={insets.top}
                title="Sales"
                leftContent={
                    <View>
                        <Text style={[Typography.display.sm, { color: theme.text }]}>Sales</Text>
                        <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                            Transactions & Revenue
                        </Text>
                    </View>
                }
                rightContent={
                    <Pressable
                        style={styles.addButton}
                        onPress={() => router.push('/sales/new')}
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

            <View style={{ paddingTop: insets.top + 100, flex: 1 }}>
                {/* Revenue KPI Card */}
                <Animated.View 
                    style={styles.kpiSection}
                    entering={FadeInDown.delay(100).duration(500)}
                >
                    <PremiumCard variant="elevated" style={styles.revenueCard}>
                        <View style={styles.revenueContent}>
                            <View>
                                <Text style={[Typography.label.sm, { color: theme.textMuted }]}>
                                    YEAR TO DATE PROFIT
                                </Text>
                                <Text style={[Typography.number.hero, { color: theme.success, marginTop: 4 }]}>
                                    €{totalRevenue.toFixed(2)}
                                </Text>
                                <View style={styles.revenueStats}>
                                    <View style={styles.revenueStat}>
                                        <MaterialIcons name="receipt" size={14} color={theme.textMuted} />
                                        <Text style={[Typography.body.sm, { color: theme.textSecondary }]}>
                                            {salesCount} transactions
                                        </Text>
                                    </View>
                                    <View style={styles.revenueStat}>
                                        <MaterialIcons name="trending-up" size={14} color={theme.success} />
                                        <Text style={[Typography.body.sm, { color: theme.success }]}>
                                            +12% vs last month
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.revenueIcon, { backgroundColor: theme.successSubtle }]}>
                                <MaterialIcons name="account-balance-wallet" size={32} color={theme.success} />
                            </View>
                        </View>
                    </PremiumCard>
                </Animated.View>

                {/* Sales List */}
                <PremiumCard variant="default" style={styles.listCard}>
                    <View style={styles.listHeader}>
                        <Text style={[Typography.heading.sm, { color: theme.text }]}>
                            Recent Transactions
                        </Text>
                        <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                            {sales.length} total
                        </Text>
                    </View>
                    
                    <FlatList
                        data={sales}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        refreshControl={
                            <RefreshControl 
                                refreshing={loading} 
                                onRefresh={loadData} 
                                tintColor={theme.primary}
                            />
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            !loading ? (
                                <View style={styles.empty}>
                                    <View style={[styles.emptyIcon, { backgroundColor: theme.primaryMuted }]}>
                                        <MaterialIcons name="point-of-sale" size={40} color={theme.primary} />
                                    </View>
                                    <Text style={[Typography.heading.md, { color: theme.text, marginTop: Spacing.lg }]}>
                                        No Sales Yet
                                    </Text>
                                    <Text style={[Typography.body.sm, { color: theme.textMuted, textAlign: 'center' }]}>
                                        Record your first sale from the Stock screen
                                    </Text>
                                </View>
                            ) : null
                        }
                    />
                </PremiumCard>
            </View>

            <FAB
                icon={<MaterialIcons name="add" size={28} color="#FFF" />}
                onPress={() => router.push('/sales/new')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    addButton: {
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
    kpiSection: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    revenueCard: {
        padding: Spacing['2xl'],
    },
    revenueContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    revenueStats: {
        marginTop: Spacing.md,
        gap: Spacing.xs,
    },
    revenueStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    revenueIcon: {
        width: 64,
        height: 64,
        borderRadius: Radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listCard: {
        flex: 1,
        marginHorizontal: Spacing.xl,
        marginBottom: 100,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    empty: {
        alignItems: 'center',
        paddingVertical: Spacing['4xl'],
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: Radius['2xl'],
        alignItems: 'center',
        justifyContent: 'center',
    },
});
