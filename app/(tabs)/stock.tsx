/**
 * 📦 STOCK SCREEN - Professional Inventory Management
 * 
 * Features:
 * - Optimized animations (staggered but fast)
 * - Search by brand, type, color
 * - Sort by cost, date, lot
 * - Filter by lot
 * - Pagination for performance
 * - Quick stats (total value, avg cost)
 * - Pull to refresh
 * - Empty state with CTA
 */

import { GlassHeader, PremiumBadge, PremiumButton, PremiumCard } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { Item, ItemsRepository, Lot, LotsRepository } from '@/db/repositories';
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
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    UIManager,
    View,
} from 'react-native';
import Animated, { 
    FadeIn, 
    FadeInDown, 
    FadeOut,
    LinearTransition,
    useAnimatedStyle, 
    useSharedValue, 
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============ TYPES ============

type SortOption = 'newest' | 'oldest' | 'cost_high' | 'cost_low' | 'lot';
type ViewMode = 'list' | 'compact';

interface StockStats {
    totalItems: number;
    totalValue: number;
    avgCost: number;
    lotsCount: number;
}

// ============ CONSTANTS ============

const ITEMS_PER_PAGE = 20;
const ANIMATION_STAGGER = 30; // ms between each item animation
const MAX_ANIMATED_ITEMS = 10; // Only animate first N items for performance

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
    { key: 'newest', label: 'Newest', icon: 'schedule' },
    { key: 'oldest', label: 'Oldest', icon: 'history' },
    { key: 'cost_high', label: 'Price ↓', icon: 'trending-down' },
    { key: 'cost_low', label: 'Price ↑', icon: 'trending-up' },
    { key: 'lot', label: 'By Lot', icon: 'inventory-2' },
];

// ============ ITEM CARD COMPONENT ============

interface ItemCardProps {
    item: Item;
    index: number;
    onSell: () => void;
    onPress?: () => void;
    viewMode: ViewMode;
    shouldAnimate: boolean;
}

