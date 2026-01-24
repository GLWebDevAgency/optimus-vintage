/**
 * 📷 Item Photo Picker Component
 * Handle image selection from camera/gallery and display
 */

import { AppIcon } from "@/components/ui/AppIcon";
import { useColorScheme } from "@/components/useColorScheme";
import { Radius, Spacing, Theme } from "@/constants/Theme";
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

  const pickImage = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert(
        "Limit Reached",
        `You can only add up to ${maxPhotos} photos.`,
      );
      return;
    }

    Alert.alert("Add Photo", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission Denied", "Camera access is required.");
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
        text: "Gallery",
        onPress: async () => {
          const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              "Permission Denied",
              "Media library access is required.",
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
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removePhoto = (index: number) => {
    Alert.alert("Remove Photo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
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
              Add Photo
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <Text style={[styles.hint, { color: theme.textMuted }]}>
        {photos.length}/{maxPhotos} photos • Tap photo to remove
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
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    borderCurve: "continuous",
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
