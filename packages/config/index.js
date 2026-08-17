/**
 * @cepatusaha/config
 * Shared configuration files for CepatUsaha platform
 * 
 * Usage:
 * - ESLint: require('@cepatusaha/config/eslint')
 * - ESLint React: require('@cepatusaha/config/eslint/react')
 * - Tailwind: require('@cepatusaha/config/tailwind')
 * - TypeScript: extend '@cepatusaha/config/typescript/base' in tsconfig.json
 */

module.exports = {
  eslint: require('./eslint'),
  eslintReact: require('./eslint/react'),
  tailwind: require('./tailwind'),
};
