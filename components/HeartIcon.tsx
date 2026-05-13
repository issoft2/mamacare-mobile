import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

export function HeartIcon({ size = 96, color = "#F472B6", style }) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
        <Circle cx="48" cy="48" r="44" fill={color} opacity={0.08} />
        <Path
          d="M48 74s-26-16.8-26-34.2C22 28.8 32.8 22 48 36c15.2-14 26-7.2 26 3.8C74 57.2 48 74 48 74z"
          fill={color}
          stroke={color}
          strokeWidth={2}
          opacity={0.95}
        />
      </Svg>
    </View>
  );
}
