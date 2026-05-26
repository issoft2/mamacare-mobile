import { StyleSheet } from "react-native";

export const ctaGradientColors = ["#E8697C", "#FFA07A"] as const;

export const ctaButtonStyles = StyleSheet.create({
  button: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#E8697C",
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