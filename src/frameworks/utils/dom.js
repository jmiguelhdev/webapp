/** Utility to create an element with optional classes and text */
export function el(tag, { classes = [], text = '', html = '', attrs = {}, style = '' } = {}) {
  const element = document.createElement(tag);
  const validClasses = classes.filter(c => c && typeof c === 'string' && c.trim() !== '');
  if (validClasses.length) element.classList.add(...validClasses);


  if (text) element.textContent = text;
  if (html) element.innerHTML = html;
  if (style) element.style.cssText = style;
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  return element;
}
