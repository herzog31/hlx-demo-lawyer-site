import { h, render } from '../../../scripts/preact.module.js';
import { useState } from '../../../scripts/hooks.module.js';
const Accordion = props => {
  const {
    block
  } = props;
  const [openPanels, setOpenPanels] = useState(new Set([]));
  const rows = Array.from(block.children);
  const titles = rows.filter((_, index) => index % 2 === 0).map(t => t.textContent.trim());
  const panels = rows.filter((_, index) => index % 2 === 1);
  const togglePanel = index => {
    const newOpenPanels = new Set(openPanels);
    if (openPanels.has(index)) {
      newOpenPanels.delete(index);
    } else {
      newOpenPanels.add(index);
    }
    setOpenPanels(newOpenPanels);
  };
  return h("div", {
    className: "accordion block"
  }, titles.map((title, index) => {
    const classModifier = openPanels.has(index) ? 'item-open' : 'item-closed';
    return h("div", {
      key: `accordion-item-${index}`,
      className: `item ${classModifier}`
    }, h("div", {
      className: "title",
      onClick: () => togglePanel(index)
    }, title), h("div", {
      className: "panel",
      dangerouslySetInnerHTML: {
        __html: panels[index].innerHTML
      }
    }));
  }));
};
export default function decorate(block) {
  const content = block.cloneNode(true);
  block.textContent = '';
  render(h(Accordion, {
    block: content
  }), block.parentNode, block);
}