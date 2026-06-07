const settingsEl = document.getElementById('settings');
const statusEl = document.getElementById('status');
let saveTimer = null;

function showStatus(message) {
  statusEl.textContent = message;
  statusEl.classList.add('saved');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    statusEl.textContent = '';
    statusEl.classList.remove('saved');
  }, 2000);
}

function createToggle(key, def, value) {
  const label = document.createElement('label');
  label.className = 'toggle';
  label.innerHTML = `
    <input type="checkbox" data-key="${key}" ${value ? 'checked' : ''}>
    <span class="toggle-slider"></span>
  `;
  label.querySelector('input').addEventListener('change', (e) => {
    saveSetting(key, e.target.checked);
  });
  return label;
}

function createSelect(key, def, value) {
  const select = document.createElement('select');
  select.dataset.key = key;
  for (const opt of def.options) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    option.selected = opt.value === value;
    select.appendChild(option);
  }
  select.addEventListener('change', (e) => {
    saveSetting(key, e.target.value);
  });
  return select;
}

function renderSetting(key, def, value) {
  const article = document.createElement('article');
  article.className = 'setting';

  const header = document.createElement('div');
  header.className = 'setting-header';

  const text = document.createElement('div');
  const labelEl = document.createElement('div');
  labelEl.className = 'setting-label';
  labelEl.textContent = def.label;
  text.appendChild(labelEl);

  if (def.description) {
    const desc = document.createElement('div');
    desc.className = 'setting-description';
    desc.textContent = def.description;
    text.appendChild(desc);
  }

  header.appendChild(text);

  if (def.type === 'toggle') {
    header.appendChild(createToggle(key, def, value));
  }

  article.appendChild(header);

  if (def.type === 'select') {
    const control = document.createElement('div');
    control.className = 'setting-control';
    control.appendChild(createSelect(key, def, value));
    article.appendChild(control);
  }

  return article;
}

async function saveSetting(key, value) {
  try {
    await window.settingsAPI.set(key, value);
    showStatus('Saved');
  } catch (err) {
    statusEl.textContent = 'Failed to save';
    statusEl.classList.remove('saved');
    console.error(err);
  }
}

async function loadSettings() {
  if (!window.settingsAPI) {
    statusEl.textContent = 'Settings API unavailable';
    return;
  }

  try {
    const { settings, defs } = await window.settingsAPI.getAll();
    settingsEl.innerHTML = '';

    for (const [key, def] of Object.entries(defs)) {
      settingsEl.appendChild(renderSetting(key, def, settings[key]));
    }
  } catch (err) {
    statusEl.textContent = 'Failed to load settings';
    console.error(err);
  }
}

loadSettings();
