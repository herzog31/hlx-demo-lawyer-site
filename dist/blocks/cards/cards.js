import { h, render } from 'https://unpkg.com/preact@latest?module';
import { createOptimizedPicture } from '../../../scripts/scripts.js';

const Card = props => {
  const {
    block
  } = props;
  const children = Array.from(block.children);
  const content = children.map((child, index) => {
    const isImage = child.children.length === 1 && child.children[0].tagName === 'PICTURE';

    if (isImage) {
      child.querySelectorAll('img').forEach(img => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{
        width: '750'
      }])));
      return h("div", {
        key: `card-image-${index}`,
        className: "cards-card-image",
        dangerouslySetInnerHTML: {
          __html: child.innerHTML
        }
      });
    }

    return h("div", {
      key: `card-content-${index}`,
      className: "cards-card-content",
      dangerouslySetInnerHTML: {
        __html: child.innerHTML
      }
    });
  });
  return h("li", null, content);
};

const CardList = props => {
  const {
    block
  } = props;
  return h("ul", null, Array.from(block.children).map((row, index) => h(Card, {
    key: `card-${index}`,
    block: row
  })));
};

export default function decorate(block) {
  // TODO: Put in special render method
  const content = block.cloneNode(true);
  block.textContent = '';
  render(h(CardList, {
    block: content
  }), block);
}