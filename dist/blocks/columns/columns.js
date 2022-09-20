import { h, render } from 'https://unpkg.com/preact@latest?module';

const Row = props => {
  const {
    block
  } = props;
  return h("div", null, Array.from(block.children).map((column, index) => h("div", {
    key: `column-${index}`,
    dangerouslySetInnerHTML: {
      __html: column.innerHTML
    }
  })));
};

const Columns = props => {
  const {
    block
  } = props;
  const rows = Array.from(block.children);
  const columnsLength = rows.length > 0 ? rows[0].children.length : 0;
  return h("div", {
    className: `columns block columns-${columnsLength}-cols`
  }, rows.map((row, index) => h(Row, {
    key: `row-${index}`,
    block: row
  })));
};

export default function decorate(block) {
  const content = block.cloneNode(true);
  block.textContent = ''; // Actually replace the whole block with a component

  render(h(Columns, {
    block: content
  }), block.parentNode, block);
}