/**
 * 📦 LOT DETAIL SCREEN - Premium Financial Analytics
 * Enterprise-grade lot management with real-time insights
 */

import { PremiumButton } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette, Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { Item, ItemsRepository, Lot, LotsRepository, Sale, SalesRepository } from '@/db/repositories';
import { computeLotSummary, computeProtection, LotSummary, ProtectionAnalysis } from '@/utils/engine/calculations';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Segment options for items view
type SegmentOption = 'top' | 'losses' | 'all';

// Extended item type with sale info
interface ItemWithSale extends Item {
    sale?: Sale;
    profit?: number;
}

export default function LotDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const isDark = colorScheme === 'dark';
    
    const [lot, setLot] = useState<Lot | null>(null);
    const [summary, setSummary] = useState<LotSummary | null>(null);
    const [protection, setProtection] = useState<ProtectionAnalysis | null>(null);
    const [items, setItems] = useState<ItemWithSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSegment, setActiveSegment] = useState<SegmentOption>('all');

    useEffect(() => {
        if (id) loadData(parseInt(id));
    }, [id]);

    const loadData = async (lotId: number) => {
        setLoading(true);
        try {
            const [l, i, s] = await Promise.all([
                LotsRepository.getById(lotId),
                ItemsRepository.getByLotId(lotId),
                SalesRepository.getByLotId(lotId)
            ]);

            if (l) {
                setLot(l);

                // Merge items with their sales
                const itemsWithSales: ItemWithSale[] = i.map(item => {
                    const itemSale = s.find(sale => sale.itemId === item.id);
                    const unitCost = parseFloat(String(item.unitCost)) || 0;
                    const saleNet = itemSale ? parseFloat(String(itemSale.priceNet)) || 0 : 0;
                    return {
                        ...item,
                        sale: itemSale,
                        profit: itemSale ? saleNet - unitCost : undefined
                    };
                });
                setItems(itemsWithSales);

                const summ = computeLotSummary(l, i, s);
                setSummary(summ);

                const prot = computeProtection(summ.delta, summ.remainingQuantity, 0);
                setProtection(prot);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Filter items based on segment
    const getFilteredItems = (): ItemWithSale[] => {
        switch (activeSegment) {
            case 'top':
                return items
                    .filter(i => i.status === 'SOLD' && (i.profit ?? 0) > 0)
                    .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0));
            case 'losses':
                return items
                    .filter(i => i.status === 'SOLD' && (i.profit ?? 0) < 0)
                    .sort((a, b) => (a.profit ?? 0) - (b.profit ?? 0));
            case 'all':
            default:
                return items;
        }
    };

    const formatCurrency = (value: number) => `€${Math.abs(value).toFixed(2)}`;
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1d ago';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString();
    };

    const getROILabel = (roi: number): { label: string; color: string } => {
        if (roi >= 50) return { label: 'Awesome', color: theme.success };
        if (roi >= 25) return { label: 'Great', color: Palette.emerald[500] };
        if (roi >= 0) return { label: 'Good', color: theme.primary };
        if (roi >= -25) return { label: 'Poor', color: Palette.amber[500] };
        return { label: 'Loss', color: theme.danger };
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!lot || !summary || !protection) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.errorIcon, { backgroundColor: theme.dangerSubtle }]}>
                    <MaterialIcons name="error-outline" size={40} color={theme.danger} />
                </View>
                <Text style={[Typography.heading.md, { color: theme.text }]}>Lot Not Found</Text>
                <PremiumButton 
                    title="Go Back" 
                    variant="ghost" 
                    onPress={() => router.back()} 
                    style={{ marginTop: Spacing.lg }}
                />
            </View>
        );
    }

    const roiInfo = getROILabel(summary.roiPercent);
    const recoveryPercent = summary.totalInvestment > 0 
        ? Math.min(100, (summary.totalRevenue / summary.totalInvestment) * 100)
        : 0;
    const filteredItems = getFilteredItems();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Custom Header */}
            <Animated.View 
                entering={FadeIn.duration(300)}
                style={[
                    styles.header, 
                    { 
                        backgroundColor: isDark ? 'rgba(26, 23, 20, 0.95)' : 'rgba(247, 247, 246, 0.95)',
                        paddingTop: insets.top,
                        borderBottomColor: theme.border 
                    }
                ]}
            >
                <Pressable 
                    onPress={() => router.back()} 
                    style={styles.headerButton}
                    hitSlop={8}
                >
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                    Lot #{lot.id} - {lot.name || lot.provider}
                </Text>
                <Pressable style={styles.headerButton} hitSlop={8}>
                    <MaterialIcons name="edit" size={24} color={theme.primary} />
                </Pressable>
            </Animated.View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Grid */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsGrid}>
                    {/* Total Invested */}
                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Invested</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {formatCurrency(summary.totalInvestment)}
                        </Text>
                    </View>
                    
                    {/* Total Returned */}
                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Returned</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {formatCurrency(summary.totalRevenue)}
                        </Text>
                    </View>
                    
                    {/* ROI Full Width */}
                    <View style={[styles.statCardFull, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.roiLeft}>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Return on Investment</Text>
                            <Text style={[styles.roiValue, { color: theme.text }]}>
                                {summary.roiPercent >= 0 ? '+' : ''}{summary.roiPercent.toFixed(0)}%
                            </Text>
                        </View>
                        <View style={[styles.roiBadge, { backgroundColor: roiInfo.color + '20' }]}>
                            <MaterialIcons 
                                name={summary.roiPercent >= 0 ? "trending-up" : "trending-down"} 
                                size={16} 
                                color={roiInfo.color} 
                            />
                            <Text style={[styles.roiBadgeText, { color: roiInfo.color }]}>
                                {roiInfo.label}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Revenue Recovery */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <View style={[styles.recoveryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.recoveryHeader}>
                            <Text style={[styles.recoveryTitle, { color: theme.text }]}>Revenue Recovery</Text>
                            <Text style={[styles.recoveryProfit, { color: theme.textSecondary }]}>
                                {formatCurrency(summary.profit)} Net Profit
                            </Text>
                        </View>
                        
                        {/* Progress Bar */}
                        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { 
                                        backgroundColor: theme.primary,
                                        width: `${Math.min(recoveryPercent, 100)}%` 
                                    }
                                ]} 
                            />
                        </View>
                        
                        <View style={styles.progressLabels}>
                            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>€0</Text>
                            <Text style={[
                                styles.progressLabel, 
                                { color: recoveryPercent >= 100 ? theme.primary : theme.textSecondary, fontWeight: '600' }
                            ]}>
                                {recoveryPercent >= 100 ? 'Break-Even Reached' : `${recoveryPercent.toFixed(0)}% recovered`}
                            </Text>
                            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                                {formatCurrency(summary.totalInvestment)}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Floor Price Protection */}
                {summary.remainingQuantity > 0 && (
                    <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                        <View style={[styles.protectionCard, { backgroundColor: theme.primaryMuted, borderColor: theme.primary + '30' }]}>
                            <View style={styles.protectionHeader}>
                                <View style={[styles.protectionIcon, { backgroundColor: theme.primary + '30' }]}>
                                    <MaterialIcons name="shield" size={24} color={theme.primary} />
                                </View>
                                <View style={styles.protectionInfo}>
                                    <Text style={[styles.protectionTitle, { color: theme.text }]}>
                                        Floor Price Protection
                                    </Text>
                                    <Text style={[styles.protectionDesc, { color: theme.textSecondary }]}>
                                        Sell remaining <Text style={{ fontWeight: '700', color: theme.text }}>{summary.remainingQuantity} items</Text> above{' '}
                                        <Text style={{ fontWeight: '700', color: theme.primary }}>
                                            {formatCurrency(protection.floorPriceBreakEven)}
                                        </Text>{' '}
                                        to maintain profitability.
                                    </Text>
                                </View>
                            </View>
                            <PremiumButton
                                title="Adjust Pricing Strategy"
                                variant="primary"
                                size="sm"
                                onPress={() => {}}
                                style={styles.protectionButton}
                            />
                        </View>
                    </Animated.View>
                )}

                {/* Segmented Control */}
                <Animated.View entering={FadeInDown.delay(350).duration(400)}>
                    <View style={[styles.segmentedControl, { backgroundColor: theme.border }]}>
                        {[
                            { key: 'top', label: 'Top Sales' },
                            { key: 'losses', label: 'Losses' },
                            { key: 'all', label: 'All Items' }
                        ].map((seg) => (
                            <Pressable
                                key={seg.key}
                                style={[
                                    styles.segmentButton,
                                    activeSegment === seg.key && [
                                        styles.segmentButtonActive,
                                        { backgroundColor: theme.surface }
                                    ]
                                ]}
                                onPress={() => setActiveSegment(seg.key as SegmentOption)}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    { color: activeSegment === seg.key ? theme.primary : theme.textSecondary }
                                ]}>
                                    {seg.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* Items List */}
                <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.itemsList}>
                    {filteredItems.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialIcons name="inventory-2" size={40} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                No items in this category
                            </Text>
                        </View>
                    ) : (
                        filteredItems.slice(0, 10).map((item, index) => (
                            <Animated.View
                                key={item.id}
                                entering={FadeInUp.delay(index * 50).duration(300)}
                            >
                                <View style={[
                                    styles.itemCard, 
                                    { 
                                        backgroundColor: theme.surface, 
                                        borderColor: theme.border,
                                        opacity: item.status === 'STOCK' || item.status === 'ONLINE' ? 0.7 : 1
                                    }
                                ]}>
                                    {/* Image Placeholder */}
                                    <View style={styles.itemImageContainer}>
                                        <View style={[styles.itemImage, { backgroundColor: theme.border }]}>
                                            <MaterialIcons name="checkroom" size={24} color={theme.textMuted} />
                                        </View>
                                        {/* Status Badge */}
                                        <View style={[
                                            styles.statusBadge,
                                            { 
                                                backgroundColor: item.status === 'SOLD' 
                                                    ? theme.success 
                                                    : item.status === 'ONLINE' 
                                                        ? Palette.amber[500]
                                                        : theme.textMuted
                                            }
                                        ]}>
                                            <Text style={styles.statusBadgeText}>
                                                {item.status === 'SOLD' ? 'SOLD' : item.status === 'ONLINE' ? 'LISTED' : 'STOCK'}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {/* Item Info */}
                                    <View style={styles.itemInfo}>
                                        <View>
                                            <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                                                {item.brand || 'Unknown'} - {item.type || 'Item'}
                                            </Text>
                                            <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
                                                {item.sale 
                                                    ? `Sold on ${item.sale.platform || 'Vinted'} • ${formatDate(item.sale.saleDate)}`
                                                    : item.status === 'ONLINE' 
                                                        ? 'Listed for sale'
                                                        : 'In stock'
                                                }
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.itemPricing}>
                                            <View>
                                                <Text style={[styles.profitLabel, { color: theme.textSecondary }]}>
                                                    {item.sale ? 'NET PROFIT' : 'EST. PROFIT'}
                                                </Text>
                                                <Text style={[
                                                    styles.profitValue,
                                                    { color: (item.profit ?? 0) >= 0 ? theme.success : theme.danger }
                                                ]}>
                                                    {item.profit !== undefined 
                                                        ? `${item.profit >= 0 ? '+' : ''}${formatCurrency(item.profit)}`
                                                        : `~${formatCurrency(10)}`
                                                    }
                                                </Text>
                                            </View>
                                            {item.sale && (
                                                <Text style={[styles.salePrice, { color: theme.textSecondary }]}>
                                                    {formatCurrency(parseFloat(String(item.sale.priceGross)))}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        ))
                    )}
                    
                    {filteredItems.length > 10 && (
                        <Text style={[styles.moreItems, { color: theme.textMuted }]}>
                            + {filteredItems.length - 10} more items
                        </Text>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Floating Action Button */}
            <Animated.View 
                entering={FadeInUp.delay(500).duration(400)}
                style={[styles.fab, { bottom: insets.bottom + 24 }]}
            >
                <Pressable 
                    style={[styles.fabButton, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/sales/new')}
                >
                    <MaterialIcons name="add" size={28} color="#FFF" />
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontFamily: 'Manrope_700Bold',
        marginHorizontal: Spacing.sm,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.md,
        gap: Spacing.lg,
    },
    
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: Spacing.md,
        borderRadius: Radius.xl,
        borderWidth: 1,
    },
    statCardFull: {
        width: '100%',
        padding: Spacing.md,
        borderRadius: Radius.xl,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statLabel: {
        fontSize: 13,
        fontFamily: 'Manrope_500Medium',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 22,
        fontFamily: 'Manrope_700Bold',
    },
    roiLeft: {
        flex: 1,
    },
    roiValue: {
        fontSize: 22,
        fontFamily: 'Manrope_700Bold',
    },
    roiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.md,
    },
    roiBadgeText: {
        fontSize: 13,
        fontFamily: 'Manrope_700Bold',
    },
    
    // Recovery Card
    recoveryCard: {
        padding: Spacing.lg,
        borderRadius: Radius.xl,
        borderWidth: 1,
    },
    recoveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    recoveryTitle: {
        fontSize: 16,
        fontFamily: 'Manrope_700Bold',
    },
    recoveryProfit: {
        fontSize: 13,
        fontFamily: 'Manrope_500Medium',
    },
    progressTrack: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabel: {
        fontSize: 11,
        fontFamily: 'Manrope_500Medium',
    },
    
    // Protection Card
    protectionCard: {
        padding: Spacing.lg,
        borderRadius: Radius.xl,
        borderWidth: 1,
        gap: Spacing.md,
    },
    protectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    protectionIcon: {
        width: 44,
        height: 44,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    protectionInfo: {
        flex: 1,
    },
    protectionTitle: {
        fontSize: 16,
        fontFamily: 'Manrope_700Bold',
        marginBottom: 4,
    },
    protectionDesc: {
        fontSize: 14,
        fontFamily: 'Manrope_400Regular',
        lineHeight: 20,
    },
    protectionButton: {
        marginTop: Spacing.xs,
    },
    
    // Segmented Control
    segmentedControl: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: Radius.lg,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        borderRadius: Radius.md,
    },
    segmentButtonActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentText: {
        fontSize: 13,
        fontFamily: 'Manrope_600SemiBold',
    },
    
    // Items List
    itemsList: {
        gap: Spacing.md,
    },
    emptyState: {
        padding: Spacing['2xl'],
        borderRadius: Radius.xl,
        borderWidth: 1,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: 'Manrope_500Medium',
    },
    itemCard: {
        flexDirection: 'row',
        padding: Spacing.sm,
        borderRadius: Radius.xl,
        borderWidth: 1,
        gap: Spacing.md,
    },
    itemImageContainer: {
        position: 'relative',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    statusBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontFamily: 'Manrope_700Bold',
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    itemTitle: {
        fontSize: 14,
        fontFamily: 'Manrope_700Bold',
    },
    itemSubtitle: {
        fontSize: 12,
        fontFamily: 'Manrope_400Regular',
        marginTop: 2,
    },
    itemPricing: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    profitLabel: {
        fontSize: 9,
        fontFamily: 'Manrope_700Bold',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    profitValue: {
        fontSize: 16,
        fontFamily: 'Manrope_700Bold',
    },
    salePrice: {
        fontSize: 12,
        fontFamily: 'Manrope_400Regular',
        textDecorationLine: 'line-through',
    },
    moreItems: {
        textAlign: 'center',
        fontSize: 13,
        fontFamily: 'Manrope_500Medium',
        marginTop: Spacing.sm,
    },
    
    // FAB
    fab: {
        position: 'absolute',
        right: 24,
    },
    fabButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#D0BB95',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
});
