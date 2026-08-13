export function formatCpf(cpf: string): string {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function formatPhone(phone: string): string {
  return phone.length === 11
    ? phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
    : phone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
}
