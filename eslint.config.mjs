import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules - réactivées progressivement
    "@typescript-eslint/no-explicit-any": "warn", // au lieu de "off"
    "@typescript-eslint/no-unused-vars": "warn", // au lieu de "off"
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",

    // React rules - réactivées progressivement
    "react-hooks/exhaustive-deps": "warn", // au lieu de "off"
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",

    // Next.js rules
    "@next/next/no-img-element": "warn", // au lieu de "off"
    "@next/next/no-html-link-for-pages": "off",

    // General JavaScript rules - améliorées
    "prefer-const": "warn", // au lieu de "off"
    "no-unused-vars": "off", // désactivé au profit de @typescript-eslint/no-unused-vars
    "no-console": "warn", // au lieu de "off"
    "no-debugger": "warn", // au lieu de "off"
    "no-empty": "warn", // au lieu de "off"
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "daemon.js", "keep-alive.js", "server-child.js"]
}];

export default eslintConfig;
