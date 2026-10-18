const normalizeLabel = (value = '') => value
  .toLowerCase()
  .replace(/[\s_-]+/g, '')
  .replace(/[:.]/g, '');

function getRowData(row) {
  const cells = [...row.children];
  const label = normalizeLabel(cells[0]?.textContent?.trim() || '');
  const labeled = [
    'backgroundimage',
    'image',
    'title',
    'heading',
    'description',
    'subtitle',
    'button',
    'cta',
    'buttontext',
    'buttonlabel',
    'buttonlink',
    'ctalink',
  ].includes(label);

  return {
    label,
    cells: labeled ? cells.slice(1) : cells,
    labeled,
  };
}

function getImage(cells) {
  const images = cells.map((cell) => cell.querySelector('img'))
    .filter(Boolean);

  return images[0] || null;
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
  const links = cells.map((cell) => cell.querySelector('a[href]'))
    .filter(Boolean);

  return links[0] || null;
}

function readAuthoring(block) {
  const fields = {};
  const positional = [];

  [...block.children].forEach((row) => {
    const data = getRowData(row);
    const { label, cells } = data;
    const image = getImage(cells);
    const link = getLink(cells);
    const text = getText(cells);

    if (['backgroundimage', 'image'].includes(label)) {
      fields.image = image;
    } else if (['title', 'heading'].includes(label)) {
      fields.title = text;
    } else if (['description', 'subtitle'].includes(label)) {
      fields.description = text;
    } else if (['button', 'cta'].includes(label)) {
      fields.buttonText = link?.textContent.trim() || text;
      fields.buttonLink = link?.getAttribute('href') || '';
    } else if (['buttontext', 'buttonlabel'].includes(label)) {
      fields.buttonText = text;
    } else if (['buttonlink', 'ctalink'].includes(label)) {
      fields.buttonLink = link?.getAttribute('href') || text;
    } else {
      if (image) fields.image ||= image;

      if (link) {
        fields.buttonText ||= link.textContent.trim();
        fields.buttonLink ||= link.getAttribute('href') || '';
      }

      if (text) {
        positional.push({
          text,
          image,
          link,
          cells,
        });
      }
    }
  });

  positional.forEach((item) => {
    const {
        label,
        cells,
    } = data;
    const hasHeading = cells.some((cell) => (
      cell.querySelector('h1, h2, h3, h4, h5, h6')
    ));
    const hasParagraph = cells.some((cell) => cell.querySelector('p'));

    if (!fields.image && image) fields.image = image;

    if (!fields.title && hasHeading) {
      fields.title = text;
    } else if (!fields.description && hasParagraph) {
      fields.description = text;
    } else if (
      !fields.title
      && !image
      && !link
      && !fields.description
    ) {
      fields.title = text;
    } else if (
      !fields.description
      && !image
      && !link
      && fields.title
      && text !== fields.title
    ) {
      fields.description = text;
    }
  });

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
  const { 
    image, 
    title, 
    description, 
    buttonText, 
    buttonLink 
} = fields;

  block.classList.add('content-banner');

  const banner = makeElement('section', 'content-banner__inner');

  banner.setAttribute(
    'aria-label',
    title || 'Content banner',
  );

  if (image) {
    const background = makeElement(
      'div',
      'content-banner__background',
    );
    const picture = image.closest('picture');

    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.loading = 'eager';
    image.decoding = 'async';

    background.append(picture || image);
    banner.append(background);
  }

  const content = makeElement('div', 'content-banner__content');

  if (title?.trim()) {
    const heading = makeElement(
      'h1',
      'content-banner__title',
      title.trim(),
    );

    content.append(heading);
  }

  if (description?.trim()) {
    const descriptionElement = makeElement(
      'p',
      'content-banner__description',
      description.trim(),
    );

    content.append(descriptionElement);
  }

  if (buttonText?.trim() && buttonLink?.trim()) {
    const button = makeElement(
      'a',
      'content-banner__button',
      buttonText.trim(),
    );

    button.href = buttonLink.trim();
    content.append(button);
  }

  if (content.children.length) banner.append(content);

  block.replaceChildren(banner);
}
