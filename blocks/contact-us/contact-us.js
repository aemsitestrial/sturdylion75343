function cleanText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value = '') {
  return cleanText(value).toLowerCase().replace(/[\s_-]+/g, '');
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function readAuthoring(block) {
  const fields = {};
  const positional = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const values = cells.map((cell) => cleanText(cell.textContent)).filter(Boolean);
    if (!values.length) return;

    const key = normalizeKey(values[0]);
    const value = values.slice(1).join(' ').trim();

    if (value && [
      'title',
      'heading',
      'description',
      'subtitle',
      'mobile',
      'mobilenumber',
      'mobilenumber1',
      'mobilenumber2',
      'phone',
      'phone1',
      'phone2',
      'email',
      'emailaddress',
    ].includes(key)) {
      fields[key] = value;
      return;
    }

    if (cells.length === 1) {
      positional.push(values[0].replace(/^row\s*[.:]?\s*\d+\s*:\s*/i, '').trim());
    }
  });

  // The block is authored as four simple rows:
  // title, description, phone number(s), email.
  if (!fields.title && !fields.heading && positional[0]) fields.title = positional[0];
  if (!fields.description && !fields.subtitle && positional[1]) fields.description = positional[1];
  if (!fields.mobile && !fields.mobilenumber && !fields.phone && positional[2]) fields.mobile = positional[2];
  if (!fields.email && !fields.emailaddress && positional[3]) fields.email = positional[3];

  return fields;
}

function getContactData(block) {
  const fields = readAuthoring(block);

  const phoneValues = [
    fields.mobilenumber1,
    fields.mobilenumber2,
    fields.phone1,
    fields.phone2,
  ].filter(Boolean);

  if (!phoneValues.length && fields.mobile) {
  const mobileValues = fields.mobile
    .replace(/\/\s*/g, '/\n')
    .split(/[\n,|]+/)
    .map(cleanText)
    .filter(Boolean);

  phoneValues.push(...mobileValues);
}

  if (!phoneValues.length && fields.mobilenumber) {
    phoneValues.push(...fields.mobilenumber.split(/[\n,|]+/).map(cleanText).filter(Boolean));
  }

  if (!phoneValues.length && fields.phone) {
    phoneValues.push(...fields.phone.split(/[\n,|]+/).map(cleanText).filter(Boolean));
  }

  return {
    title: fields.title || fields.heading || 'Get in touch with us?',
    description: fields.description || fields.subtitle || '',
    phones: phoneValues,
    email: cleanText(fields.email || fields.emailaddress || '').replace(/\\@/g, '@'),
  };
}

const CALL_ICON = `
  <svg class="contact-us__icon-svg" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M20.1 15.7c-1.1 1.1-2.1 1.8-3.2 1.4-1.8-.6-3.8-2.1-5.8-4.1s-3.5-4-4.1-5.8c-.4-1.1.3-2.1 1.4-3.2l1.2-1.2c.5-.5.5-1.3.1-1.8L7.8 1.9c-.4-.6-1.3-.7-1.8-.2L4.2 3.5c-1.2 1.2-1.7 3-1.1 4.7 1 3.1 3.2 6.4 6.2 9.4s6.3 5.2 9.4 6.2c1.7.6 3.5.1 4.7-1.1l1.8-1.8c.5-.5.4-1.4-.2-1.8l-5.1-3.3c-.5-.4-1.3-.3-1.8.1l-1.2 1.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M15 5.5c1.9.4 3.1 1.6 3.5 3.5M15 2.5c3.5.4 5.6 2.5 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;

const EMAIL_ICON = `
  <svg class="contact-us__icon-svg" aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/>
    <path d="m5 7 6 5a1.6 1.6 0 0 0 2 0l6-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

export default function decorate(block) {
  block.classList.add('contact-us');

const {
  title,
  description,
  phones,
  email,
} = getContactData(block);

  const phoneMarkup = phones.map((phone) => `<span class="contact-us__value-line">${escapeHtml(phone)}</span>`).join('');

  block.innerHTML = `
    <section class="contact-us__section" aria-labelledby="contact-us-title">
      <div class="contact-us__inner">
        <div class="contact-us__copy">
          <h2 id="contact-us-title" class="contact-us__title">${escapeHtml(title)}</h2>
          <p class="contact-us__description">${escapeHtml(description)}</p>
        </div>

        <div class="contact-us__cards">
          <article class="contact-us__card">
            <div class="contact-us__icon-box">${CALL_ICON}</div>
            <div class="contact-us__card-copy">
              <h3 class="contact-us__card-title">Give us a call</h3>
              <div class="contact-us__card-value">${phoneMarkup}</div>
            </div>
          </article>

          <article class="contact-us__card">
            <div class="contact-us__icon-box">${EMAIL_ICON}</div>
            <div class="contact-us__card-copy">
              <h3 class="contact-us__card-title">Get in touch via email</h3>
              <div class="contact-us__card-value">${escapeHtml(email)}</div>
            </div>
          </article>
        </div>
      </div>
    </section>
  `;
}
