// import globals from "globals";
// import { defineConfig } from "eslint/config";

// export default defineConfig([
//   { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
//   { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
// ]);
// eslint.config.js

import globals  from "globals"

module.exports =[
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "module", // bukan "module"
      globals: {
        ...globals.browser, // semua global browser (window, document, dll)
        ace: "readonly",    // tambahin global ace supaya gak kena "no-undef"
      },
    },
    rules: {
     "no-unused-vars": ["error", {
            "vars": "all",
            "args": "after-used",
            "caughtErrors": "all",
            "ignoreRestSiblings": false,
            "ignoreUsingDeclarations": false,
            "reportUsedIgnorePattern": false
        }]
    },
  },
]
