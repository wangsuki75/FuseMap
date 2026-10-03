import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "core/ 不允许依赖 UI 框架" },
            { name: "react-dom", message: "core/ 不允许依赖 UI 框架" },
          ],
          patterns: [
            { group: ["next", "next/*"], message: "core/ 不允许依赖 Next.js" },
            {
              group: ["../components/*", "../app/*"],
              message: "core/ 不允许反向依赖 UI 层",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
