/* eslint-disable import/prefer-default-export */

import { importFromStorefrontSDK } from './config.js';

export const { renderer } = await importFromStorefrontSDK('/catalog/renderer.js');
