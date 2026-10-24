export default function decorate(block) {
  const titleCell = block.firstElementChild?.firstElementChild;
  const title = (titleCell || block).textContent.trim();

  const heading = document.createElement('h2');
  heading.className = 'model-lab-title';
  heading.textContent = title || 'Default Heading';

  if (titleCell) {
    // Keep the field's Universal Editor instrumentation on its original cell.
    titleCell.replaceChildren(heading);
  } else {
    block.replaceChildren(heading);
  }
}
