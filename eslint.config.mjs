import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  {
    rules: {
      // R3F uses mutable refs/props inside frame loops by design.
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
];

export default config;
