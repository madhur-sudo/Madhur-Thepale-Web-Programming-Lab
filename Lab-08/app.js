// =====================================================
//  THE PERSONAL INDEX — app.js
//  Shared application logic: storage, validation,
//  rendering, and page-specific initialization.
// =====================================================

// ─── CONSTANTS ─────────────────────────────────────
const STORAGE_KEY = 'personalIndexRecords';

// ─── STORAGE HELPERS ───────────────────────────────

/**
 * Returns true if localStorage is available and writable.
 * Some browsers block it in private mode or when storage is disabled.
 */
function isStorageAvailable() {
  try {
    const probe = '__pi_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read all records from localStorage.
 * Returns an empty array if nothing is stored or JSON is malformed.
 */
function getAllRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist the given array of records to localStorage.
 * Overwrites whatever was previously stored.
 * Throws if the write fails (e.g. QuotaExceededError or storage disabled).
 */
function saveAllRecords(records) {
  // May throw — callers are responsible for catching.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * Find a single record by its ID.
 * Returns the record object, or null if not found.
 */
function findRecordById(id) {
  const records = getAllRecords();
  return records.find(r => r.id === id) || null;
}

/**
 * Create a new record from form field values.
 * Assigns a unique ID and creation timestamp.
 * Appends the record to the stored array.
 * Returns the newly created record, or throws if the write to
 * localStorage fails — so the caller can show an error instead
 * of navigating to a non-existent profile.
 */
function createRecord(fields) {
  const record = {
    id:        generateId(),
    fullName:  sanitizeText(fields.fullName),
    gender:    sanitizeText(fields.gender),
    mobile:    sanitizeText(fields.mobile),
    email:     sanitizeText(fields.email).toLowerCase(),
    city:      sanitizeText(fields.city),
    state:     sanitizeText(fields.state),
    country:   sanitizeText(fields.country),
    createdAt: new Date().toISOString(),
  };

  const records = getAllRecords();
  records.push(record);
  // Throws on failure — do NOT catch here so callers can react.
  saveAllRecords(records);
  return record;
}

/**
 * Delete a record by its ID.
 * Returns true if the record was found and removed.
 */
function deleteRecordById(id) {
  const records = getAllRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return false;
  records.splice(index, 1);
  try {
    saveAllRecords(records);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete ALL records. Clears the storage key entirely.
 */
function deleteAllRecords() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort; if removal fails the UI still clears its own state.
  }
}

// ─── UTILITY FUNCTIONS ─────────────────────────────

/**
 * Generate a short, unique record identifier.
 * Format: IDX-<timestamp fragment>-<random hex>
 */
function generateId() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return `IDX-${ts}-${rnd}`;
}

/**
 * Remove leading/trailing whitespace and collapse internal runs.
 */
function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Safely set the text of a DOM element.
 * If the element doesn't exist, this is a no-op.
 */
function setText(el, value) {
  if (!el) return;
  el.textContent = value || '—';
}

/**
 * Get a URL query parameter value.
 */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Format an ISO timestamp into a human-readable string.
 * Example: "21 Oct 2026, 20:17"
 */
function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', {
      day:    '2-digit',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

/**
 * Format a full location string from city, state, country.
 */
function formatLocation(record) {
  return [record.city, record.state, record.country]
    .filter(Boolean)
    .join(', ');
}

// ─── VALIDATION ────────────────────────────────────

/**
 * Validate a phone number loosely.
 * Accepts an optional leading + or 00, then 7–15 digits,
 * with optional spaces, dashes, and parentheses.
 * Rejects inputs that are clearly too short or not phone-shaped.
 */
function isValidMobile(value) {
  const stripped = value.replace(/[\s\-().]/g, '');
  // Must be 7–15 digits after stripping formatting, optionally starting with +
  return /^\+?\d{7,15}$/.test(stripped);
}

/**
 * Validate an email address.
 * Uses a reasonable pattern without being overly strict.
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

// ─── TOAST NOTIFICATION ───────────────────────────

let toastTimer = null;

function showToast(message, type = 'success') {
  let toast = document.getElementById('js-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'js-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast toast--${type}`;
  // Force reflow to re-trigger transition
  void toast.offsetWidth;
  toast.classList.add('is-visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3500);
}

// ─── DIALOG (CONFIRMATION) ────────────────────────

function openDialog(overlayEl) {
  if (!overlayEl) return;
  overlayEl.classList.add('is-open');
  // Focus the confirm button
  const confirmBtn = overlayEl.querySelector('[data-dialog-confirm]');
  if (confirmBtn) confirmBtn.focus();
}

function closeDialog(overlayEl) {
  if (!overlayEl) return;
  overlayEl.classList.remove('is-open');
}

// ─── PAGE: INDEX (FORM) ───────────────────────────

function initFormPage() {
  const form      = document.getElementById('entry-form');
  if (!form) return;

  // Show a persistent storage-unavailable warning if localStorage is blocked.
  if (!isStorageAvailable()) {
    const submitBtn = document.getElementById('btn-submit');
    const formArea  = document.getElementById('entry-form-area');
    if (submitBtn) submitBtn.disabled = true;
    if (formArea) {
      const banner = document.createElement('div');
      banner.className = 'notice notice--error';
      banner.setAttribute('role', 'alert');
      banner.textContent =
        'Storage unavailable: your browser has blocked local storage. ' +
        'Records cannot be saved. Try disabling private/incognito mode or ' +
        'enabling cookies for this site.';
      formArea.insertBefore(banner, formArea.firstChild);
    }
    return;
  }

  const fields = {
    fullName: document.getElementById('field-fullname'),
    gender:   form.querySelectorAll('input[name="gender"]'),
    mobile:   document.getElementById('field-mobile'),
    email:    document.getElementById('field-email'),
    city:     document.getElementById('field-city'),
    state:    document.getElementById('field-state'),
    country:  document.getElementById('field-country'),
  };

  const errors = {
    fullName: document.getElementById('err-fullname'),
    gender:   document.getElementById('err-gender'),
    mobile:   document.getElementById('err-mobile'),
    email:    document.getElementById('err-email'),
    city:     document.getElementById('err-city'),
    state:    document.getElementById('err-state'),
    country:  document.getElementById('err-country'),
  };

  // Clear error on input
  function clearError(inputEl, errorEl) {
    if (inputEl) {
      inputEl.classList.remove('form-input--error', 'form-select--error');
    }
    if (errorEl) errorEl.textContent = '';
  }

  function setError(inputEl, errorEl, message) {
    if (inputEl) {
      inputEl.classList.add('form-input--error');
    }
    if (errorEl) errorEl.textContent = message;
  }

  // Attach live-clearing listeners
  if (fields.fullName) {
    fields.fullName.addEventListener('input', () => clearError(fields.fullName, errors.fullName));
  }
  if (fields.mobile) {
    fields.mobile.addEventListener('input', () => clearError(fields.mobile, errors.mobile));
  }
  if (fields.email) {
    fields.email.addEventListener('input', () => clearError(fields.email, errors.email));
  }
  if (fields.city) {
    fields.city.addEventListener('input', () => clearError(fields.city, errors.city));
  }
  if (fields.state) {
    fields.state.addEventListener('input', () => clearError(fields.state, errors.state));
  }
  if (fields.country) {
    fields.country.addEventListener('input', () => clearError(fields.country, errors.country));
  }
  fields.gender.forEach(r => {
    r.addEventListener('change', () => {
      if (errors.gender) errors.gender.textContent = '';
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let firstInvalidEl = null;
    let valid = true;

    // --- Validate full name
    const fullNameVal = fields.fullName ? fields.fullName.value.trim() : '';
    if (!fullNameVal) {
      setError(fields.fullName, errors.fullName, 'Please enter your full name.');
      if (!firstInvalidEl) firstInvalidEl = fields.fullName;
      valid = false;
    } else {
      clearError(fields.fullName, errors.fullName);
    }

    // --- Validate gender
    const selectedGender = [...fields.gender].find(r => r.checked);
    if (!selectedGender) {
      if (errors.gender) errors.gender.textContent = 'Please select a gender option.';
      if (!firstInvalidEl) firstInvalidEl = fields.gender[0];
      valid = false;
    } else {
      if (errors.gender) errors.gender.textContent = '';
    }

    // --- Validate mobile
    const mobileVal = fields.mobile ? fields.mobile.value.trim() : '';
    if (!mobileVal) {
      setError(fields.mobile, errors.mobile, 'Please enter your mobile number.');
      if (!firstInvalidEl) firstInvalidEl = fields.mobile;
      valid = false;
    } else if (!isValidMobile(mobileVal)) {
      setError(fields.mobile, errors.mobile, 'Enter a valid phone number (7–15 digits, optional country code).');
      if (!firstInvalidEl) firstInvalidEl = fields.mobile;
      valid = false;
    } else {
      clearError(fields.mobile, errors.mobile);
    }

    // --- Validate email
    const emailVal = fields.email ? fields.email.value.trim() : '';
    if (!emailVal) {
      setError(fields.email, errors.email, 'Please enter your email address.');
      if (!firstInvalidEl) firstInvalidEl = fields.email;
      valid = false;
    } else if (!isValidEmail(emailVal)) {
      setError(fields.email, errors.email, 'Enter a valid email address (e.g. name@example.com).');
      if (!firstInvalidEl) firstInvalidEl = fields.email;
      valid = false;
    } else {
      clearError(fields.email, errors.email);
    }

    // --- Validate city
    const cityVal = fields.city ? fields.city.value.trim() : '';
    if (!cityVal) {
      setError(fields.city, errors.city, 'Please enter your city.');
      if (!firstInvalidEl) firstInvalidEl = fields.city;
      valid = false;
    } else {
      clearError(fields.city, errors.city);
    }

    // --- Validate state
    const stateVal = fields.state ? fields.state.value.trim() : '';
    if (!stateVal) {
      setError(fields.state, errors.state, 'Please enter your state or region.');
      if (!firstInvalidEl) firstInvalidEl = fields.state;
      valid = false;
    } else {
      clearError(fields.state, errors.state);
    }

    // --- Validate country
    const countryVal = fields.country ? fields.country.value.trim() : '';
    if (!countryVal) {
      setError(fields.country, errors.country, 'Please enter your country.');
      if (!firstInvalidEl) firstInvalidEl = fields.country;
      valid = false;
    } else {
      clearError(fields.country, errors.country);
    }

    if (!valid) {
      if (firstInvalidEl) firstInvalidEl.focus();
      return;
    }

    // All valid — attempt to create and save the record.
    let record;
    try {
      record = createRecord({
        fullName: fullNameVal,
        gender:   selectedGender.value,
        mobile:   mobileVal,
        email:    emailVal,
        city:     cityVal,
        state:    stateVal,
        country:  countryVal,
      });
    } catch (err) {
      // Storage write failed (e.g. QuotaExceededError).
      // Show a visible error and do NOT navigate — there is no saved record to view.
      const formArea = document.getElementById('entry-form-area');
      let banner = document.getElementById('storage-error-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'storage-error-banner';
        banner.className = 'notice notice--error';
        banner.setAttribute('role', 'alert');
        if (formArea) formArea.insertBefore(banner, formArea.firstChild);
        else document.body.prepend(banner);
      }
      const errMsg = err && err.name === 'QuotaExceededError'
        ? 'Storage is full. Please delete some records before adding new ones.'
        : 'Could not save the record. Your browser may have blocked local storage.';
      banner.textContent = errMsg;
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Successfully saved — navigate to profile.
    window.location.href = `profile.html?id=${encodeURIComponent(record.id)}`;
  });
}

// ─── PAGE: PROFILE ─────────────────────────────────

function initProfilePage() {
  const recordId = getParam('id');
  const contentEl = document.getElementById('profile-content');
  const emptyEl   = document.getElementById('profile-empty');

  if (!contentEl || !emptyEl) return;

  if (!recordId) {
    showEmptyProfile(emptyEl, contentEl, 'No record ID provided.');
    return;
  }

  const record = findRecordById(recordId);

  if (!record) {
    showEmptyProfile(emptyEl, contentEl, 'This record could not be found. It may have been deleted.');
    return;
  }

  // Populate the profile
  contentEl.style.display = '';
  emptyEl.style.display   = 'none';

  // Breadcrumb record ID
  const metaIdEl = document.getElementById('profile-record-id');
  if (metaIdEl) metaIdEl.textContent = record.id;

  // Primary name
  setText(document.getElementById('profile-fullname'), record.fullName);

  // Contact
  setText(document.getElementById('profile-email'),  record.email);
  setText(document.getElementById('profile-mobile'), record.mobile);

  // Identity
  setText(document.getElementById('profile-gender'), record.gender);

  // Location
  setText(document.getElementById('profile-city'),    record.city);
  setText(document.getElementById('profile-state'),   record.state);
  setText(document.getElementById('profile-country'), record.country);

  // Location combined
  const locEl = document.getElementById('profile-location-full');
  if (locEl) locEl.textContent = formatLocation(record);

  // Timestamp
  const tsEl = document.getElementById('profile-created-at');
  if (tsEl) tsEl.textContent = 'Created ' + formatDate(record.createdAt);

  // Set page title
  document.title = `${record.fullName} — The Personal Index`;

  // Wire up delete
  const deleteBtn = document.getElementById('btn-delete');
  const dialogOverlay = document.getElementById('dialog-delete');
  const dialogConfirm = document.getElementById('dialog-confirm');
  const dialogCancel  = document.getElementById('dialog-cancel');

  if (deleteBtn && dialogOverlay) {
    deleteBtn.addEventListener('click', () => openDialog(dialogOverlay));
  }

  if (dialogCancel && dialogOverlay) {
    dialogCancel.addEventListener('click', () => {
      closeDialog(dialogOverlay);
      if (deleteBtn) deleteBtn.focus();
    });
  }

  if (dialogOverlay) {
    dialogOverlay.addEventListener('click', (e) => {
      if (e.target === dialogOverlay) {
        closeDialog(dialogOverlay);
        if (deleteBtn) deleteBtn.focus();
      }
    });
    dialogOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDialog(dialogOverlay);
        if (deleteBtn) deleteBtn.focus();
      }
    });
  }

  if (dialogConfirm) {
    dialogConfirm.addEventListener('click', () => {
      closeDialog(dialogOverlay);
      const deleted = deleteRecordById(record.id);
      if (deleted) {
        window.location.href = 'directory.html?deleted=1';
      } else {
        showToast('Could not delete record.', 'error');
      }
    });
  }
}

function showEmptyProfile(emptyEl, contentEl, message) {
  if (contentEl) contentEl.style.display = 'none';
  if (emptyEl)   emptyEl.style.display   = '';

  const msgEl = document.getElementById('profile-empty-msg');
  if (msgEl) msgEl.textContent = message;
}

// ─── PAGE: DIRECTORY ───────────────────────────────

function initDirectoryPage() {
  const tableBody  = document.getElementById('dir-tbody');
  const cardList   = document.getElementById('dir-cards');
  const countEl    = document.getElementById('dir-count-num');
  const emptyEl    = document.getElementById('dir-empty');
  const noResultEl = document.getElementById('dir-no-results');
  const searchEl   = document.getElementById('dir-search');
  const tableWrap  = document.getElementById('dir-table-wrap');

  if (!tableBody && !cardList) return;

  // Check for deletion success message
  if (getParam('deleted') === '1') {
    showToast('Record deleted successfully.');
    // Clean the URL
    history.replaceState(null, '', 'directory.html');
  }

  let allRecords = getAllRecords();

  // ── "Clear all" controls ──────────────────────────────────────────────────
  const clearAllBtn = document.getElementById('btn-clear-all');
  const clearDialog = document.getElementById('dialog-clear');
  const clearConfirm= document.getElementById('dialog-clear-confirm');
  const clearCancel = document.getElementById('dialog-clear-cancel');

  /**
   * Sync the "Clear all" button's disabled/hidden state with the record count.
   * Button is hidden (visually + from AT) when there are no records.
   */
  function syncClearAllBtn(recordCount) {
    if (!clearAllBtn) return;
    if (recordCount === 0) {
      clearAllBtn.disabled = true;
      clearAllBtn.setAttribute('aria-disabled', 'true');
      clearAllBtn.style.display = 'none';
    } else {
      clearAllBtn.disabled = false;
      clearAllBtn.removeAttribute('aria-disabled');
      clearAllBtn.style.display = '';
    }
  }

  // Initial state
  syncClearAllBtn(allRecords.length);

  if (clearAllBtn && clearDialog) {
    clearAllBtn.addEventListener('click', () => {
      if (allRecords.length === 0) return; // belt-and-suspenders
      openDialog(clearDialog);
    });
  }

  if (clearCancel && clearDialog) {
    clearCancel.addEventListener('click', () => {
      closeDialog(clearDialog);
      if (clearAllBtn) clearAllBtn.focus();
    });
  }

  if (clearDialog) {
    clearDialog.addEventListener('click', (e) => {
      if (e.target === clearDialog) {
        closeDialog(clearDialog);
        if (clearAllBtn) clearAllBtn.focus();
      }
    });
    clearDialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDialog(clearDialog);
        if (clearAllBtn) clearAllBtn.focus();
      }
    });
  }

  if (clearConfirm) {
    clearConfirm.addEventListener('click', () => {
      closeDialog(clearDialog);
      deleteAllRecords();
      allRecords = [];
      renderDirectory('');
      if (searchEl) searchEl.value = '';
      showToast('All records cleared.');
    });
  }

  // ── Per-row delete dialog ─────────────────────────────────────────────────
  // A single reusable dialog injected into the DOM for per-row deletions,
  // matching the pattern used on the profile page (keyboard-accessible).
  let rowDeleteDialog      = null;
  let rowDeletePendingId   = null;
  let rowDeletePendingName = null;
  let rowDeleteTriggerEl   = null;

  function getOrCreateRowDeleteDialog() {
    if (rowDeleteDialog) return rowDeleteDialog;

    const overlay = document.createElement('div');
    overlay.id = 'dialog-row-delete';
    overlay.className = 'dialog-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'dialog-row-delete-title');
    overlay.innerHTML = [
      '<div class="dialog">',
      '  <h2 class="dialog__title" id="dialog-row-delete-title">Delete this record?</h2>',
      '  <p class="dialog__desc" id="dialog-row-delete-desc">',
      '    This will permanently remove this record from your browser\u2019s local storage.',
      '    This action cannot be undone.',
      '  </p>',
      '  <div class="dialog__actions">',
      '    <button type="button" class="btn-secondary" id="dialog-row-delete-cancel">Cancel</button>',
      '    <button type="button" class="btn-danger" id="dialog-row-delete-confirm" data-dialog-confirm>Delete permanently</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    const cancelBtn  = overlay.querySelector('#dialog-row-delete-cancel');
    const confirmBtn = overlay.querySelector('#dialog-row-delete-confirm');

    cancelBtn.addEventListener('click', () => {
      closeDialog(overlay);
      if (rowDeleteTriggerEl) rowDeleteTriggerEl.focus();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDialog(overlay);
        if (rowDeleteTriggerEl) rowDeleteTriggerEl.focus();
      }
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDialog(overlay);
        if (rowDeleteTriggerEl) rowDeleteTriggerEl.focus();
      }
    });

    confirmBtn.addEventListener('click', () => {
      closeDialog(overlay);
      const id   = rowDeletePendingId;
      const name = rowDeletePendingName;
      rowDeletePendingId   = null;
      rowDeletePendingName = null;
      rowDeleteTriggerEl   = null;

      const ok = deleteRecordById(id);
      if (ok) {
        allRecords = getAllRecords();
        renderDirectory(searchEl ? searchEl.value.trim().toLowerCase() : '');
        showToast('Record for "' + name + '" deleted.');
      } else {
        showToast('Could not delete this record.', 'error');
      }
    });

    rowDeleteDialog = overlay;
    return overlay;
  }

  function handleRowDelete(id, name, triggerEl) {
    rowDeletePendingId   = id;
    rowDeletePendingName = name;
    rowDeleteTriggerEl   = triggerEl || null;
    const dialog = getOrCreateRowDeleteDialog();
    const descEl = dialog.querySelector('#dialog-row-delete-desc');
    if (descEl) {
      descEl.textContent =
        'This will permanently remove the record for "' + name + '" from your browser\u2019s local storage. ' +
        'This action cannot be undone.';
    }
    openDialog(dialog);
  }

  // ── Search ────────────────────────────────────────────────────────────────
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      const query = searchEl.value.trim().toLowerCase();
      renderDirectory(query);
    });
  }

  // Initial render
  renderDirectory('');

  // ── Render ────────────────────────────────────────────────────────────────
  function renderDirectory(query) {
    // Always re-read from storage so deletions performed elsewhere are reflected.
    allRecords = getAllRecords();

    let filtered = allRecords;
    if (query) {
      filtered = allRecords.filter(r => {
        const haystack = [
          r.fullName, r.email, r.city, r.state, r.country
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    // Update counter
    if (countEl) countEl.textContent = allRecords.length;

    // Sync the "Clear all" button
    syncClearAllBtn(allRecords.length);

    // Visibility logic
    const hasRecords = allRecords.length > 0;
    const hasResults = filtered.length > 0;

    if (emptyEl)    emptyEl.style.display    = hasRecords ? 'none' : '';
    if (noResultEl) noResultEl.style.display = (hasRecords && !hasResults) ? '' : 'none';
    if (tableWrap)  tableWrap.style.display  = hasResults ? '' : 'none';

    if (!hasResults) {
      if (tableBody) tableBody.innerHTML = '';
      if (cardList)  cardList.innerHTML  = '';
      return;
    }

    // Render desktop table rows
    if (tableBody) {
      tableBody.innerHTML = '';
      filtered.forEach(record => {
        const tr = document.createElement('tr');

        // Name + email cell
        const nameTd = document.createElement('td');
        const nameDiv = document.createElement('div');
        nameDiv.className = 'dir-table__name';
        nameDiv.textContent = record.fullName;
        const emailDiv = document.createElement('div');
        emailDiv.className = 'dir-table__email';
        emailDiv.textContent = record.email;
        nameTd.appendChild(nameDiv);
        nameTd.appendChild(emailDiv);
        tr.appendChild(nameTd);

        // Mobile
        const mobTd = document.createElement('td');
        mobTd.textContent = record.mobile;
        tr.appendChild(mobTd);

        // Location
        const locTd = document.createElement('td');
        locTd.className = 'dir-table__loc';
        locTd.textContent = formatLocation(record);
        tr.appendChild(locTd);

        // Actions
        const actTd = document.createElement('td');
        const actDiv = document.createElement('div');
        actDiv.className = 'dir-table__actions';

        const viewLink = document.createElement('a');
        viewLink.href = 'profile.html?id=' + encodeURIComponent(record.id);
        viewLink.className = 'dir-table__view-btn';
        viewLink.textContent = 'View \u2197';
        viewLink.setAttribute('aria-label', 'View record for ' + record.fullName);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'dir-table__del-btn';
        delBtn.textContent = '\u00D7';
        delBtn.setAttribute('aria-label', 'Delete record for ' + record.fullName);
        delBtn.dataset.id = record.id;
        delBtn.addEventListener('click', () => handleRowDelete(record.id, record.fullName, delBtn));

        actDiv.appendChild(viewLink);
        actDiv.appendChild(delBtn);
        actTd.appendChild(actDiv);
        tr.appendChild(actTd);

        tableBody.appendChild(tr);
      });
    }

    // Render mobile cards
    if (cardList) {
      cardList.innerHTML = '';
      filtered.forEach(record => {
        const item = document.createElement('div');
        item.className = 'dir-card-item';

        const nameEl = document.createElement('div');
        nameEl.className = 'dir-card-item__name';
        nameEl.textContent = record.fullName;

        // Show email and location on separate lines to prevent awkward wrapping.
        const emailEl = document.createElement('div');
        emailEl.className = 'dir-card-item__detail dir-card-item__detail--email';
        emailEl.textContent = record.email;

        const locEl = document.createElement('div');
        locEl.className = 'dir-card-item__detail';
        locEl.textContent = formatLocation(record);

        const actionsEl = document.createElement('div');
        actionsEl.className = 'dir-card-item__actions';

        const viewLink = document.createElement('a');
        viewLink.href = 'profile.html?id=' + encodeURIComponent(record.id);
        viewLink.className = 'dir-table__view-btn';
        viewLink.textContent = 'View \u2197';
        viewLink.setAttribute('aria-label', 'View record for ' + record.fullName);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-danger';
        delBtn.textContent = 'Delete';
        delBtn.dataset.id = record.id;
        delBtn.addEventListener('click', () => handleRowDelete(record.id, record.fullName, delBtn));

        actionsEl.appendChild(viewLink);
        actionsEl.appendChild(delBtn);

        item.appendChild(nameEl);
        item.appendChild(emailEl);
        item.appendChild(locEl);
        item.appendChild(actionsEl);
        cardList.appendChild(item);
      });
    }
  }
}

// ─── ROUTER — PAGE DETECTION ──────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  switch (page) {
    case 'index':
      initFormPage();
      break;
    case 'profile':
      initProfilePage();
      break;
    case 'directory':
      initDirectoryPage();
      break;
  }
});
