import React from "react";
import { Platform, View } from "react-native";

let NativeSvg: React.FC<any> = () => null;
if (Platform.OS !== "web") {
  // @ts-ignore
  NativeSvg = require("./PregnancyAsterix.native").PregnancyAsterixNative;
}

export function PregnancyAsterix(props: any) {
  if (Platform.OS === "web") {
    // Inline SVG for web
    return (
      <View style={props.style}>
        <svg width={props.size || 64} height={props.size || 64} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke={props.color || "#F472B6"} strokeWidth="4" opacity="0.15" />
          <path d="M32 8 L32 56 M8 32 L56 32 M16 16 L48 48 M48 16 L16 48" stroke={props.color || "#F472B6"} strokeWidth="3" strokeLinecap="round" />
        </svg>
      </View>
    );
  }
  return <NativeSvg {...props} />;
}
