import {
  validateEmail,
  validatePassword,
  validateLoginInput,
  validateRegisterInput,
} from '../validators';

describe('validateEmail', () => {
  it('acepta un email valido', () => {
    expect(validateEmail('test@mail.com')).toBe(true);
  });

  it('rechaza un email sin arroba', () => {
    expect(validateEmail('testmail.com')).toBe(false);
  });

  it('rechaza un email sin dominio', () => {
    expect(validateEmail('test@')).toBe(false);
  });

  it('rechaza un string vacio', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('acepta una contrasena de 6 o mas caracteres', () => {
    expect(validatePassword('123456')).toBe(true);
  });

  it('rechaza una contrasena de menos de 6 caracteres', () => {
    expect(validatePassword('123')).toBe(false);
  });
});

describe('validateLoginInput', () => {
  it('devuelve array vacio cuando los datos son validos', () => {
    const errors = validateLoginInput('test@mail.com', '123456');
    expect(errors).toEqual([]);
  });

  it('devuelve error cuando el email esta vacio', () => {
    const errors = validateLoginInput('', '123456');
    expect(errors).toContain('El email es requerido');
  });

  it('devuelve error cuando el email tiene formato invalido', () => {
    const errors = validateLoginInput('sinArroba', '123456');
    expect(errors).toContain('El email no tiene un formato valido');
  });

  it('devuelve error cuando la contrasena es corta', () => {
    const errors = validateLoginInput('test@mail.com', '123');
    expect(errors).toContain(
      'La contrasena debe tener al menos 6 caracteres'
    );
  });

  it('devuelve dos errores cuando ambos campos estan vacios', () => {
    const errors = validateLoginInput('', '');
    expect(errors).toHaveLength(2);
  });
});

describe('validateRegisterInput', () => {
  it('devuelve array vacio cuando los datos son validos', () => {
    const errors = validateRegisterInput(
      'Guille',
      'test@mail.com',
      '123456',
      '123456'
    );
    expect(errors).toEqual([]);
  });

  it('devuelve error cuando el nombre esta vacio', () => {
    const errors = validateRegisterInput(
      '',
      'test@mail.com',
      '123456',
      '123456'
    );
    expect(errors).toContain('El nombre es requerido');
  });

  it('devuelve error cuando las contrasenas no coinciden', () => {
    const errors = validateRegisterInput(
      'Guille',
      'test@mail.com',
      '123456',
      '654321'
    );
    expect(errors).toContain('Las contrasenas no coinciden');
  });
});