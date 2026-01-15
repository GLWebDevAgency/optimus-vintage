/**
 * 📦 LOTS SCREEN - Enterprise Grade Inventory Management
 * 
 * Features:
 * - Optimized API call (single query with aggregates)
 * - Search by lot name, provider
 * - Sort by date, investment, revenue, delta
 * - Quick stats overview
 * - Pull to refresh
 * - Memoized components for performance
 * - Empty state with CTA
 */

import { GlassHeader, PremiumBadge, PremiumButton, ProgressBar } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    LayoutAnimation,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    UIManager,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============ TYPES ============

interface LotSummary {
    id: number;
    name: string | null;
    provider: string | null;
    buyDate: string;
    initialQuantity: number;
    totalCost: string;
    additionalFees: string;
    totalInvestment: number;
    totalRevenue: number;
    soldCount: number;
    stockCount: number;
    delta: number;
    createdAt: string;
    updatedAt: string;
}

type SortOption = 'newest' | 'oldest' | 'investment_high' | 'investment_low' | 'revenue' | 'delta';

interface LotsStats {
    totalLots: number;
    totalInvestment: number;
    totalRevenue: number;
    totalDelta: number;
    totalItems: number;
    totalSold: number;
}

// ============ CONSTANTS ============

const ANIMATION_STAGGER = 50;
const MAX_ANIMATED_ITEMS = 8;

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
    { key: 'newest', label: 'Plus récent', icon: 'schedule' },
    { key: 'oldest', label: 'Plus ancien', icon: 'history' },
    { key: 'investment_high', label: 'Invest ↓', icon: 'trending-down' },
    { key: 'investment_low', label: 'Invest ↑', icon: 'trending-up' },
    { key: 'revenue', label: 'Revenue', icon: 'attach-money' },
    { key: 'delta', label: 'Delta', icon: 'warning' },
];

// ============ LOT CARD COMPONENT ============

interface LotCardProps {
    lot: LotSummary;
    index: number;
    shouldAnimate: boolean;
}

const LotCard = React.memo(function LotCard({ lot, index, shouldAnimate }: LotCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    
    const investment = parseFloat(String(lot.totalInvestment)) || 0;
    const revenue = parseFloat(String(lot.totalRevenue)) || 0;
    const delta = parseFloat(String(lot.delta)) || 0;
    const soldCount = parseInt(String(lot.soldCount)) || 0;
    const initialQty = lot.initialQuantity || 0;
    
    const isProfitable = revenue >= investment;
    const progressPercent = initialQty > 0 ? (soldCount / initialQty) * 100 : 0;
    
    const handlePress = useCallback(() => {
        router.push(`/lots/${lot.id}`);
    }, [lot.id]);

    return (
        <Animated.View
            entering={shouldAnimate ? FadeInDown.delay(index * ANIMATION_STAGGER).duration(300) : undefined}
        >
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.lotCard,
                    {
                        backgroundColor: theme.surface,
                        borderColor: theme.borderCard,
                        opacity: pressed ? 0.95 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                    theme.shadowMd,
                ]}
            >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.primaryMuted }]}>
                        <MaterialIcons name="inventory-2" size={22} color={theme.primary} />
                    </View>
                    <View style={styles.cardTitleContainer}>
                        <Text style={[Typography.heading.sm, { color: theme.text }]} numberOfLines={1}>
                            {lot.name || `Lot #${lot.id}`}
                        </Text>
                        <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                            {lot.provider || 'N/A'} • {lot.buyDate}
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
                            {initialQty}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[Typography.label.xs, { color: theme.textMuted }]}>INVESTED</Text>
                        <Text style={[Typography.number.md, { color: theme.text }]}>
                            €{investment.toFixed(0)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[Typography.label.xs, { color: theme.textMuted }]}>REVENUE</Text>
                        <Text style={[Typography.number.md, { color: theme.text }]}>
                            €{revenue.toFixed(0)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[Typography.label.xs, { color: theme.textMuted }]}>DELTA</Text>
                        <Text style={[
                            Typography.number.md,
                            { color: isProfitable ? theme.success : theme.danger }
                        ]}>
                            {isProfitable ? '+' : '-'}€{Math.abs(revenue - investment).toFixed(0)}
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
                        label={`${soldCount}/${initialQty} Sold`}
                    />
                </View>
            </Pressable>
        </Animated.View>
    );
});

