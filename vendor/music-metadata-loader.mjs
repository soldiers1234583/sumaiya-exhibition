// Loads the bundled music-metadata browser build and exposes it on window so
// the classic (non-module) app.js can call window.musicMetadata.parseBlob().
import * as mm from './music-metadata.mjs';
window.musicMetadata = mm;
