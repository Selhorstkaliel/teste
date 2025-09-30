const stripDigits = (value = '') => value.replace(/\D+/g, '');

export const maskCPF = (value) => {
  const digits = stripDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const maskCNPJ = (value) => {
  const digits = stripDigits(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const maskCPFOrCNPJ = (value) => {
  const digits = stripDigits(value);
  return digits.length > 11 ? maskCNPJ(digits) : maskCPF(digits);
};

export const maskPhone = (value) => {
  const digits = stripDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

export const maskCEP = (value) => stripDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

const calculateVerifierDigit = (digits, multipliers) => {
  const sum = digits.reduce((acc, digit, idx) => acc + digit * multipliers[idx], 0);
  const result = sum % 11;
  return result < 2 ? 0 : 11 - result;
};

export const validateCPF = (value) => {
  const digits = stripDigits(value);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  const numbers = digits.split('').map(Number);
  const v1 = calculateVerifierDigit(numbers.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const v2 = calculateVerifierDigit(numbers.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return v1 === numbers[9] && v2 === numbers[10];
};

export const validateCNPJ = (value) => {
  const digits = stripDigits(value);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const numbers = digits.split('').map(Number);
  const baseMultipliers1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const baseMultipliers2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const v1 = calculateVerifierDigit(numbers.slice(0, 12), baseMultipliers1);
  const v2 = calculateVerifierDigit(numbers.slice(0, 13), baseMultipliers2);
  return v1 === numbers[12] && v2 === numbers[13];
};

export const validateCPFOrCNPJ = (value) => {
  const digits = stripDigits(value);
  return digits.length > 11 ? validateCNPJ(digits) : validateCPF(digits);
};

export const normalizeDoc = (value) => stripDigits(value);
