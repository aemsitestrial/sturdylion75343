const normalizeLabel = (value = '') => value.toLowerCase().replace(/[\s_-]+/g, '').replace(/[:.]/g, '');

function getRowData(row) {
  const cells = [...row.children];
  const label = normalizeLabel(cells[0]?.textContent?.trim() || '');
  const labeled = [
    'backgroundimage', 'image', 'title', 'heading', 'description', 'subtitle',
    'button', 'cta', 'buttontext', 'buttonlabel', 'buttonlink', 'ctalink',
  ].includes(label);
  return { label, cells: labeled ? cells.slice(1) : cells, labeled };
}

function getImage(cells) {
  for (const cell of cells) {
    const image = cell.querySelector('img');
    if (image) return image;
    const picture = cell.querySelector('picture');
    if (picture) return picture.querySelector('img');
  }
  return null;
}

function getText(cells) {
  return cells.map((cell) => {
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) return heading.textContent.trim();
    const paragraph = cell.querySelector('p');
    if (paragraph) return paragraph.textContent.trim();
    return cell.textContent.trim();
  }).filter(Boolean).join(' ').trim();
}

function getLink(cells) {
  for (const cell of cells) {
    const link = cell.querySelector('a[href]');
    if (link) return link;
  }
  return null;
}

function readAuthoring(block) {
  const fields = {};
  const positional = [];
  [...block.children].forEach((row) => {
    const data = getRowData(row);
    const image = getImage(data.cells);
    const link = getLink(data.cells);
    const text = getText(data.cells);

    if (['backgroundimage', 'image'].includes(data.label)) {
      fields.image = image;
    } else if (['title', 'heading'].includes(data.label)) {
      fields.title = text;
    } else if (['description', 'subtitle'].includes(data.label)) {
      fields.description = text;
    } else if (['button', 'cta'].includes(data.label)) {
      fields.buttonText = link?.textContent.trim() || text;
      fields.buttonLink = link?.getAttribute('href') || '';
    } else if (['buttontext', 'buttonlabel'].includes(data.label)) {
      fields.buttonText = text;
    } else if (['buttonlink', 'ctalink'].includes(data.label)) {
      fields.buttonLink = link?.getAttribute('href') || text;
    } else {
      if (image) fields.image ||= image;
      if (link) {
        fields.buttonText ||= link.textContent.trim();
        fields.buttonLink ||= link.getAttribute('href') || '';
      }
      if (text) positional.push({ text, image, link, cells: data.cells });
    }
  });

  // Support simple positional authoring: image, title, description, button.
  positional.forEach((item) => {
    if (!fields.image && item.image) fields.image = item.image;
    if (!fields.title && item.cells.some((cell) => cell.querySelector('h1, h2, h3, h4, h5, h6'))) {
      fields.title = item.text;
    } else if (!fields.description && item.cells.some((cell) => cell.querySelector('p'))) {
      fields.description = item.text;
    } else if (!fields.title && !item.image && !item.link && !fields.description) {
      fields.title = item.text;
    } else if (!fields.description && !item.image && !item.link && fields.title && item.text !== fields.title) {
      fields.description = item.text;
    }
  });

  // An image or CTA can be authored without a label row.
  fields.image ||= block.querySelector('picture img, img');
  const authoredLink = block.querySelector('a[href]');
  if (authoredLink) {
    fields.buttonText ||= authoredLink.textContent.trim();
    fields.buttonLink ||= authoredLink.getAttribute('href') || '';
  }
  return fields;
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

export default function decorate(block) {
  const fields = readAuthoring(block);
  block.classList.add('content-banner');

  const banner = makeElement('section', 'content-banner__inner');
  banner.setAttribute('aria-label', fields.title || 'Content banner');

  if (fields.image) {
    const background = makeElement('div', 'content-banner__background');
    const image = fields.image;
    const picture = image.closest('picture');
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.loading = 'eager';
    image.decoding = 'async';
    background.append(picture || image);
    banner.append(background);
  }

  const content = makeElement('div', 'content-banner__content');
  if (fields.title?.trim()) {
    const title = makeElement('h1', 'content-banner__title');
    title.textContent = fields.title.trim();
    content.append(title);
  }

  if (fields.description?.trim()) {
    const description = makeElement('p', 'content-banner__description');
    description.textContent = fields.description.trim();
    content.append(description);
  }

  if (fields.buttonText?.trim() && fields.buttonLink?.trim()) {
    const button = makeElement('a', 'content-banner__button', fields.buttonText.trim());
    button.href = fields.buttonLink.trim();
    content.append(button);
  }

  if (content.children.length) banner.append(content);
  block.replaceChildren(banner);
}
