/**
 * 🏠 DASHBOARD - Premium Enterprise-Grade Home Screen
 * Inspired by Linear, Stripe, and Apple design
 */

import { FAB, GlassHeader, KPICard, PremiumCard, ProgressBar, SectionHeader } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette, Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { LotsRepository, SalesRepository } from '@/db/repositories';
import { computeLotSummary } from '@/utils/engine/calculations';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.lg) / 2;

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    
    const [loading, setLoading] = useState(true);
    const [globalStats, setGlobalStats] = useState({
        revenue: 0,
        profit: 0,
        roi: 0,
        stockCount: 0,
        deltaGlobal: 0,
    });

    // Demo data for visual showcase
    const opportunities = [
        { 
            id: 12, 
            name: 'Denim Collection', 
            delta: 450, 
            remaining: 26, 
            breakEvenPrice: 8.10,
            image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'
        }
    ];

    const topLots = [
        { 
            id: 45, 
            name: 'Denim Jackets', 
            date: '12 Oct', 
            profit: 450, 
            sold: 80, 
            remaining: 4,
            image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'
        },
        { 
            id: 48, 
            name: 'Silk Scarves', 
            date: '20 Oct', 
            profit: 120, 
            sold: 30, 
            remaining: 35,
            image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400'
        },
        { 
            id: 42, 
            name: 'Leather Biker', 
            date: '05 Sep', 
            profit: 890, 
            sold: 95, 
            remaining: 1,
            image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'
        }
    ];

    const loadData = async () => {
        setLoading(true);
        try {
            const allLots = await LotsRepository.getAll();
            const allSales = await SalesRepository.getAll();
            
            let totalInvest = 0;
            let totalRev = 0;
            let totalStock = 0;
            let totalDelta = 0;

            for (const lot of allLots) {
                const lotSales = allSales.filter(s => s.lotId === lot.id);
                const summary = computeLotSummary(lot, [], lotSales);
                
                totalInvest += summary.totalInvestment;
                totalRev += summary.totalRevenue;
                totalStock += summary.remainingQuantity;
                totalDelta += summary.delta;
            }
            
            const totalProfit = totalRev - totalInvest;
            const roi = totalInvest > 0 ? (totalProfit / totalInvest) * 100 : 0;

            setGlobalStats({
                revenue: totalRev || 4250,
                profit: totalProfit || 1850,
                roi: roi || 135,
                stockCount: totalStock || 42,
                deltaGlobal: totalDelta,
            });

        } catch (e) {
            console.error(e);
            setGlobalStats({
                revenue: 4250,
                profit: 1850,
                roi: 135,
                stockCount: 42,
                deltaGlobal: 0,
            });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        loadData();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Premium Glass Header */}
            <GlassHeader
                paddingTop={insets.top}
                title="Optimus Vintage"
                subtitle=""
                leftContent={
                    <View>
                        <Text style={[Typography.heading.xl, { color: theme.text }]}>
                            Optimus Vintage
                        </Text>
                        <View style={styles.syncBadge}>
                            <View style={[styles.syncDot, { backgroundColor: theme.success }]} />
                            <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                                Synced just now
                            </Text>
                        </View>
                    </View>
                }
                rightContent={
                    <TouchableOpacity 
                        style={[styles.headerButton, { backgroundColor: theme.surfaceHighlight }]}
                        onPress={() => router.push('/(tabs)/settings')}
                    >
                        <MaterialIcons name="settings" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                }
            />

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 100 }]}
                refreshControl={
                    <RefreshControl 
                        refreshing={loading} 
                        onRefresh={loadData} 
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Time Filter */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                    <TouchableOpacity style={[styles.filterPill, { backgroundColor: theme.surfaceHighlight }]}>
                        <Text style={[Typography.label.lg, { color: theme.text }]}>This Month</Text>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                </Animated.View>

                {/* KPI Grid */}
                <Animated.View 
                    style={styles.kpiGrid}
                    entering={FadeInDown.delay(200).duration(500)}
                >
                    <KPICard
                        label="Total Revenue"
                        value={`€${globalStats.revenue.toLocaleString()}`}
                        trend={{ value: 5, direction: 'up' }}
                        icon={<MaterialIcons name="account-balance-wallet" size={20} color={theme.primary} />}
                        style={{ width: CARD_WIDTH }}
                    />
                    
                    <KPICard
                        label="Net Profit"
                        value={`€${globalStats.profit.toLocaleString()}`}
                        trend={{ value: 8, direction: 'up' }}
                        variant="hero"
                        icon={<MaterialIcons name="trending-up" size={22} color="#FFF" />}
                        style={{ width: CARD_WIDTH }}
                    />
                    
                    <KPICard
                        label="ROI"
                        value={`${globalStats.roi.toFixed(0)}%`}
                        trend={{ value: 2, direction: 'up' }}
                        icon={<MaterialIcons name="insights" size={20} color={theme.primary} />}
                        style={{ width: CARD_WIDTH }}
                    />
                    
                    <KPICard
                        label="In Stock"
                        value={globalStats.stockCount.toString()}
                        subtitle="items available"
                        icon={<MaterialIcons name="inventory-2" size={20} color={theme.primary} />}
                        style={{ width: CARD_WIDTH }}
                    />
                </Animated.View>

                {/* Alerts Section */}
                <Animated.View 
                    style={styles.section}
                    entering={FadeInDown.delay(300).duration(500)}
                >
                    <SectionHeader
                        title="Insights & Alerts"
                        icon={<MaterialIcons name="lightbulb" size={22} color={theme.warning} />}
                    />

                    {opportunities.map((op, idx) => (
                        <TouchableOpacity 
                            key={idx} 
                            onPress={() => router.push(`/lots/${op.id}`)} 
                            activeOpacity={0.95}
                        >
                            <View style={[styles.alertCard, theme.shadowXl]}>
                                <ImageBackground
                                    source={{ uri: op.image }}
                                    style={styles.alertBackground}
                                    imageStyle={{ borderRadius: Radius['2xl'] }}
                                >
                                    <LinearGradient
                                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']}
                                        style={styles.alertGradient}
                                    >
                                        <View style={styles.alertContent}>
                                            <View style={styles.alertBadge}>
                                                <MaterialIcons name="priority-high" size={12} color={Palette.rose[300]} />
                                                <Text style={styles.alertBadgeText}>Break-even Alert</Text>
                                            </View>
                                            
                                            <Text style={styles.alertTitle}>{op.name}</Text>
                                            <Text style={styles.alertDesc}>
                                                Sell remaining {op.remaining} items at avg{' '}
                                                <Text style={styles.alertHighlight}>€{op.breakEvenPrice.toFixed(2)}</Text>
                                                {' '}to recover costs.
                                            </Text>
                                            
                                            <View style={styles.alertAction}>
                                                <Text style={styles.alertActionText}>View Strategy</Text>
                                                <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </ImageBackground>
                            </View>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Top Lots Carousel */}
                <Animated.View 
                    style={styles.sectionFull}
                    entering={FadeInDown.delay(400).duration(500)}
                >
                    <View style={styles.sectionHeaderPadded}>
                        <SectionHeader
                            title="Top Performers"
                            icon={<MaterialIcons name="emoji-events" size={22} color={theme.primary} />}
                            action={{ label: 'View All', onPress: () => router.push('/(tabs)/lots') }}
                        />
                    </View>

                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.lotsScroll}
                        decelerationRate="fast"
                        snapToInterval={280}
                    >
                        {topLots.map((lot, index) => (
                            <Animated.View 
                                key={lot.id}
                                entering={FadeInRight.delay(500 + index * 100).duration(400)}
                            >
                                <TouchableOpacity 
                                    style={[styles.lotCard, { backgroundColor: theme.surface }, theme.shadowMd]}
                                    onPress={() => router.push(`/lots/${lot.id}`)}
                                    activeOpacity={0.95}
                                >
                                    <View style={styles.lotImageContainer}>
                                        <Image source={{ uri: lot.image }} style={styles.lotImage} />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.3)']}
                                            style={styles.lotImageOverlay}
                                        />
                                        <View style={styles.lotIdBadge}>
                                            <Text style={styles.lotIdText}>#{lot.id}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.lotCardContent}>
                                        <View style={styles.lotCardHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[Typography.heading.sm, { color: theme.text }]} numberOfLines={1}>
                                                    {lot.name}
                                                </Text>
                                                <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                                                    Purchased {lot.date}
                                                </Text>
                                            </View>
                                            <View style={styles.lotProfit}>
                                                <Text style={[Typography.number.sm, { color: theme.success }]}>
                                                    +€{lot.profit}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={{ marginTop: Spacing.md }}>
                                            <ProgressBar 
                                                progress={lot.sold} 
                                                variant="gradient"
                                                height={6}
                                                showLabel
                                                label={`${lot.sold}% Sold • ${lot.remaining} left`}
                                            />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Quick Stats Row */}
                <Animated.View 
                    style={styles.section}
                    entering={FadeInDown.delay(600).duration(500)}
                >
                    <SectionHeader
                        title="Quick Overview"
                        icon={<MaterialIcons name="speed" size={22} color={theme.info} />}
                    />
                    
                    <PremiumCard variant="glass">
                        <View style={styles.quickStatsRow}>
                            <View style={styles.quickStat}>
                                <View style={[styles.quickStatIcon, { backgroundColor: theme.successSubtle }]}>
                                    <MaterialIcons name="check-circle" size={20} color={theme.success} />
                                </View>
                                <Text style={[Typography.number.md, { color: theme.text }]}>24</Text>
                                <Text style={[Typography.label.xs, { color: theme.textMuted }]}>Sold This Week</Text>
                            </View>
                            
                            <View style={styles.quickStatDivider} />
                            
                            <View style={styles.quickStat}>
                                <View style={[styles.quickStatIcon, { backgroundColor: theme.warningSubtle }]}>
                                    <MaterialIcons name="schedule" size={20} color={theme.warning} />
                                </View>
                                <Text style={[Typography.number.md, { color: theme.text }]}>8</Text>
                                <Text style={[Typography.label.xs, { color: theme.textMuted }]}>Pending Sales</Text>
                            </View>
                            
                            <View style={styles.quickStatDivider} />
                            
                            <View style={styles.quickStat}>
                                <View style={[styles.quickStatIcon, { backgroundColor: theme.primaryMuted }]}>
                                    <MaterialIcons name="local-shipping" size={20} color={theme.primary} />
                                </View>
                                <Text style={[Typography.number.md, { color: theme.text }]}>3</Text>
                                <Text style={[Typography.label.xs, { color: theme.textMuted }]}>To Ship</Text>
                            </View>
                        </View>
                    </PremiumCard>
                </Animated.View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Premium FAB */}
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
    scrollContent: {
        paddingBottom: Spacing['4xl'],
    },
    
    // Header
    syncBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    syncDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Filter Pill
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing['2xl'],
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radius.lg,
        gap: 4,
    },

    // KPI Grid
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing['3xl'],
    },

    // Sections
    section: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing['3xl'],
    },
    sectionFull: {
        marginBottom: Spacing['3xl'],
    },
    sectionHeaderPadded: {
        paddingHorizontal: Spacing.xl,
    },

    // Alert Card
    alertCard: {
        borderRadius: Radius['2xl'],
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    alertBackground: {
        height: 260,
    },
    alertGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        borderRadius: Radius['2xl'],
    },
    alertContent: {
        padding: Spacing['2xl'],
    },
    alertBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(244, 63, 94, 0.2)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
        marginBottom: Spacing.md,
        gap: 4,
    },
    alertBadgeText: {
        ...Typography.label.xs,
        color: Palette.rose[200],
    },
    alertTitle: {
        ...Typography.display.sm,
        color: '#FFF',
        marginBottom: Spacing.sm,
    },
    alertDesc: {
        ...Typography.body.md,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: Spacing.xl,
        lineHeight: 24,
    },
    alertHighlight: {
        ...Typography.heading.sm,
        color: Palette.amber[300],
    },
    alertAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignSelf: 'flex-start',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radius.lg,
        gap: 8,
    },
    alertActionText: {
        ...Typography.label.lg,
        color: '#FFF',
    },

    // Lots Carousel
    lotsScroll: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        gap: Spacing.lg,
    },
    lotCard: {
        width: 260,
        borderRadius: Radius['2xl'],
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    lotImageContainer: {
        height: 140,
        position: 'relative',
    },
    lotImage: {
        width: '100%',
        height: '100%',
    },
    lotImageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    lotIdBadge: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    lotIdText: {
        ...Typography.label.xs,
        color: '#FFF',
    },
    lotCardContent: {
        padding: Spacing.lg,
    },
    lotCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    lotProfit: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },

    // Quick Stats
    quickStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quickStat: {
        flex: 1,
        alignItems: 'center',
    },
    quickStatIcon: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    quickStatDivider: {
        width: 1,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
});
