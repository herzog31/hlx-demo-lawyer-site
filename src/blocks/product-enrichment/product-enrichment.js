import { loadBlocks } from '../../../scripts/lib-franklin.js';
import { decorateMain, fetchIndex } from '../../../scripts/scripts.js';

const getEnrichmentForProduct = (index, sku) => index.data
  .filter((enrichment) => enrichment.products.includes(sku));

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();
      decorateMain(main);
      await loadBlocks(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  let sku;
  // Try getting SKU from pre-rendered HTML
  // TODO

  // Get SKU from URL
  const params = new URLSearchParams(window.location.search);
  if (params.has('sku')) {
    sku = params.get('sku');
  }

  // Load enrichment index
  const index = await fetchIndex('enrichment/enrichment-index');
  const enrichments = getEnrichmentForProduct(index, sku);
  if (!enrichments || enrichments.length === 0) {
    return;
  }

  // Add enrichment fragment
  const [firstEnrichment] = enrichments;
  const fragment = await loadFragment(firstEnrichment.path);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.closest('.section').classList.add(...fragmentSection.classList);
      block.closest('.product-enrichment-wrapper').replaceWith(...fragmentSection.childNodes);
    }
  }
}
