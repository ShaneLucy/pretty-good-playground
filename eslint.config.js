import prettier from "eslint-config-prettier";
import path from "node:path";
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore");

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  sonarjs.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
      // see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      "no-undef": "off"
    }
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser
      }
    }
  },
  {
    rules: {
      // S121: control structures must always use curly braces
      curly: ["error", "all"],
      // S1541: cyclomatic complexity must not exceed 10
      complexity: ["error", 10],
      // S2138: undefined should not be explicitly assigned
      "no-restricted-syntax": [
        "error",
        {
          selector: "VariableDeclarator[init.type='Identifier'][init.name='undefined']",
          message: "Do not initialize to undefined; omit the initializer instead."
        },
        {
          selector: "AssignmentExpression[right.type='Identifier'][right.name='undefined']",
          message: "Do not assign undefined; use null for intentional absence."
        }
      ]
    }
  }
);
