/**
 * mobile/components/icons/GoogleIcon.tsx
 *
 * Official Google "G" logo rendered as an SVG.
 * Source: Google Brand Resource Center — multicolour "G" mark.
 * Uses react-native-svg (ships with Expo, no extra install needed).
 */

import Svg, { Path } from "react-native-svg";

interface GoogleIconProps {
  size?: number;
}

export function GoogleIcon({ size = 20 }: GoogleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Blue */}
      <Path
        fill="#4285F4"
        d="M46.145 24.503c0-1.58-.142-3.1-.406-4.56H24v8.621h12.444c-.537 2.892-2.167 5.343-4.615 6.99v5.81h7.474c4.372-4.027 6.842-9.956 6.842-16.861z"
      />
      {/* Green */}
      <Path
        fill="#34A853"
        d="M24 47c6.237 0 11.468-2.067 15.291-5.596l-7.474-5.811c-2.067 1.386-4.711 2.205-7.817 2.205-6.013 0-11.104-4.061-12.926-9.52H3.434v6.001C7.238 41.748 15.02 47 24 47z"
      />
      {/* Yellow */}
      <Path
        fill="#FBBC05"
        d="M11.074 28.278A14.93 14.93 0 0 1 10.5 24c0-1.494.256-2.946.574-4.278v-6.001H3.434A23.93 23.93 0 0 0 0 24c0 3.867.927 7.522 2.567 10.742l8.507-6.464z"
      />
      {/* Red */}
      <Path
        fill="#EA4335"
        d="M24 9.5c3.39 0 6.435 1.166 8.831 3.458l6.618-6.618C35.463 2.637 30.232 0 24 0 15.02 0 7.238 5.252 3.434 13.279l8.507 6.443C13.896 13.561 18.987 9.5 24 9.5z"
      />
    </Svg>
  );
}