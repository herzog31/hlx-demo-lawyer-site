import { h, render } from 'https://unpkg.com/preact@latest?module';
import { useState } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';

const Accordion = (props) => {
  const { block } = props;
  const [openPanels, setOpenPanels] = useState(new Set([]));

  const rows = Array.from(block.children);
  const titles = rows.filter((_, index) => index % 2 === 0).map((t) => t.textContent.trim());
  const panels = rows.filter((_, index) => index % 2 === 1);

  const togglePanel = (index) => {
    const newOpenPanels = new Set(openPanels);
    if (openPanels.has(index)) {
      newOpenPanels.delete(index);
    } else {
      newOpenPanels.add(index);
    }
    setOpenPanels(newOpenPanels);
  };

  return <div className="accordion block">
    {titles.map((title, index) => {
      const classModifier = openPanels.has(index) ? 'item-open' : 'item-closed';
      return <div key={`accordion-item-${index}`} className={`item ${classModifier}`}>
        <div className="title" onClick={() => togglePanel(index)}>{title}</div>
        <div className="panel" dangerouslySetInnerHTML={{ __html: panels[index].innerHTML }} />
      </div>;
    })}
  </div>;
};

export default function decorate(block) {
  const content = block.cloneNode(true);
  block.textContent = '';
  render(<Accordion block={content} />, block.parentNode, block);
}
