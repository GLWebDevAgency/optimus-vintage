/**
 * 📦 STOCK SCREEN - Premium Inventory Management
 */

import { GlassHeader, PremiumBadge, PremiumButton, PremiumCard } from '@/components/ui/PremiumComponents';
import { useColorScheme } from '@/components/useColorScheme';
import { Radius, Spacing, Theme, Typography } from '@/constants/Theme';
import { Item, ItemsRepository, Lot, LotsRepository } from '@/db/repositories';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Premium Item Card Component
function ItemCard({ item, index, onSell }: { item: Item; index: number; onSell: () => void }) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View 
            entering={FadeInDown.delay(index * 60).duration(400)}
            style={animatedStyle}
        >
            <Pressable
                onPressIn={() => { scale.value = withSpring(0.98); }}
                onPressOut={() => { scale.value = withSpring(1); }}
            >
                <PremiumCard variant="default" style={styles.itemCard}>
                    <View style={[styles.imageContainer, { backgroundColor: theme.surfaceSecondary }]}>
                        <MaterialIcons name="checkroom" size={28} color={theme.textMuted} />
                    </View>
                    
                    <View style={styles.cardContent}>
                        <View style={styles.cardInfo}>
                            <Text style={[Typography.heading.xs, { color: theme.text }]} numberOfLines={1}>
                                {item.type || 'Item'} {item.brand ? `• ${item.brand}` : ''}
                            </Text>
                            <View style={styles.metaRow}>
                                <PremiumBadge 
                                    label={item.size || 'One Size'} 
                                    variant="default" 
                                />
                                <Text style={[Typography.body.xs, { color: theme.textMuted }]}>
                                    {item.condition || 'Good'}
                                </Text>
                            </View>
                            <View style={[styles.costTag, { backgroundColor: theme.primaryMuted }]}>
                                <Text style={[Typography.label.xs, { color: theme.primary }]}>
                                    Cost: €{parseFloat(String(item.unitCost)).toFixed(2)}
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
}

export default function StockScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Theme[colorScheme];
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLotId, setFilterLotId] = useState<number | null>(null);
    const [lots, setLots] = useState<Lot[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            let data = await ItemsRepository.getAllStock();
            if (filterLotId) {
                data = data.filter(i => i.lotId === filterLotId);
            }
            setItems(data.reverse());
            const l = await LotsRepository.getAll();
            setLots(l);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, [filterLotId]));

    const handleSell = (item: Item) => {
        router.push({
            pathname: '/sales/new',
            params: { itemId: item.id, lotId: item.lotId }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <GlassHeader
                paddingTop={insets.top}
                title="Inventory"
                leftContent={
                    <View>
                        <Text style={[Typography.display.sm, { color: theme.text }]}>Inventory</Text>
                        <Text style={[Typography.body.sm, { color: theme.textMuted }]}>
                            {items.length} items in stock
                        </Text>
                    </View>
                }
            />

            {/* Premium Filter Bar */}
            <View style={[styles.filterBar, { marginTop: insets.top + 80 }]}>
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
                        onPress={() => setFilterLotId(null)}
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

                    {lots.map(lot => (
                        <Pressable
                            key={lot.id}
                            style={[
                                styles.filterChip,
                                { 
                                    backgroundColor: filterLotId === lot.id ? theme.primary : theme.surface,
                                    borderColor: filterLotId === lot.id ? theme.primary : theme.border,
                                }
                            ]}
                            onPress={() => setFilterLotId(lot.id === filterLotId ? null : lot.id)}
                        >
                            <Text style={[
                                Typography.label.sm,
                                { color: filterLotId === lot.id ? '#FFF' : theme.textSecondary }
                            ]}>
                                {lot.name || `Lot #${lot.id}`}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl 
                        refreshing={loading} 
                        onRefresh={loadData} 
                        tintColor={theme.primary} 
                    />
                }
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <ItemCard 
                        item={item} 
                        index={index} 
                        onSell={() => handleSell(item)} 
                    />
                )}
                ListEmptyComponent={
                    !loading ? (
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
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterBar: {
        paddingVertical: Spacing.md,
        zIndex: 90,
    },
    filterScroll: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    listContent: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
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
