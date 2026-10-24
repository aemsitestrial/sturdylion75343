export default function decorate(block) {
  const title = block.textContent.trim();

  block.textContent = '';

  const heading = document.createElement('h2');
  heading.className = 'model-lab-title';
  heading.textContent = title || 'Default Heading';

  block.append(heading);
}
