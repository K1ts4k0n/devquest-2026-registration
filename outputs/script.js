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
      return /^[A-Za-zก-๙]{2,}(\s+[A-Za-zก-๙]{2,})+$/.test(trimmed);
    }
  },
  email: {
    message: 'Please enter a valid email address.',
    validate: value => /^[^\s@]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/.test(value.trim())
  },
  phone: {
    message: 'Please enter a valid 9–10 digit Thai phone number (e.g. 08X-XXX-XXXX or +66...).',
    validate: value => {
      const cleaned = value.trim().replace(/[\s\-().]/g, '').replace(/^\+66/, '0');
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
    validate: () => {
      const file = portfolio.files[0];
      if (!file) return false;
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const validExt = /\.(jpe?g|png|pdf)$/i.test(file.name);
      const typeMatches = validTypes.includes(file.type) || file.type === '';
      return typeMatches && validExt && file.size > 0 && file.size <= 5 * 1024 * 1024;
    }
  }
};

function setError(element, message = '') {
  const field = element.closest('.field');
  if (!field) return;
  field.classList.toggle('invalid', Boolean(message));
  field.querySelector('.error').textContent = message;
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
comments.addEventListener('input', () => { charCount.textContent = comments.value.length; });
portfolio.addEventListener('change', () => {
  const file = portfolio.files[0];
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
      portfolio.files = e.dataTransfer.files;
      const file = portfolio.files[0];
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
document.querySelectorAll('input[name="region"]').forEach(cb => {
  cb.addEventListener('change', () => validateChoices('region', 'region', 'Please choose at least one topic.'));
});
document.querySelector('#terms')?.addEventListener('change', validateTerms);

form.addEventListener('submit', event => {
  event.preventDefault();
  const fieldsValid = Object.keys(requiredFields).map(validateField).every(Boolean);
  const roleValid = validateChoices('role', 'role', 'Please select a preferred role.');
  const topicValid = validateChoices('region', 'region', 'Please choose at least one topic.');
  const termsValid = validateTerms();
  if (!(fieldsValid && roleValid && topicValid && termsValid)) {
    const firstInvalidTarget = document.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea, [data-group="role"] input, [data-group="region"] input, #terms');
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
  budgetValue.textContent = '500 THB'; charCount.textContent = '0'; fileLabel.textContent = 'Choose a file or drop it here';
  toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
});

form.addEventListener('reset', () => {
  setTimeout(() => {
    document.querySelectorAll('.error').forEach(error => error.textContent = '');
    document.querySelectorAll('.invalid').forEach(field => field.classList.remove('invalid'));
    budgetValue.textContent = '500 THB'; charCount.textContent = '0'; fileLabel.textContent = 'Choose a file or drop it here';
  }, 0);
});

window.addEventListener('pointermove', event => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
  cursorGlow.classList.add('visible');
}, { passive: true });
