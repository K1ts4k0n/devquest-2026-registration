const form = document.querySelector('#registrationForm');
const toast = document.querySelector('#toast');
const budget = document.querySelector('#budget');
const budgetValue = document.querySelector('#budgetValue');
const portfolio = document.querySelector('#portfolio');
const fileLabel = document.querySelector('#fileLabel');
const comments = document.querySelector('#comments');
const charCount = document.querySelector('#charCount');
const cursorGlow = document.querySelector('.cursor-glow');

let toastTimer = null;

const requiredFields = {
  fullName: {
    message: 'Please enter your full name (first and last name).',
    validate: value => {
      const trimmed = value.trim();
      const thai = '\\u0E01-\\u0E2E\\u0E30-\\u0E3A\\u0E40-\\u0E4E';
      const token = `[A-Za-z${thai}]+(?:['\\-.][A-Za-z${thai}]+)*`;
      const regex = new RegExp(`^(?=.{4,}$)${token}(?:\\s+${token})+$`);
      return regex.test(trimmed);
    }
  },
  email: {
    message: 'Please enter a valid email address (e.g. name@example.com).',
    validate: value => /^[A-Za-z0-9._%+-]+@([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/.test(value.trim())
  },
  phone: {
    message: 'Please enter a valid 9–10 digit Thai phone number (e.g. 08X-XXX-XXXX or +66...).',
    validate: value => {
      const cleaned = value.trim().replace(/[\s\-().]/g, '').replace(/^\+660?/, '0');
      return /^(0[689]\d{8}|0[2-57]\d{7})$/.test(cleaned);
    }
  },
  birthDate: {
    message: 'Applicants must be at least 15 years old (and maximum 100 years).',
    currentMessage: null,
    validate: (value, element) => {
      if (!value) return false;
      const parts = value.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return false;
      const [year, month, day] = parts;
      const birth = new Date(year, month - 1, day);
      const now = new Date();
      if (isNaN(birth.getTime())) return false;

      // Ensure date is a valid calendar date (prevent Feb 30/31 rollover)
      if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) {
        if (element) {
          requiredFields.birthDate.currentMessage = 'Please enter a valid calendar date.';
        }
        return false;
      }

      if (birth > now) {
        if (element) {
          requiredFields.birthDate.currentMessage = 'Date of birth cannot be in the future.';
        }
        return false;
      }
      let age = now.getFullYear() - year;
      const m = (now.getMonth() + 1) - month;
      if (m < 0 || (m === 0 && now.getDate() < day)) {
        age--;
      }
      if (age < 15) {
        if (element) {
          requiredFields.birthDate.currentMessage = 'Applicants must be at least 15 years old.';
        }
        return false;
      }
      if (age > 100) {
        if (element) {
          requiredFields.birthDate.currentMessage = 'Please enter a realistic date of birth (maximum 100 years old).';
        }
        return false;
      }
      return true;
    }
  },
  experience: { message: 'Please select your experience level.', validate: value => value !== '' },
  contactMethod: { message: 'Please select a contact method.', validate: value => value !== '' },
  portfolio: {
    message: 'Please upload your portfolio or student ID (JPG, PNG, PDF up to 5 MB).',
    currentMessage: null,
    validate: (value, element) => {
      const file = portfolio.files?.[0];
      if (!file) {
        if (element) requiredFields.portfolio.currentMessage = 'Please upload your portfolio or student ID.';
        return false;
      }
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const validExt = /\.(jpe?g|png|pdf)$/i.test(file.name);
      const typeMatches = validTypes.includes(file.type) || file.type === '';
      if (!typeMatches || !validExt) {
        if (element) requiredFields.portfolio.currentMessage = 'Invalid file type. Only JPG, PNG, and PDF files are allowed.';
        return false;
      }
      if (file.size <= 0) {
        if (element) requiredFields.portfolio.currentMessage = 'The uploaded file is empty (0 bytes).';
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        if (element) requiredFields.portfolio.currentMessage = 'File size exceeds 5 MB. Please choose a smaller file.';
        return false;
      }
      return true;
    }
  }
};

function setError(element, message = '') {
  const field = element.closest('.field');
  if (!field) return;
  field.classList.toggle('invalid', Boolean(message));
  field.querySelector('.error').textContent = message;
  element.setAttribute('aria-invalid', Boolean(message));
}

function validateField(id) {
  const element = document.querySelector(`#${id}`);
  const rule = requiredFields[id];
  const valid = rule.validate(element.value, element);
  const message = valid ? '' : (rule.currentMessage || rule.message);
  rule.currentMessage = null;
  setError(element, message);
  return valid;
}

Object.keys(requiredFields).forEach(id => {
  const element = document.querySelector(`#${id}`);
  element.addEventListener('blur', () => validateField(id));
  element.addEventListener('change', () => validateField(id));
  element.addEventListener('input', () => {
    if (element.closest('.field')?.classList.contains('invalid')) {
      validateField(id);
    }
  });
});

budget.addEventListener('input', () => { budgetValue.textContent = `${Number(budget.value).toLocaleString('en-US')} THB`; });
comments.addEventListener('input', () => {
  charCount.textContent = comments.value.length;
  charCount.parentElement?.classList.toggle('limit', comments.value.length >= 350);
});
portfolio.addEventListener('change', () => {
  const file = portfolio.files?.[0];
  fileLabel.textContent = file ? file.name : 'Choose a file or drop it here';
  validateField('portfolio');
});

const dropzone = document.querySelector('.dropzone');
if (dropzone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });
  dropzone.addEventListener('drop', e => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      try {
        const dt = new DataTransfer();
        dt.items.add(e.dataTransfer.files[0]);
        portfolio.files = dt.files;
      } catch {
        portfolio.files = e.dataTransfer.files;
      }
      const file = portfolio.files?.[0];
      fileLabel.textContent = file ? file.name : 'Choose a file or drop it here';
      validateField('portfolio');
    }
  });
}