// ============ STATS BAR COMPONENT ============

function StatsBar({ stats, theme }: { stats: LotsStats; theme: typeof Theme.light }) {
    const profit = stats.totalRevenue - stats.totalInvestment;
    
    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.statsBar}>
            <View style={[styles.statsBarItem, { backgroundColor: theme.surface, borderColor: theme.borderCard }]}>
                <MaterialIcons name="folder" size={16} color={theme.primary} />
                <View>
                    <Text style={[Typography.number.sm, { color: theme.text }]}>{stats.totalLots}</Text>
                    <Text style={[Typography.body.xs, { color: theme.textMuted }]}>Lots</Text>
                </View>
            </View>

            <View style={[styles.statsBarItem, { backgroundColor: theme.surface, borderColor: theme.borderCard }]}>
                <MaterialIcons name="account-balance-wallet" size={16} color={theme.warning} />
                <View>
                    <Text style={[Typography.number.sm, { color: theme.text }]}>€{stats.totalInvestment.toFixed(0)}</Text>
                    <Text style={[Typography.body.xs, { color: theme.textMuted }]}>Invested</Text>
                </View>
            </View>

            <View style={[styles.statsBarItem, { backgroundColor: theme.surface, borderColor: theme.borderCard }]}>
                <MaterialIcons name="trending-up" size={16} color={profit >= 0 ? theme.success : theme.danger} />
                <View>
                    <Text style={[Typography.number.sm, { color: profit >= 0 ? theme.success : theme.danger }]}>
                        {profit >= 0 ? '+' : ''}€{profit.toFixed(0)}
                    </Text>
                    <Text style={[Typography.body.xs, { color: theme.textMuted }]}>Profit</Text>
                </View>
            </View>
        </Animated.View>
    );
}

// ============ SEARCH BAR COMPONENT ============

function SearchBar({
    value,
    onChangeText,
    onClear,
    theme,
}: {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
    theme: typeof Theme.light;
}) {
    return (
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="search" size={20} color={theme.textMuted} />
            <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Rechercher lot, fournisseur..."
                placeholderTextColor={theme.textMuted}
                value={value}
                onChangeText={onChangeText}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
            />
            {value.length > 0 && (
                <Pressable onPress={onClear} hitSlop={8}>
                    <MaterialIcons name="close" size={18} color={theme.textMuted} />
                </Pressable>
            )}
        </View>
    );
}

// ============ MAIN SCREEN ============

