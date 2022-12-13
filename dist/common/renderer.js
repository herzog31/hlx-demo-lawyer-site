/* eslint-disable import/prefer-default-export */

import { importFromStorefrontSDK } from '../../scripts/scripts.js';
export const {
  renderer
} = await importFromStorefrontSDK('/catalog/renderer.js');