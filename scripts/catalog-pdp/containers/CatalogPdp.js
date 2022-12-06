/* eslint-disable import/prefer-default-export */

import { importFromStorefrontSDK } from '../config.js';

const { ProductDetailPage } = await importFromStorefrontSDK('/catalog/containers/pdp.js');

export { ProductDetailPage };
