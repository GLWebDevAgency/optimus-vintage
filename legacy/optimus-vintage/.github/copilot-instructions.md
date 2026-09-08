# Optimus Vintage - Copilot Instructions

Ce projet est une application Expo/React Native pour la gestion de stock vintage.

## Expo Skills References

Consulter ces ressources selon les besoins :

- `.agents/skills/building-native-ui/` -- Guide complet pour construire des UI natives
- `.agents/skills/expo-api-routes/` -- Routes API Expo
- `.agents/skills/expo-dev-client/` -- Client de développement
- `.agents/skills/expo-tailwind-setup/` -- Configuration Tailwind
- `.agents/skills/native-data-fetching/` -- Récupération de données natives
- `.agents/skills/use-dom/` -- Utilisation du DOM
- `.agents/skills/expo-cicd-workflows/` -- Workflows CI/CD
- `.agents/skills/expo-deployment/` -- Déploiement Expo
- `.agents/skills/upgrading-expo/` -- Mise à jour Expo

---

## Expo UI Guidelines

### Running the App

**CRITICAL: Toujours essayer Expo Go en premier avant de créer des builds custom.**

1. **Commencer avec Expo Go**: `npx expo start` et scanner le QR code
2. **Créer des builds custom UNIQUEMENT** quand requis (modules natifs custom, Apple targets, etc.)

### Code Style

- Utiliser des import statements en haut du fichier
- Toujours utiliser kebab-case pour les noms de fichiers, ex: `comment-card.tsx`
- Supprimer les anciens fichiers de route lors de restructurations
- Ne jamais utiliser de caractères spéciaux dans les noms de fichiers
- Configurer tsconfig.json avec des path aliases, préférer les aliases aux imports relatifs

### Routes

- Les routes appartiennent au répertoire `app`
- Ne JAMAIS co-localiser components, types, ou utilities dans le répertoire app
- S'assurer que l'app a toujours une route qui match "/"

### Library Preferences

- `expo-audio` pas `expo-av`
- `expo-video` pas `expo-av`
- `expo-symbols` pas `@expo/vector-icons`
- `react-native-safe-area-context` pas react-native SafeAreaView
- `process.env.EXPO_OS` pas `Platform.OS`
- `React.use` pas `React.useContext`
- `expo-image` Image component au lieu de l'élément intrinsèque `img`

### Responsiveness

- Toujours wrapper le root component dans un scroll view
- Utiliser `<ScrollView contentInsetAdjustmentBehavior="automatic" />` au lieu de `<SafeAreaView>`
- Utiliser flexbox au lieu de Dimensions API
- TOUJOURS préférer `useWindowDimensions` à `Dimensions.get()`

### Behavior

- Utiliser expo-haptics conditionnellement sur iOS
- Préférer `headerSearchBarOptions` dans Stack.Screen options pour ajouter une search bar
- Utiliser `<Text selectable />` pour le texte contenant des données copiables
- Formater les grands nombres (1.4M, 38k)
- Ne jamais utiliser d'éléments intrinsèques comme 'img' ou 'div'

### Styling

- Préférer flex gap à margin et padding
- Préférer padding à margin
- Toujours prendre en compte la safe area
- Inline styles pas StyleSheet.create sauf si réutilisation
- Ajouter des animations entering/exiting pour les changements d'état
- Utiliser `{ borderCurve: 'continuous' }` pour les coins arrondis
- TOUJOURS utiliser un navigation stack title au lieu d'un text element custom
- CSS et Tailwind ne sont PAS supportés - utiliser inline styles

### Shadows

Utiliser CSS `boxShadow` style prop. JAMAIS les legacy React Native shadow ou elevation styles.

```tsx
<View style={{ boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" }} />
```

### Navigation

- Utiliser `<Link href="/path" />` de 'expo-router' pour la navigation
- TOUJOURS utiliser `_layout.tsx` pour définir les stacks
- Utiliser Stack de 'expo-router/stack' pour les stacks de navigation native
- Ajouter des context menus et previews fréquemment

### Modal & Sheet

```tsx
// Modal
<Stack.Screen name="modal" options={{ presentation: "modal" }} />

// Sheet
<Stack.Screen
  name="sheet"
  options={{
    presentation: "formSheet",
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.5, 1.0],
  }}
/>
```
