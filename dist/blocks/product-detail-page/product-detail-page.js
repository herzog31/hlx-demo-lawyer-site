function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import { h, render } from 'https://unpkg.com/preact@latest?module';
import { readBlockConfig } from '../../../scripts/scripts.js';

const Image = props => {
  const {
    breakpoints = [{
      media: '(min-width: 400px)',
      width: '2000'
    }, {
      width: '750'
    }],
    src,
    alt = '',
    eager = false,
    ...otherProps
  } = props;
  const ext = src.substring(src.lastIndexOf('.') + 1);
  const optimizedSources = [];
  breakpoints.forEach(breakpoint => {
    optimizedSources.push(h("source", {
      media: breakpoint.media,
      type: "image/webp",
      srcSet: `${src}?width=${breakpoint.width}&format=webply&optimize=medium`
    }));
  });
  const fallbackSources = [];
  breakpoints.forEach((breakpoint, i) => {
    if (i < breakpoints.length - 1) {
      fallbackSources.push(h("source", {
        media: breakpoint.media,
        srcSet: `${src}?width=${breakpoint.width}&format=${ext}&optimize=medium`
      }));
    } else {
      fallbackSources.push(h("img", _extends({
        src: `${src}?width=${breakpoint.width}&format=${ext}&optimize=medium`,
        alt: alt,
        loading: eager ? 'eager' : 'lazy'
      }, otherProps)));
    }
  });
  return h("picture", null, optimizedSources, fallbackSources);
};

const ProductPage = props => {
  console.log('props', props);
  const {
    name,
    description,
    addtocartallowed,
    images
  } = props;
  return h("div", {
    className: "product-detail-page block"
  }, h("div", {
    className: "gallery"
  }, h(Image, {
    src: images,
    alt: name,
    breakpoints: [{
      width: '350'
    }]
  })), h("div", {
    className: "details"
  }, h("h1", null, name), addtocartallowed && h("button", null, "Add to cart"), h("div", {
    className: "description",
    dangerouslySetInnerHTML: {
      __html: description
    }
  })));
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
  render(h(ProductPage, cfg), block.parentNode, block);
}