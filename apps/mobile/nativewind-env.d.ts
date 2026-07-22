/// <reference types="nativewind/types" />

// L'import de global.css est un effet de bord traite par Metro, pas par
// TypeScript. Sans cette declaration, tsc echoue avec TS2882.
declare module '*.css';
