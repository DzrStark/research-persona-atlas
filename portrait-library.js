const personaPicker = /** @type {HTMLSelectElement} */ (document.querySelector('#personaPicker'));
personaPicker.innerHTML = names.map((name, position) =>
  '<option value="' + position + '">P' + String(position + 1).padStart(2, '0') + ' · ' + name + '</option>').join('');
let libraryPosition = 0;
document.querySelector('#libraryGallery').innerHTML = names.map((name, position) => characterTile(position, '#' + personaCode(position))).join('');

function renderLibrary(moveFocus = false) {
  const match = /^#P(0[1-9]|1[0-6])$/.exec(location.hash);
  libraryPosition = match ? Number(match[1]) - 1 : 0;
  personaPicker.value = String(libraryPosition);
  document.querySelector('#libraryEnglish').textContent = en[libraryPosition];
  document.querySelector('#libraryName').textContent = names[libraryPosition];
  document.querySelector('#libraryPortrait').innerHTML = portraitMarkup(libraryPosition);
  document.title = names[libraryPosition] + ' · 科研人格手册';
  document.querySelectorAll('#libraryGallery a').forEach(tile => {
    if (Number(tile.getAttribute('data-persona')) === libraryPosition) tile.setAttribute('aria-current', 'true');
    else tile.removeAttribute('aria-current');
  });
  if (moveFocus) {
    const heading = /** @type {HTMLElement} */ (document.querySelector('#libraryName'));
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function choosePersona(position) {
  location.hash = 'P' + String((position + 16) % 16 + 1).padStart(2, '0');
}

personaPicker.addEventListener('change', () => choosePersona(Number(personaPicker.value)));
document.querySelector('#previousPersona').addEventListener('click', () => choosePersona(libraryPosition - 1));
document.querySelector('#nextPersona').addEventListener('click', () => choosePersona(libraryPosition + 1));
window.addEventListener('hashchange', () => renderLibrary(true));
renderLibrary();
