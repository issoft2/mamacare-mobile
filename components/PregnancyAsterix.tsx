import React from "react";
import { View } from "react-native";
import { Svg, Path, Circle } from "react-native-svg";

// Asterix-like decorative element for pregnancy theme
export function PregnancyAsterix({ size = 64, color = "#F472B6", style }) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Circle cx="32" cy="32" r="28" stroke={color} strokeWidth="4" opacity="0.15" />
        <Path
          d="M32 8 L32 56 M8 32 L56 32 M16 16 L48 48 M48 16 L16 48"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
