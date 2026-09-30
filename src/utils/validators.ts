export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validateLoginInput(
  email: string,
  password: string
): string[] {
  const errors: string[] = [];

  if (!email.trim()) {
    errors.push('El email es requerido');
  } else if (!validateEmail(email)) {
    errors.push('El email no tiene un formato valido');
  }

  if (!password) {
    errors.push('La contrasena es requerida');
  } else if (!validatePassword(password)) {
    errors.push('La contrasena debe tener al menos 6 caracteres');
  }

  return errors;
}

export function validateRegisterInput(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): string[] {
  const errors: string[] = [];

  if (!name.trim()) {
    errors.push('El nombre es requerido');
  }

  if (!email.trim()) {
    errors.push('El email es requerido');
  } else if (!validateEmail(email)) {
    errors.push('El email no tiene un formato valido');
  }

  if (!password) {
    errors.push('La contrasena es requerida');
  } else if (!validatePassword(password)) {
    errors.push('La contrasena debe tener al menos 6 caracteres');
  }

  if (password !== confirmPassword) {
    errors.push('Las contrasenas no coinciden');
  }

  return errors;
}