function toggleAccordionSection(event) {
  const id = event.target.id.split('-')[1];
  const content = document.getElementById(`section-${id}-content`);
  if (content.classList.contains('accordion-section-content--closed')) {
    content.classList.remove('accordion-section-content--closed');
    content.classList.add('accordion-section-content--open');
  } else {
    content.classList.remove('accordion-section-content--open');
    content.classList.add('accordion-section-content--closed');
  }
}

/**
 * loads and decorates the accordion
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const h1 = block.querySelector('h1').textContent;

  const sectionTitles = Array.from(block.querySelectorAll('h2'));
  const titles = sectionTitles.map((title) => title.textContent);

  const sections = sectionTitles.map(
    (title) => title.parentElement.parentElement.nextElementSibling,
  );

  const accordion = document.createElement('div');

  // Title
  const accordionTitleContainer = document.createElement('div');
  accordionTitleContainer.classList.add('accordion-title');
  const accordionTitle = document.createElement('h2');
  accordionTitle.textContent = h1;
  accordionTitleContainer.append(accordionTitle);
  accordion.append(accordionTitleContainer);

  // Body
  const accordionBodyContainer = document.createElement('div');
  accordionBodyContainer.classList.add('accordion-body');
  for (let i = 0; i < titles.length && i < sections.length; i += 1) {
    const title = titles[i];
    const section = sections[i];

    const sectionTitleContainer = document.createElement('button');
    sectionTitleContainer.classList.add('accordion-section-title');
    sectionTitleContainer.id = `section-${i}-title`;
    sectionTitleContainer.append(title);

    const sectionContentContainer = document.createElement('div');
    sectionContentContainer.classList.add('accordion-section-content');
    sectionContentContainer.classList.add('accordion-section-content--closed');
    sectionContentContainer.id = `section-${i}-content`;
    sectionContentContainer.append(section);

    sectionTitleContainer.addEventListener('click', toggleAccordionSection);

    accordionBodyContainer.append(sectionTitleContainer);
    accordionBodyContainer.append(sectionContentContainer);
  }
  accordion.append(accordionBodyContainer);

  block.textContent = '';
  block.append(accordion);
}