export default function LotsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const flatListRef = useRef<FlatList>(null);

    // Data state
    const [lots, setLots] = useState<LotSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);

    // ============ DATA LOADING ============

    const loadLots = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
            setHasAnimated(false);
        } else {
            setLoading(true);
        }

        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/lots/summary`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch lots');
            }
            
            const data = await response.json();
            setLots(data);
        } catch (e) {
            console.error('Failed to load lots:', e);
            // Fallback to empty array
            setLots([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setTimeout(() => setHasAnimated(true), 400);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadLots();
        }, [])
    );

    // ============ FILTERING & SORTING ============

    const processedLots = useMemo(() => {
        let result = [...lots];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(
                (lot) =>
                    (lot.name?.toLowerCase().includes(query)) ||
                    (lot.provider?.toLowerCase().includes(query)) ||
                    (`lot #${lot.id}`.toLowerCase().includes(query)) ||
                    (`#${lot.id}`.includes(query))
            );
        }

        // Sort
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.buyDate).getTime() - new Date(a.buyDate).getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.buyDate).getTime() - new Date(b.buyDate).getTime());
                break;
            case 'investment_high':
                result.sort((a, b) => parseFloat(String(b.totalInvestment)) - parseFloat(String(a.totalInvestment)));
                break;
            case 'investment_low':
                result.sort((a, b) => parseFloat(String(a.totalInvestment)) - parseFloat(String(b.totalInvestment)));
                break;
            case 'revenue':
                result.sort((a, b) => parseFloat(String(b.totalRevenue)) - parseFloat(String(a.totalRevenue)));
                break;
            case 'delta':
                result.sort((a, b) => parseFloat(String(b.delta)) - parseFloat(String(a.delta)));
                break;
        }

        return result;
    }, [lots, searchQuery, sortBy]);

    // Stats
    const stats = useMemo<LotsStats>(() => {
        return lots.reduce(
            (acc, lot) => {
                const investment = parseFloat(String(lot.totalInvestment)) || 0;
                const revenue = parseFloat(String(lot.totalRevenue)) || 0;
                const delta = parseFloat(String(lot.delta)) || 0;
                const soldCount = parseInt(String(lot.soldCount)) || 0;
                const initialQty = lot.initialQuantity || 0;

                return {
                    totalLots: acc.totalLots + 1,
                    totalInvestment: acc.totalInvestment + investment,
                    totalRevenue: acc.totalRevenue + revenue,
                    totalDelta: acc.totalDelta + delta,
                    totalItems: acc.totalItems + initialQty,
                    totalSold: acc.totalSold + soldCount,
                };
            },
            { totalLots: 0, totalInvestment: 0, totalRevenue: 0, totalDelta: 0, totalItems: 0, totalSold: 0 }
        );
    }, [lots]);

    // ============ HANDLERS ============

    const handleRefresh = useCallback(() => {
        loadLots(true);
    }, []);

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);
    }, []);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
        Keyboard.dismiss();
    }, []);

    const handleSortChange = useCallback((option: SortOption) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSortBy(option);
        setShowSortMenu(false);
    }, []);

    // ============ RENDER ============

    const renderItem = useCallback(
        ({ item, index }: { item: LotSummary; index: number }) => (
            <LotCard lot={item} index={index} shouldAnimate={!hasAnimated && index < MAX_ANIMATED_ITEMS} />
        ),
        [hasAnimated]
    );

    const renderEmpty = useCallback(() => {
        if (loading) return null;

        if (searchQuery) {
            return (
                <View style={styles.empty}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceSecondary }]}>
                        <MaterialIcons name="search-off" size={48} color={theme.textMuted} />
                    </View>
                    <Text style={[Typography.heading.md, { color: theme.text, marginTop: Spacing.lg }]}>
                        Aucun résultat
                    </Text>
                    <Text style={[Typography.body.sm, { color: theme.textMuted, textAlign: 'center', marginTop: Spacing.xs }]}>
                        Aucun lot ne correspond à "{searchQuery}"
                    </Text>
                    <PremiumButton
                        title="Effacer la recherche"
                        variant="ghost"
                        size="sm"
                        onPress={handleClearSearch}
                        style={{ marginTop: Spacing.lg }}
                    />
                </View>
            );
        }

        return (
            <View style={styles.empty}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.primaryMuted }]}>
                    <MaterialIcons name="inventory-2" size={48} color={theme.primary} />
                </View>
                <Text style={[Typography.heading.md, { color: theme.text, marginTop: Spacing.lg }]}>
                    Aucun lot
                </Text>
                <Text style={[Typography.body.sm, { color: theme.textMuted, textAlign: 'center', marginTop: Spacing.xs }]}>
                    Commencez à suivre vos achats{'\n'}en créant votre premier lot
                </Text>
                <PremiumButton
                    title="Créer un lot"
                    variant="primary"
                    size="md"
                    icon={<MaterialIcons name="add" size={18} color="#FFF" />}
                    onPress={() => router.push('/lots/new')}
                    style={{ marginTop: Spacing.xl }}
                />
            </View>
        );
    }, [loading, searchQuery, theme, handleClearSearch]);

    const keyExtractor = useCallback((item: LotSummary) => item.id.toString(), []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <GlassHeader
                paddingTop={insets.top}
                title="Mes Lots"
                leftContent={
                    <View>
                        <Text style={[Typography.display.sm, { color: theme.text }]}>Mes Lots</Text>
                        <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                            {processedLots.length} lot{processedLots.length !== 1 ? 's' : ''} • {stats.totalItems} pièces
                        </Text>
                    </View>
                }
                rightContent={
                    <Pressable style={styles.addButtonSmall} onPress={() => router.push('/lots/new')}>
                        <LinearGradient
                            colors={theme.gradientGold as unknown as [string, string, ...string[]]}
                            style={[styles.addButtonGradient, theme.shadowGlow]}
                        >
                            <MaterialIcons name="add" size={24} color="#FFF" />
                        </LinearGradient>
                    </Pressable>
                }
            />

            <View style={{ flex: 1, paddingTop: insets.top + 80 }}>
                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <SearchBar
                        value={searchQuery}
                        onChangeText={handleSearch}
                        onClear={handleClearSearch}
                        theme={theme}
                    />

                    {/* Sort Button */}
                    <Pressable
                        style={[styles.sortButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => setShowSortMenu(!showSortMenu)}
                    >
                        <MaterialIcons
                            name={SORT_OPTIONS.find((o) => o.key === sortBy)?.icon as any || 'sort'}
                            size={18}
                            color={theme.primary}
                        />
                    </Pressable>
                </View>

                {/* Sort Menu Dropdown */}
                {showSortMenu && (
                    <Animated.View
                        entering={FadeIn.duration(150)}
                        exiting={FadeOut.duration(100)}
                        style={[styles.sortMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                        {SORT_OPTIONS.map((option) => (
                            <Pressable
                                key={option.key}
                                style={[
                                    styles.sortOption,
                                    sortBy === option.key && { backgroundColor: theme.primaryMuted },
                                ]}
                                onPress={() => handleSortChange(option.key)}
                            >
                                <MaterialIcons
                                    name={option.icon as any}
                                    size={16}
                                    color={sortBy === option.key ? theme.primary : theme.textSecondary}
                                />
                                <Text
                                    style={[
                                        Typography.body.sm,
                                        { color: sortBy === option.key ? theme.primary : theme.text },
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </Pressable>
                        ))}
                    </Animated.View>
                )}

                {/* Stats Bar */}
                {lots.length > 0 && <StatsBar stats={stats} theme={theme} />}

                {/* Lots List */}
                {loading && !refreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[Typography.body.sm, { color: theme.textMuted, marginTop: Spacing.md }]}>
                            Chargement des lots...
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={processedLots}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={theme.primary}
                                colors={[theme.primary]}
                            />
                        }
                        contentContainerStyle={[
                            styles.listContent,
                            processedLots.length === 0 && styles.emptyList,
                        ]}
                        ListEmptyComponent={renderEmpty}
                        showsVerticalScrollIndicator={false}
                        // Performance optimizations
                        removeClippedSubviews={Platform.OS === 'android'}
                        maxToRenderPerBatch={8}
                        windowSize={8}
                        initialNumToRender={6}
                    />
                )}
            </View>
        </View>
    );
}

// ============ STYLES ============

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
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 44,
        borderRadius: Radius.lg,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Manrope_400Regular',
    },
    sortButton: {
        width: 44,
        height: 44,
        borderRadius: Radius.lg,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sortMenu: {
        position: 'absolute',
        top: 130,
        right: Spacing.lg,
        zIndex: 100,
        borderRadius: Radius.lg,
        borderWidth: 1,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    statsBar: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    statsBarItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 120,
    },
    emptyList: {
        flexGrow: 1,
    },
    loaderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
    empty: {
        alignItems: 'center',
        paddingVertical: Spacing['4xl'],
        paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: Radius['2xl'],
        alignItems: 'center',
        justifyContent: 'center',
    },
});