const ItemCard = React.memo(function ItemCard({ 
    item, 
    index, 
    onSell, 
    onPress,
    viewMode,
    shouldAnimate,
}: ItemCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.97, { damping: 15 });
    }, []);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 15 });
    }, []);

    const unitCost = parseFloat(String(item.unitCost));

    // Compact view for dense lists
    if (viewMode === 'compact') {
        return (
            <Animated.View 
                entering={shouldAnimate ? FadeIn.delay(index * ANIMATION_STAGGER).duration(200) : undefined}
                layout={LinearTransition.springify().damping(15)}
            >
                <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={onPress}
                    style={[
                        styles.compactCard,
                        { 
                            backgroundColor: theme.surface,
                            borderColor: theme.borderCard,
                        }
                    ]}
                >
                    <View style={[styles.compactIcon, { backgroundColor: theme.surfaceSecondary }]}>
                        <MaterialIcons name="checkroom" size={18} color={theme.textMuted} />
                    </View>
                    
                    <View style={styles.compactInfo}>
                        <Text style={[Typography.body.sm, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                            {item.brand || 'Unknown'} • {item.type || 'Item'}
                        </Text>
                        <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                            Lot #{item.lotId} • {item.size || 'OS'}
                        </Text>
                    </View>
                    
                    <Text style={[Typography.number.sm, { color: theme.primary, marginRight: Spacing.md }]}>
                        €{unitCost.toFixed(2)}
                    </Text>
                    
                    <Pressable 
                        onPress={onSell}
                        hitSlop={8}
                        style={[styles.compactSellBtn, { backgroundColor: theme.primary }]}
                    >
                        <MaterialIcons name="sell" size={14} color="#FFF" />
                    </Pressable>
                </Pressable>
            </Animated.View>
        );
    }

    // Full card view
    return (
        <Animated.View 
            entering={shouldAnimate ? FadeInDown.delay(index * ANIMATION_STAGGER).duration(300) : undefined}
            layout={LinearTransition.springify().damping(15)}
            style={animatedStyle}
        >
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
            >
                <PremiumCard variant="default" style={styles.itemCard}>
                    <View style={[styles.imageContainer, { backgroundColor: theme.surfaceSecondary }]}>
                        <MaterialIcons name="checkroom" size={28} color={theme.textMuted} />
                        {/* Lot indicator */}
                        <View style={[styles.lotIndicator, { backgroundColor: theme.primary }]}>
                            <Text style={styles.lotIndicatorText}>#{item.lotId}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.cardContent}>
                        <View style={styles.cardInfo}>
                            <Text style={[Typography.heading.xs, { color: theme.text }]} numberOfLines={1}>
                                {item.brand || 'Unknown Brand'}
                            </Text>
                            <Text style={[Typography.body.xs, { color: theme.textMuted }]} numberOfLines={1}>
                                {item.type || 'Clothing'} {item.color ? `• ${item.color}` : ''}
                            </Text>
                            <View style={styles.metaRow}>
                                <PremiumBadge 
                                    label={item.size || 'One Size'} 
                                    variant="default" 
                                />
                                <View style={[styles.conditionDot, { 
                                    backgroundColor: item.condition === 'New' ? theme.success : 
                                                     item.condition === 'Good' ? theme.warning : theme.textMuted 
                                }]} />
                                <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                                    {item.condition || 'Good'}
                                </Text>
                            </View>
                            <View style={[styles.costTag, { backgroundColor: theme.primaryMuted }]}>
                                <Text style={[Typography.label.xs, { color: theme.primary }]}>
                                    Cost: €{unitCost.toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <Pressable style={styles.sellButtonWrapper} onPress={onSell}>
                            <LinearGradient
                                colors={theme.gradientGold as unknown as [string, string, ...string[]]}
                                style={[styles.sellButton, theme.shadowGlow]}
                            >
                                <MaterialIcons name="sell" size={16} color="#FFF" />
                                <Text style={styles.sellButtonText}>Sell</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </PremiumCard>
            </Pressable>
        </Animated.View>
    );
});

// ============ STATS BAR COMPONENT ============

function StatsBar({ stats, theme }: { stats: StockStats; theme: typeof Theme.light }) {
    return (
        <Animated.View 
            entering={FadeIn.duration(400)}
            style={styles.statsBar}
        >
            <View style={[styles.statItem, { backgroundColor: theme.surface, borderColor: theme.borderCard }]}>
                <MaterialIcons name="inventory" size={16} color={theme.primary} />
                <View>
                    <Text style={[Typography.number.sm, { color: theme.text }]}>{stats.totalItems}</Text>
                    <Text style={[Typography.body.xs, { color: theme.textMuted }]}>Items</Text>
                </View>
            </View>
            
            <View style={[styles.statItem, { backgroundColor: theme.surface, borderColor: theme.borderCard }]}>
                <MaterialIcons name="account-balance-wallet" size={16} color={theme.success} />
                <View>
                    <Text style={[Typography.number.sm, { color: theme.success }]}>€{stats.totalValue.toFixed(0)}</Text>
                    <Text style={[Typography.body.xs, { color: theme.textMuted }]}>Value</Text>
                </View>
            </View>
            
            <View style={[styles.statItem, { backgroundColor: theme.surface, borderColor: theme.borderCard }]}>
                <MaterialIcons name="analytics" size={16} color={theme.warning} />
                <View>
                    <Text style={[Typography.number.sm, { color: theme.text }]}>€{stats.avgCost.toFixed(2)}</Text>
                    <Text style={[Typography.body.xs, { color: theme.textMuted }]}>Avg Cost</Text>
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
    theme 
}: { 
    value: string; 
    onChangeText: (text: string) => void;
    onClear: () => void;
    theme: typeof Theme.light;
}) {
    const inputRef = useRef<TextInput>(null);
    
    return (
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="search" size={20} color={theme.textMuted} />
            <TextInput
                ref={inputRef}
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by brand, type, color..."
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

export default function StockScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const flatListRef = useRef<FlatList>(null);
    
    // Data state
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [lots, setLots] = useState<Lot[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLotId, setFilterLotId] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [page, setPage] = useState(1);
    const [hasAnimated, setHasAnimated] = useState(false);

    // ============ DATA LOADING ============

    const loadData = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
            setHasAnimated(false);
        } else {
            setLoading(true);
        }
        
        try {
            const [itemsData, lotsData] = await Promise.all([
                ItemsRepository.getAllStock(),
                LotsRepository.getAll()
            ]);
            
            setAllItems(itemsData);
            setLots(lotsData);
            setPage(1);
        } catch (e) {
            console.error('Failed to load stock:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            // Mark as animated after first load
            setTimeout(() => setHasAnimated(true), 500);
        }
    };

    useFocusEffect(useCallback(() => { 
        loadData(); 
    }, []));

    // ============ FILTERING & SORTING ============

    const processedItems = useMemo(() => {
        let result = [...allItems];
        
        // Filter by lot
        if (filterLotId !== null) {
            result = result.filter(i => i.lotId === filterLotId);
        }
        
        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(item => 
                (item.brand?.toLowerCase().includes(query)) ||
                (item.type?.toLowerCase().includes(query)) ||
                (item.color?.toLowerCase().includes(query)) ||
                (item.size?.toLowerCase().includes(query)) ||
                (`lot ${item.lotId}`.includes(query)) ||
                (`#${item.id}`.includes(query))
            );
        }
        
        // Sort
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case 'cost_high':
                result.sort((a, b) => parseFloat(String(b.unitCost)) - parseFloat(String(a.unitCost)));
                break;
            case 'cost_low':
                result.sort((a, b) => parseFloat(String(a.unitCost)) - parseFloat(String(b.unitCost)));
                break;
            case 'lot':
                result.sort((a, b) => a.lotId - b.lotId);
                break;
        }
        
        return result;
    }, [allItems, filterLotId, searchQuery, sortBy]);

    // Paginated items
    const paginatedItems = useMemo(() => {
        return processedItems.slice(0, page * ITEMS_PER_PAGE);
    }, [processedItems, page]);

    const hasMore = paginatedItems.length < processedItems.length;

    // Stats
    const stats = useMemo<StockStats>(() => {
        const items = filterLotId !== null 
            ? allItems.filter(i => i.lotId === filterLotId) 
            : allItems;
        
        const totalValue = items.reduce((sum, i) => sum + parseFloat(String(i.unitCost)), 0);
        const uniqueLots = new Set(items.map(i => i.lotId)).size;
        
        return {
            totalItems: items.length,
            totalValue,
            avgCost: items.length > 0 ? totalValue / items.length : 0,
            lotsCount: uniqueLots,
        };
    }, [allItems, filterLotId]);

    // ============ HANDLERS ============

    const handleSell = useCallback((item: Item) => {
        router.push({
            pathname: '/sales/new',
            params: { itemId: item.id, lotId: item.lotId }
        });
    }, []);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            setPage(p => p + 1);
            setTimeout(() => setLoadingMore(false), 100);
        }
    }, [loadingMore, hasMore]);

    const handleRefresh = useCallback(() => {
        loadData(true);
    }, []);

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);
        setPage(1); // Reset pagination on search
    }, []);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
        Keyboard.dismiss();
    }, []);

    const handleSortChange = useCallback((option: SortOption) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSortBy(option);
        setShowSortMenu(false);
        setPage(1);
    }, []);

    const handleFilterChange = useCallback((lotId: number | null) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFilterLotId(lotId);
        setPage(1);
    }, []);

    const toggleViewMode = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setViewMode(v => v === 'list' ? 'compact' : 'list');
    }, []);

    // ============ RENDER ============

    const renderItem = useCallback(({ item, index }: { item: Item; index: number }) => (
        <ItemCard 
            item={item} 
            index={index}
            onSell={() => handleSell(item)}
            viewMode={viewMode}
            shouldAnimate={!hasAnimated && index < MAX_ANIMATED_ITEMS}
        />
    ), [viewMode, hasAnimated, handleSell]);

    const renderFooter = useCallback(() => {
        if (!hasMore) return null;
        
        return (
            <View style={styles.footerLoader}>
                {loadingMore ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                    <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                        {processedItems.length - paginatedItems.length} more items
                    </Text>
                )}
            </View>
        );
    }, [hasMore, loadingMore, processedItems.length, paginatedItems.length, theme]);

    const renderEmpty = useCallback(() => {
        if (loading) return null;
        
        if (searchQuery) {
            return (
                <View style={styles.empty}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceSecondary }]}>
                        <MaterialIcons name="search-off" size={48} color={theme.textMuted} />
                    </View>
                    <Text style={[Typography.heading.md, { color: theme.text, marginTop: Spacing.lg }]}>
                        No Results
                    </Text>
                    <Text style={[Typography.body.sm, { color: theme.textMuted, textAlign: 'center', marginTop: Spacing.xs }]}>
                        No items match "{searchQuery}"
                    </Text>
                    <PremiumButton
                        title="Clear Search"
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
                    <MaterialIcons name="checkroom" size={48} color={theme.primary} />
                </View>
                <Text style={[Typography.heading.md, { color: theme.text, marginTop: Spacing.lg }]}>
                    Inventory Empty
                </Text>
                <Text style={[Typography.body.sm, { color: theme.textMuted, textAlign: 'center', marginTop: Spacing.xs }]}>
                    Add items via Lots to populate your stock
                </Text>
                <PremiumButton
                    title="Create Lot"
                    variant="primary"
                    size="md"
                    icon={<MaterialIcons name="add" size={18} color="#FFF" />}
                    onPress={() => router.push('/lots/new')}
                    style={{ marginTop: Spacing.xl }}
                />
            </View>
        );
    }, [loading, searchQuery, theme, handleClearSearch]);

    const keyExtractor = useCallback((item: Item) => item.id.toString(), []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <GlassHeader
                paddingTop={insets.top}
                title="Inventory"
                leftContent={
                    <View>
                        <Text style={[Typography.display.sm, { color: theme.text }]}>Inventory</Text>
                        <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                            {processedItems.length} {filterLotId ? 'filtered' : 'items in stock'}
                        </Text>
                    </View>
                }
                rightContent={
                    <View style={styles.headerActions}>
                        <Pressable 
                            style={[styles.headerBtn, { backgroundColor: theme.surfaceHighlight }]}
                            onPress={toggleViewMode}
                        >
                            <MaterialIcons 
                                name={viewMode === 'list' ? 'view-stream' : 'view-agenda'} 
                                size={20} 
                                color={theme.textSecondary} 
                            />
                        </Pressable>
                    </View>
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
                            name={SORT_OPTIONS.find(o => o.key === sortBy)?.icon as any || 'sort'} 
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
                        {SORT_OPTIONS.map(option => (
                            <Pressable
                                key={option.key}
                                style={[
                                    styles.sortOption,
                                    sortBy === option.key && { backgroundColor: theme.primaryMuted }
                                ]}
                                onPress={() => handleSortChange(option.key)}
                            >
                                <MaterialIcons 
                                    name={option.icon as any} 
                                    size={16} 
                                    color={sortBy === option.key ? theme.primary : theme.textSecondary} 
                                />
                                <Text style={[
                                    Typography.body.sm,
                                    { color: sortBy === option.key ? theme.primary : theme.text }
                                ]}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        ))}
                    </Animated.View>
                )}

                {/* Stats Bar */}
                {allItems.length > 0 && <StatsBar stats={stats} theme={theme} />}

                {/* Filter Chips */}
                <View style={styles.filterBar}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.filterScroll}
                    >
                        <Pressable
                            style={[
                                styles.filterChip,
                                { 
                                    backgroundColor: filterLotId === null ? theme.primary : theme.surface,
                                    borderColor: filterLotId === null ? theme.primary : theme.border,
                                }
                            ]}
                            onPress={() => handleFilterChange(null)}
                        >
                            <MaterialIcons 
                                name="inventory-2" 
                                size={14} 
                                color={filterLotId === null ? '#FFF' : theme.textSecondary} 
                            />
                            <Text style={[
                                Typography.label.sm,
                                { color: filterLotId === null ? '#FFF' : theme.textSecondary }
                            ]}>
                                All Stock
                            </Text>
                        </Pressable>

                        {lots.map(lot => {
                            const lotItemCount = allItems.filter(i => i.lotId === lot.id).length;
                            if (lotItemCount === 0) return null;
                            
                            return (
                                <Pressable
                                    key={lot.id}
                                    style={[
                                        styles.filterChip,
                                        { 
                                            backgroundColor: filterLotId === lot.id ? theme.primary : theme.surface,
                                            borderColor: filterLotId === lot.id ? theme.primary : theme.border,
                                        }
                                    ]}
                                    onPress={() => handleFilterChange(lot.id === filterLotId ? null : lot.id)}
                                >
                                    <Text style={[
                                        Typography.label.sm,
                                        { color: filterLotId === lot.id ? '#FFF' : theme.textSecondary }
                                    ]}>
                                        {lot.name || `Lot #${lot.id}`}
                                    </Text>
                                    <View style={[
                                        styles.filterBadge,
                                        { backgroundColor: filterLotId === lot.id ? 'rgba(255,255,255,0.3)' : theme.surfaceSecondary }
                                    ]}>
                                        <Text style={[
                                            Typography.label.xs,
                                            { color: filterLotId === lot.id ? '#FFF' : theme.textMuted }
                                        ]}>
                                            {lotItemCount}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Items List */}
                {loading && !refreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[Typography.body.sm, { color: theme.textMuted, marginTop: Spacing.md }]}>
                            Loading inventory...
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={paginatedItems}
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
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.3}
                        contentContainerStyle={[
                            styles.listContent,
                            paginatedItems.length === 0 && styles.emptyList
                        ]}
                        ListEmptyComponent={renderEmpty}
                        ListFooterComponent={renderFooter}
                        showsVerticalScrollIndicator={false}
                        // Performance optimizations
                        removeClippedSubviews={Platform.OS === 'android'}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        initialNumToRender={10}
                        getItemLayout={viewMode === 'compact' ? (_, index) => ({
                            length: 56,
                            offset: 56 * index,
                            index,
                        }) : undefined}
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
    headerActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    headerBtn: {
        width: 40,
        height: 40,
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
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    filterBar: {
        marginBottom: Spacing.sm,
    },
    filterScroll: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    filterBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radius.full,
        marginLeft: 2,
    },
    listContent: {
        padding: Spacing.lg,
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
    footerLoader: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
    },

    // Full Card Styles
    itemCard: {
        flexDirection: 'row',
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    imageContainer: {
        width: 72,
        height: 72,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
        position: 'relative',
    },
    lotIndicator: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    lotIndicatorText: {
        fontSize: 9,
        fontFamily: 'Manrope_700Bold',
        color: '#FFF',
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    conditionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    costTag: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.sm,
        alignSelf: 'flex-start',
        marginTop: Spacing.sm,
    },
    sellButtonWrapper: {
        marginLeft: Spacing.md,
    },
    sellButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
    },
    sellButtonText: {
        fontFamily: 'Manrope_700Bold',
        fontSize: 13,
        color: '#FFF',
    },

    // Compact Card Styles
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.xs,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    compactIcon: {
        width: 36,
        height: 36,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    compactInfo: {
        flex: 1,
    },
    compactSellBtn: {
        width: 32,
        height: 32,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Empty State
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
