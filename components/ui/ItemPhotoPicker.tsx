/**
 * 📷 Item Photo Picker Component
 * Handle image selection from camera/gallery and display
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Theme } from "@/constants/Theme";
import { useLocale } from "@/utils/i18n";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";

const MAX_PHOTOS = 5;

interface ItemPhotoPickerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function ItemPhotoPicker({
  photos,
  onPhotosChange,
  maxPhotos = MAX_PHOTOS,
}: ItemPhotoPickerProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Theme[colorScheme];
  const { t } = useLocale();

  const pickImage = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert(
        t("photos.limitReached"),
        t("photos.maxPhotosMessage", { max: maxPhotos }),
      );
      return;
    }

    Alert.alert(t("photos.addPhoto"), t("photos.chooseSource"), [
      {
        text: t("photos.camera"),
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              t("photos.permissionDenied"),
              t("photos.cameraRequired"),
            );
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

          if (!result.canceled && result.assets[0]) {
            onPhotosChange([...photos, result.assets[0].uri]);
          }
        },
      },
      {
        text: t("photos.gallery"),
        onPress: async () => {
          const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              t("photos.permissionDenied"),
              t("photos.galleryRequired"),
            );
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            selectionLimit: maxPhotos - photos.length,
            quality: 0.8,
          });

          if (!result.canceled && result.assets.length > 0) {
            const newPhotos = result.assets.map((a) => a.uri);
            onPhotosChange([...photos, ...newPhotos].slice(0, maxPhotos));
          }
        },
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const removePhoto = (index: number) => {
    Alert.alert(t("photos.removePhoto"), t("photos.removeConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("photos.remove"),
        style: "destructive",
        onPress: () => {
          const updated = [...photos];
          updated.splice(index, 1);
          onPhotosChange(updated);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {photos.map((uri, index) => (
          <Animated.View
            key={`${uri}-${index}`}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            layout={Layout.springify()}
          >
            <Pressable
              style={[styles.photoContainer, { borderColor: theme.border }]}
              onPress={() => removePhoto(index)}
            >
              <Image
                source={{ uri }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
              />
              <View
                style={[styles.removeButton, { backgroundColor: theme.danger }]}
              >
                <AppIcon name="close" size={14} color="#FFF" />
              </View>
            </Pressable>
          </Animated.View>
        ))}

        {photos.length < maxPhotos && (
          <Pressable
            style={[
              styles.addButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={pickImage}
          >
            <AppIcon name="camera-add" size={28} color={theme.primary} />
            <Text style={[styles.addText, { color: theme.textMuted }]}>
              {t("photos.addPhoto")}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <Text style={[styles.hint, { color: theme.textMuted }]}>
        {photos.length}/{maxPhotos} photos • {t("photos.tapToRemove")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  scrollContent: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  photoContainer: {
    width: 104,
    height: 104,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    overflow: "hidden",
    borderCurve: "continuous",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.4)",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(239,68,68,0.4), 0 2px 6px rgba(239,68,68,0.3)",
  },
  addButton: {
    width: 104,
    height: 104,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    borderCurve: "continuous",
    boxShadow:
      "inset 0 2px 4px rgba(0,0,0,0.02), inset 0 4px 8px rgba(0,0,0,0.01)",
  },
  addText: {
    fontSize: 11,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
});
