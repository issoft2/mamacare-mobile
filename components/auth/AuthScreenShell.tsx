import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@mumcare/ui";

import { HeartIcon } from "@/components/HeartIcon";

type AuthScreenShellProps = {
  children: React.ReactNode;
};

export function AuthScreenShell({ children }: AuthScreenShellProps) {
  return (
    <LinearGradient
      colors={[colors.rose[50], colors.white, "#FFF8F4"]}
      locations={[0, 0.58, 1]}
      style={styles.root}
    >
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <HeartIcon size={36} color={colors.rose[500]} />
            <Text style={styles.brandText}>mumcare</Text>
          </View>
          {children}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[8],
    ...Platform.select({
      web: {
        alignSelf: "center",
        maxWidth: 480,
        width: "100%",
      },
    }),
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[8],
  },
  brandText: {
    color: colors.rose[600],
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
});
