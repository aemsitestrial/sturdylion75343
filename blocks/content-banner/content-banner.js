import {
  fetchCurrentInavs,
  INAV_POLL_MS,
} from '../../../scripts/api/inav-api.js';

function makeTickerCard(item) {
  const card = document.createElement(item.schemeCode ? 'a' : 'article');
  card.className = 'hero-banner__ticker-card';
  if (item.schemeCode) {
    card.href = `/etfs/equity?schemeCode=${encodeURIComponent(item.schemeCode)}`;
    card.dataset.schemeCode = item.schemeCode;
  }

  const title = document.createElement('h2');
  title.className = 'hero-banner__ticker-title';
  title.textContent = item.name;

  const stats = document.createElement('div');
  stats.className = 'hero-banner__ticker-stats';

  const inavLabel = document.createElement('span');
  inavLabel.className = 'hero-banner__ticker-label';
  inavLabel.textContent = 'iNAV';

  const inavValue = document.createElement('strong');
  inavValue.className = 'hero-banner__ticker-value';
  inavValue.textContent = item.inav;

  const divider = document.createElement('span');
  divider.className = 'hero-banner__ticker-divider';
  divider.setAttribute('aria-hidden', 'true');

  const changeLabel = document.createElement('span');
  changeLabel.className = 'hero-banner__ticker-label';
  changeLabel.textContent = '% Change';

  const changeValue = document.createElement('strong');
  changeValue.className = 'hero-banner__ticker-value';
  changeValue.textContent = item.change;

  const arrow = document.createElement('span');
  arrow.className = 'hero-banner__ticker-arrow';
  const change = Number.parseFloat(item.change);
  const isDown = Number.isFinite(change) && change < 0;
  arrow.setAttribute('aria-label', isDown ? 'down' : 'up');
  arrow.textContent = isDown ? '↓' : '↑';

  stats.append(inavLabel, inavValue, divider, changeLabel, changeValue, arrow);
  card.append(title, stats);
  return card;
}

async function loadTickerData(track) {
  try {
    const items = (await fetchCurrentInavs()).map(item => ({
      name: item.schemeName || '',
      schemeCode: String(item.schemeCode || '').trim(),
      inav:
        Number.isFinite(Number(item.currentINAV)) &&
        item.currentINAV !== null &&
        item.currentINAV !== ''
          ? `₹${item.currentINAV}`
          : '—',
      change:
        Number.isFinite(Number(item.pctChange)) &&
        item.pctChange !== null &&
        item.pctChange !== ''
          ? `${Number(item.pctChange).toFixed(2)}%`
          : '—',
    }));
    const position = track.scrollLeft;
    track.replaceChildren(...items.map(makeTickerCard));
    track.dispatchEvent(
      new CustomEvent('tickerupdated', { detail: { position } }),
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unable to load hero banner iNAV ticker:', error);
  }
}

function startTickerLoop(track) {
  let cycleWidth = 0;

  // Keep enough repeated cards after the final fund to fill the viewport at the seam.
  function updateLoop(position = track.scrollLeft) {
    track
      .querySelectorAll('[data-ticker-clone]')
      .forEach(card => card.remove());
    const cards = [...track.children];
    cycleWidth = 0;
    if (!cards.length) return;
    const gap =
      Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    cycleWidth = cards.reduce(
      (width, card) => width + card.getBoundingClientRect().width + gap,
      0,
    );
    if (!cycleWidth) return;
    const copies = Math.max(
      1,
      Math.ceil((track.clientWidth + gap) / cycleWidth),
    );
    for (let copy = 0; copy < copies; copy += 1) {
      cards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.dataset.tickerClone = 'true';
        clone.setAttribute('aria-hidden', 'true');
        if (clone.matches('a')) clone.tabIndex = -1;
        track.append(clone);
      });
    }
    track.scrollLeft = position % cycleWidth;
  }

  track.addEventListener('tickerupdated', event =>
    updateLoop(event.detail.position),
  );
  track.addEventListener('scroll', () => {
    if (cycleWidth && track.scrollLeft >= cycleWidth) {
      track.scrollLeft %= cycleWidth;
    }
  });
  const resizeObserver = new ResizeObserver(() => updateLoop());
  resizeObserver.observe(track);
  return () => resizeObserver.disconnect();
}

const getText = element => element?.textContent?.trim() || '';

function getRowContent(row) {
  const images = [...row.querySelectorAll('picture, img')];
  const links = [...row.querySelectorAll('a')];
  return { images, links, text: getText(row) };
}

