const CPF_LENGTH = 11;

export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

function calculateDigit(base: string, initialWeight: number): number {
  const sum = [...base].reduce(
    (total, digit, index) => total + Number(digit) * (initialWeight - index),
    0,
  );
  const remainder = sum % 11;

  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);

  if (cpf.length !== CPF_LENGTH || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const firstDigit = calculateDigit(cpf.slice(0, 9), 10);
  const secondDigit = calculateDigit(`${cpf.slice(0, 9)}${firstDigit}`, 11);

  return cpf.endsWith(`${firstDigit}${secondDigit}`);
}
