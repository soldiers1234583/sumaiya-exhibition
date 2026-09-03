// Minimal process shim for the browser build of music-metadata (esm.sh emits
// `import __Process$ from "/node/process.mjs"` and reads process.type). A tiny
// process object is enough for the library to pick the browser code path.
const process = {
  browser: true,
  type: 'renderer',
  version: 'browser',
  platform: 'browser',
  env: {},
  argv: [],
  nextTick(fn) { Promise.resolve().then(fn); },
};
export default process;
export { process };
