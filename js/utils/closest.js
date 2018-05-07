import match from './matches-selector.js';

export default function closest(element, selector, checkYoSelf) {
  let parent = checkYoSelf ? element : element.parentNode;

  while (parent && parent !== document) {
    if (match(parent, selector)) return parent;
    parent = parent.parentNode;
  }
}
