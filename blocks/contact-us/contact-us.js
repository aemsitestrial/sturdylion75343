export default function decorate(block) {
  const rows = [...block.children];

  const [title, description, mobile, email] = rows.map(
    (row) => row.textContent.trim(),
  );

  block.innerHTML = `
    <h2>${title || 'Contact Us'}</h2>
    <p>${description || ''}</p>
    <p>Phone: ${mobile || ''}</p>
    <p>Email: ${email || ''}</p>
  `;
}
