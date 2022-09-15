import { h, render } from 'https://unpkg.com/preact@latest?module';

import { createOptimizedPicture } from '../../../scripts/scripts.js';

const Card = (props) => {
  const { block } = props;
  const children = Array.from(block.children);

  const content = children.map((child) => {
    const isImage = child.children.length === 1 && child.children[0].tagName === 'PICTURE';

    if (isImage) {
      child.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
      return <div className="cards-card-image" dangerouslySetInnerHTML={{ __html: child.innerHTML }} />;
    }
    return <div className="cards-card-content" dangerouslySetInnerHTML={{ __html: child.innerHTML }} />;
  });

  return <li>{content}</li>;
};

const CardList = (props) => {
  const { block } = props;

  return <ul>
    {Array.from(block.children).map((row) => <Card block={row} />)}
  </ul>;
};

export default function decorate(block) {
  // TODO: Put in special render method
  const content = block.cloneNode(true);
  block.textContent = '';
  render(<CardList block={content} />, block);
}