function validateChoices(name, groupName, message) {
  const valid = document.querySelectorAll(`input[name="${name}"]:checked`).length > 0;
  document.querySelector(`[data-group="${groupName}"] .group-error`).textContent = valid ? '' : message;
  return valid;
}

function validateTerms() {
  const valid = document.querySelector('#terms').checked;
  document.querySelector('.terms-error').textContent = valid ? '' : 'Please accept the event terms and conditions.';
  return valid;
}

document.querySelectorAll('input[name="role"]').forEach(radio => {
  radio.addEventListener('change', () => validateChoices('role', 'role', 'Please select a preferred role.'));
});
document.querySelectorAll('input[name="topics"]').forEach(cb => {
  cb.addEventListener('change', () => validateChoices('topics', 'topics', 'Please choose at least one topic.'));
});
document.querySelector('#terms')?.addEventListener('change', validateTerms);
document.querySelector('.terms-link')?.addEventListener('click', e => {
  e.stopPropagation();
});

// Prevent accidental drops on the browser window from leaving the page
['dragover', 'drop'].forEach(eventName => {
  window.addEventListener(eventName, e => e.preventDefault(), false);
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const fieldsValid = Object.keys(requiredFields).map(validateField).every(Boolean);
  const roleValid = validateChoices('role', 'role', 'Please select a preferred role.');
  const topicValid = validateChoices('topics', 'topics', 'Please choose at least one topic.');
  const termsValid = validateTerms();
  if (!(fieldsValid && roleValid && topicValid && termsValid)) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.classList.remove('show');
    const firstInvalidTarget = document.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea, [data-group="role"] input, [data-group="topics"] input, #terms');
    if (firstInvalidTarget) {
      firstInvalidTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidTarget.focus();
    } else {
      document.querySelector('.invalid, .group-error:not(:empty), .terms-error:not(:empty)')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  if (toastTimer) clearTimeout(toastTimer);
  toast.classList.add('show');
  form.reset();
  document.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  budgetValue.textContent = '500 THB'; charCount.textContent = '0'; fileLabel.textContent = 'Choose a file or drop it here';
  charCount.parentElement?.classList.remove('limit');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
});

form.addEventListener('reset', () => {
  setTimeout(() => {
    document.querySelectorAll('.error').forEach(error => error.textContent = '');
    document.querySelectorAll('.invalid').forEach(field => field.classList.remove('invalid'));
    document.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    budgetValue.textContent = '500 THB'; charCount.textContent = '0'; fileLabel.textContent = 'Choose a file or drop it here';
    charCount.parentElement?.classList.remove('limit');
  }, 0);
});

window.addEventListener('pointermove', event => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
  cursorGlow.classList.add('visible');
}, { passive: true });

document.addEventListener('mouseleave', () => {
  cursorGlow.classList.remove('visible');
});
