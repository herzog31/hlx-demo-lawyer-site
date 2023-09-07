export default class ProductDetailPageRewriter {
    constructor(product, request) {
        this.product = product;
        this.request = request;
    }

    rewriteBlock(element) {
        const { product } = this;

        // Add product attributes to block
        let content = `<div>
            <div>sku</div>
            <div>${product.sku}</div>
        </div>
        <div>
            <div>name</div>
            <div>${product.name}</div>
        </div>
        <div>
            <div>description</div>
            <div>${product.description}</div>
        </div>
        <div>
            <div>addToCartAllowed</div>
            <div>${product.addToCartAllowed}</div>
        </div>`; 

        if (product.images && product.images.length > 0) {
            content += `<div>
                <div>images</div>
                <div>
                    <ul>
                        ${product.images.map(image => `<li><img src="${image.url}" alt="${image.label}" /></li>`).join('')}
                    </ul>
                </div>
            </div>`;
        }

        element.setInnerContent(content, { html: true });
    }

    rewriteMeta(element) {
        const { product } = this;

        if (element.getAttribute('property') === 'og:title') {
            element.setAttribute('content', product.name);
        } else if (element.getAttribute('property') === 'og:image' || element.getAttribute('property') === 'og:image:secure_url') {
            element.setAttribute('content', product.images[0].url);
        } else if (element.getAttribute('property') === 'og:url') {
            element.setAttribute('content', this.request.url);
        } else if (element.getAttribute('name') === 'twitter:title') {
            element.setAttribute('content', product.name);
        } else if (element.getAttribute('name') === 'twitter:image') {
            element.setAttribute('content', product.images[0].url);
        }
    }

    element(element) {
        if (element.tagName === 'title') {
            element.setInnerContent(this.product.name);
        } else if (element.tagName === 'meta') {
            return this.rewriteMeta(element);
        } else if (element.tagName === 'div') {
            return this.rewriteBlock(element);
        }
    }
};