export default class ProductTeaserRewriter {
    constructor(fetchProduct) {
        this.fetchProduct = fetchProduct;
    }

    async onEndTag(endTag) {
        // Find SKU
        const properties = this.textBlocks.filter(t => t.trim().length > 0);
        console.log(`Incoming end tag: ${endTag.name}`, properties);

        let sku;
        properties.forEach((value, index) => {
            if (String(value).toLowerCase() === 'sku' && properties.length > index + 1) {
                sku = properties[index + 1];
            }
        });

        if (!sku) {
            // Abort early if no SKU was found
            return;
        }
        console.log('Found SKU', sku);

        const product = await this.fetchProduct(sku);
        if (!product) {
            // Abort early if no product was found
            return;
        }
        console.log('Got product', product);

        // Add product attributes to block
        let content = `
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

        endTag.before(content, { html: true });
    }

    async element(element) {
        this.textBlocks = [];
        console.log(`Incoming element: ${element.tagName}`);
        element.onEndTag(this.onEndTag.bind(this));
    }

    async text(text) {
        this.textBlocks.push(text.text);
    }
};