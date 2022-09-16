import { h, render } from 'https://unpkg.com/preact@latest?module';

const Row = (props) => {
  const { block } = props;

  return <div>
    {Array.from(block.children).map((column, index) => <div key={`column-${index}`} dangerouslySetInnerHTML={{ __html: column.innerHTML }} />)}
  </div>;
};

const Columns = (props) => {
  const { block } = props;

  const rows = Array.from(block.children);
  const columnsLength = rows.length > 0 ? rows[0].children.length : 0;

  return <div className={`columns block columns-${columnsLength}-cols`}>
    {rows.map((row, index) => <Row key={`row-${index}`} block={row} />)}
  </div>;
};

export default function decorate(block) {
  const content = block.cloneNode(true);
  block.textContent = '';
  // Actually replace the whole block with a component
  render(<Columns block={content} />, block.parentNode, block);
}
