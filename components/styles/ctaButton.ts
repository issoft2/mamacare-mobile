import { StyleSheet } from "react-native";

export const ctaGradientColors = ["#C97B6E", "#E7A693"] as const;

export const ctaButtonStyles = StyleSheet.create({
  button: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#C97B6E",
    shadowOpacity: 0.3,
  },
  gradient: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  text: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
});