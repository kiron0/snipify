if (typeof window !== 'undefined') {
  throw new Error('Snipify can only be used in Node.js environments.');
}
export * from "./interface";
export * from "./lib";
export * from "./utils";
