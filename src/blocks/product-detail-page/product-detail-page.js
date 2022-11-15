import { h, render } from 'https://unpkg.com/preact@latest?module';

import { readBlockConfig } from '../../../scripts/scripts.js';

const Image = (props) => {
  const {
    breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }], src, alt = '', eager = false, ...otherProps
  } = props;

  const ext = src.substring(src.lastIndexOf('.') + 1);

  const optimizedSources = [];
  breakpoints.forEach((breakpoint) => {
    optimizedSources.push(<source media={breakpoint.media} type="image/webp" srcSet={`${src}?width=${breakpoint.width}&format=webply&optimize=medium`} />);
  });

  const fallbackSources = [];
  breakpoints.forEach((breakpoint, i) => {
    if (i < breakpoints.length - 1) {
      fallbackSources.push(<source media={breakpoint.media} srcSet={`${src}?width=${breakpoint.width}&format=${ext}&optimize=medium`} />);
    } else {
      fallbackSources.push(<img src={`${src}?width=${breakpoint.width}&format=${ext}&optimize=medium`} alt={alt} loading={eager ? 'eager' : 'lazy'} {...otherProps} />);
    }
  });

  return <picture>
    {optimizedSources}
    {fallbackSources}
  </picture>;
};

const ProductPage = (props) => {
  console.log('props', props);
  const { name, description, addtocartallowed, images } = props;

  return <div className="product-detail-page block">
    <div className="gallery">
      <Image src={images} alt={name} breakpoints={[{ width: '350' }]} />
    </div>
    <div className="details">
      <h1>{name}</h1>
      {addtocartallowed && <button>Add to cart</button>}
      <div className="description" dangerouslySetInnerHTML={{ __html: description }} />
    </div>
  </div>;
};

export default function decorate(block) {
  const block2 = new DOMParser().parseFromString(`<div class="product-detail-page block" data-block-name="product-detail-page" data-block-status="loaded"><div>
  <div>Name</div>
  <div>Carmina Earrings</div>
</div>
<div>
  <div>Description</div>
  <div><p>Gold &amp; coral chandelier earrings.</p><ul><li>2.5 inch length</li><li>18K gold</li><li>Fish hook style</li></ul></div>
</div>
<div>
  <div>AddToCartAllowed</div>
  <div>true</div>
</div><div>
<div>Images</div>
<div><img src="http://product-recs2-eto2qma-7ztex4hq2b6mu.us-3.magentosite.cloud/media/catalog/product/v/a/va11-sg_main.jpg" alt="Image" loading="eager"></div>
</div></div>`, 'text/html');

  const cfg = readBlockConfig(block2.body.firstChild);
  block.textContent = '';
  render(<ProductPage {...cfg} />, block.parentNode, block);
}
