/* eslint-disable import/prefer-default-export */

const rootPath = 'https://localhost:3001';

export const importFromStorefrontSDK = (path) => import(rootPath + path);
