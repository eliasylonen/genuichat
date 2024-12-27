export const cleanHtml = (html) => {
  return html.replace(/^.*```html\n|```.*$/g, '');
}; 