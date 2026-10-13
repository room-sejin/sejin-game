/* Responsive room layout: move the existing controls, retaining their listeners. */
(() => {
  const room = document.getElementById('room');
  const panel = document.getElementById('p-room');
  const controls = ['.tools', '.side', '.needs', '#bannerSlot'].map(selector => {
    const element = panel.querySelector(selector);
    const anchor = document.createComment('responsive control position');
    element.before(anchor);
    return { element, anchor };
  });
  const sidebar = document.createElement('aside');
  sidebar.className = 'room-sidebar';
  sidebar.setAttribute('aria-label', '방 메뉴와 돌봄');
  sidebar.hidden = true;
  panel.append(sidebar);
  const wide = matchMedia('(min-width: 740px)');
  function arrange() {
    sidebar.hidden = !wide.matches;
    controls.forEach(({ element, anchor }) => {
      if (wide.matches) sidebar.append(element);
      else anchor.after(element);
    });
  }
  wide.addEventListener('change', arrange);
  arrange();
})();
