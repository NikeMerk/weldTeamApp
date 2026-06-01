// loader.js
export function showLoader(text = 'Загрузка...') {
  const loader = document.getElementById('customLoader');
  if (loader) {
    const textDiv = loader.querySelector('div:last-child');
    if (textDiv) textDiv.textContent = text;
    loader.style.display = 'flex';
  }
}

export function hideLoader() {
  const loader = document.getElementById('customLoader');
  if (loader) loader.style.display = 'none';
}