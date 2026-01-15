import { Colors } from '@/constants/Colors';
import { StyleSheet, ViewStyle } from 'react-native';
import { View } from '../Themed';
import { useColorScheme } from '../useColorScheme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'outlined';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
    const theme = useColorScheme() ?? 'light';
    const isDark = theme === 'dark';

    return (
        <View style={[
            styles.card, 
            { 
                backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
                borderColor: Colors[theme].border 
            },
            variant === 'outlined' && styles.outlined,
            style
        ]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    outlined: {
        borderWidth: 1,
        shadowOpacity: 0,
        elevation: 0,
    }
});
