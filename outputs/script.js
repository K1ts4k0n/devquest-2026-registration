const form = document.querySelector('#registrationForm');
const toast = document.querySelector('#toast');
const budget = document.querySelector('#budget');
const budgetValue = document.querySelector('#budgetValue');
const portfolio = document.querySelector('#portfolio');
const fileLabel = document.querySelector('#fileLabel');
const comments = document.querySelector('#comments');
const charCount = document.querySelector('#charCount');
const cursorGlow = document.querySelector('.cursor-glow');

const requiredFields = {
  fullName: { message: 'Please enter your full name.', validate: value => value.trim().length >= 4 },
  email: { message: 'Please enter a valid email address.', validate: value => /^[^\s@]+@[^\s@]+$/.test(value) },
  phone: { message: 'Please enter a 9–10 digit phone number.', validate: value => /^0\d{8,9}$/.test(value.replace(/[\s-]/g, '')) },
  birthDate: { message: 'Applicants must be at least 15 years old.', validate: value => value && new Date().getFullYear() - new Date(value).getFullYear() >= 15 },
  experience: { message: 'Please select your experience level.', validate: value => value !== '' },
  contactMethod: { message: 'Please select a contact method.', validate: value => value !== '' },
  portfolio: { message: 'Please upload your portfolio or student ID.', validate: () => portfolio.files.length > 0 }
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
  const valid = rule.validate(element.value);
  setError(element, valid ? '' : rule.message);
  return valid;
}

Object.keys(requiredFields).forEach(id => {
  const element = document.querySelector(`#${id}`);
  element.addEventListener('blur', () => validateField(id));
  element.addEventListener('change', () => validateField(id));
});

budget.addEventListener('input', () => { budgetValue.textContent = `${Number(budget.value).toLocaleString('en-US')} THB`; });
comments.addEventListener('input', () => { charCount.textContent = comments.value.length; });
portfolio.addEventListener('change', () => {
  const file = portfolio.files[0];
  if (file) fileLabel.textContent = file.name;
});

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

form.addEventListener('submit', event => {
  event.preventDefault();
  const fieldsValid = Object.keys(requiredFields).map(validateField).every(Boolean);
  const roleValid = validateChoices('role', 'role', 'Please select a preferred role.');
  const topicValid = validateChoices('region', 'region', 'Please choose at least one topic.');
  const termsValid = validateTerms();
  if (!(fieldsValid && roleValid && topicValid && termsValid)) {
    document.querySelector('.invalid, .group-error:not(:empty), .terms-error:not(:empty)')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  toast.classList.add('show');
  form.reset();
  budgetValue.textContent = '500 THB'; charCount.textContent = '0'; fileLabel.textContent = 'Choose a file or drop it here';
  setTimeout(() => toast.classList.remove('show'), 5000);
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