export default function decorate(block) {
  const rows = [...block.children].filter(child => child.tagName === 'DIV');
  if (!rows.length) return;

  const rowContent = rows.map(getRowContent);
  const backgroundImages = [];

  rowContent.forEach(({ images }, rowIndex) => {
    images.forEach(node => {
      const image = node.matches('img') ? node : node.querySelector('img');
      if (!image || backgroundImages.includes(image)) return;
      backgroundImages.push(image);
      image.loading = rowIndex === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';
    });
  });

  const textRows = rowContent.filter(
    ({ images, links, text }) =>
      images.length === 0 && links.length === 0 && text,
  );
  const headingSource = textRows[0]?.text || '';
  const descriptionSource = textRows[1]?.text || '';

  const heading = document.createElement('h1');
  heading.className = 'hero-banner__heading';
  heading.textContent = headingSource;

  const description = document.createElement('p');
  description.className = 'hero-banner__description';
  description.textContent = descriptionSource;

  const buttons = [];
  rowContent.forEach(({ links }) => {
    links.forEach(sourceLink => {
      if (!sourceLink.href || !getText(sourceLink)) return;
      const link = document.createElement('a');
      link.className =
        buttons.length === 0
          ? 'hero-banner__button hero-banner__button--primary'
          : 'hero-banner__button hero-banner__button--secondary';
      link.href = sourceLink.href;
      link.textContent = getText(sourceLink);
      if (sourceLink.target) link.target = sourceLink.target;
      if (sourceLink.rel) link.rel = sourceLink.rel;
      buttons.push(link);
    });
  });

  const section = document.createElement('div');
  section.className = 'hero-banner__visual';
  section.setAttribute('aria-label', 'ETF hero banner');

  const backgrounds = backgroundImages.map((sourceImage, index) => {
    const layer = document.createElement('div');
    layer.className = 'hero-banner__background';
    if (index === 0) layer.classList.add('is-active');

    const picture = sourceImage.closest('picture');
    if (picture) {
      layer.append(picture);
    } else {
      layer.append(sourceImage);
    }
    const image = layer.querySelector('img');
    if (image) {
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
    }
    section.append(layer);
    return layer;
  });

  const shade = document.createElement('div');
  shade.className = 'hero-banner__shade';
  shade.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'hero-banner__content';
  content.append(heading, description);

  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'hero-banner__actions';
  buttons.forEach(button => buttonGroup.append(button));
  if (buttons.length) content.append(buttonGroup);

  const pagination = document.createElement('div');
  pagination.className = 'hero-banner__pagination';
  pagination.setAttribute('role', 'group');
  pagination.setAttribute('aria-label', 'Hero background slides');

  let activeIndex = 0;
  let dots = [];
  function showBackground(index) {
    if (!backgrounds.length) return;
    activeIndex = index;
    backgrounds.forEach((layer, layerIndex) => {
      layer.classList.toggle('is-active', layerIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  dots = backgrounds.map((layer, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-banner__dot';
    dot.setAttribute('aria-label', `Show background ${index + 1}`);
    dot.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    if (index === 0) dot.classList.add('is-active');
    dot.addEventListener('click', () => showBackground(index));
    pagination.append(dot);
    return dot;
  });

  const ticker = document.createElement('div');
  ticker.className = 'hero-banner__ticker';
  ticker.setAttribute('aria-label', 'ETF indicative NAV and market change');

  const tickerTrack = document.createElement('div');
  tickerTrack.className = 'hero-banner__ticker-track';
  ticker.append(tickerTrack);

  section.append(shade, content, pagination, ticker);
  block.replaceChildren(section);

  const stopTickerLoop = startTickerLoop(tickerTrack);

  let tickerRefreshInFlight = false;
  async function refreshTicker() {
    if (tickerRefreshInFlight || !block.isConnected || document.hidden) return;
    tickerRefreshInFlight = true;
    try {
      await loadTickerData(tickerTrack);
    } finally {
      tickerRefreshInFlight = false;
    }
  }
  function resumeTicker() {
    if (!document.hidden) refreshTicker();
  }
  refreshTicker();
  const tickerTimer = window.setInterval(() => {
    if (!block.isConnected) {
      window.clearInterval(tickerTimer);
      stopTickerLoop();
      document.removeEventListener('visibilitychange', resumeTicker);
      return;
    }
    refreshTicker();
  }, INAV_POLL_MS);
  document.addEventListener('visibilitychange', resumeTicker);

  let rotationTimer;

  function stopRotation() {
    if (rotationTimer) window.clearInterval(rotationTimer);
    rotationTimer = null;
  }

  function startRotation() {
    stopRotation();
    if (
      backgrounds.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    rotationTimer = window.setInterval(() => {
      showBackground((activeIndex + 1) % backgrounds.length);
    }, 6000);
  }

  section.addEventListener('mouseenter', stopRotation);
  section.addEventListener('mouseleave', startRotation);
  section.addEventListener('focusin', stopRotation);
  section.addEventListener('focusout', startRotation);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopRotation();
    else startRotation();
  });

  startRotation();
}
