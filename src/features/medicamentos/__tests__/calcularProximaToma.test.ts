import { calcularProximaToma, calcularProximaTomaDiaria } from '../calcularTomas';
import type { Medicamento } from '../medicamentoService';
// Crea fechas locales para los casos de prueba.
function fechaLocal(
  year: number,
  month: number, 
  day: number,
  hour = 0,
  minute = 0
): number {
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
}

describe('calcularProximaTomaDiaria', () => {
  // --- Casos básicos ---
  it('devuelve el próximo horario si todavía no pasó hoy', () => {
    const desde = fechaLocal(2026, 10, 12, 7, 30); // 07:30.
    const horarios = ['08:00', '14:00', '20:00'];
    const resultado = calcularProximaTomaDiaria(horarios, desde);
    expect(new Date(resultado).getHours()).toBe(8);
    expect(new Date(resultado).getMinutes()).toBe(0);
    expect(new Date(resultado).getDate()).toBe(12);
  });

  it('devuelve el primer horario del día siguiente si ya pasaron todos', () => {
    const desde = fechaLocal(2026, 10, 12, 22, 0); 
    const horarios = ['08:00', '14:00', '20:00'];
    const resultado = calcularProximaTomaDiaria(horarios, desde);
    expect(new Date(resultado).getHours()).toBe(8);
    expect(new Date(resultado).getMinutes()).toBe(0);
    expect(new Date(resultado).getDate()).toBe(13); 
  });

  // --- Un solo horario ---
  it('funciona con un solo horario', () => {
    const desde = fechaLocal(2026, 10, 12, 6, 0); 
    const resultado = calcularProximaTomaDiaria(['09:00'], desde);
    expect(new Date(resultado).getHours()).toBe(9);
    expect(new Date(resultado).getDate()).toBe(12);
  });

  // --- Orden y desorden ---
  it('ordena horarios desordenados antes de calcular', () => {
    const desde = fechaLocal(2026, 10, 12, 7, 0);
    const horarios = ['20:00', '08:00', '14:00']; 
    const resultado = calcularProximaTomaDiaria(horarios, desde);
    expect(new Date(resultado).getHours()).toBe(8); 
  });

  // --- Validación de formatos ---
  it('ignora horarios con formato inválido', () => {
    const desde = fechaLocal(2026, 10, 12, 7, 0);
    const horarios = ['08:00', '25:00', 'abc', '14:00'];
    const resultado = calcularProximaTomaDiaria(horarios, desde);
    expect(new Date(resultado).getHours()).toBe(8); 
  });

  it('ignora minutos fuera de rango', () => {
    const desde = fechaLocal(2026, 10, 12, 7, 0);
    const horarios = ['08:99', '09:00'];
    const resultado = calcularProximaTomaDiaria(horarios, desde);
    expect(new Date(resultado).getHours()).toBe(9);
  });

  it('devuelve "desde" si no hay horarios válidos', () => {
    const desde = fechaLocal(2026, 10, 12, 7, 0);
    const resultado = calcularProximaTomaDiaria(['abc', '25:00'], desde);
    expect(resultado).toBe(desde);
  });

  it('devuelve "desde" si el array está vacío', () => {
    const desde = fechaLocal(2026, 10, 12, 7, 0);
    const resultado = calcularProximaTomaDiaria([], desde);
    expect(resultado).toBe(desde);
  });

  // --- Minuto exacto ---
  it('si el horario es exactamente el minuto actual, pasa al siguiente', () => {
    const desde = fechaLocal(2026, 10, 12, 8, 0); 
    const horarios = ['08:00', '14:00'];
    const resultado = calcularProximaTomaDiaria(horarios, desde);
    expect(new Date(resultado).getHours()).toBe(14); 
  });

  // --- Cambio de día ---
  it('cruza medianoche correctamente', () => {
    const desde = fechaLocal(2026, 10, 12, 23, 50); 
    const resultado = calcularProximaTomaDiaria(['00:30'], desde);
    const fecha = new Date(resultado);
    expect(fecha.getDate()).toBe(13);
    expect(fecha.getHours()).toBe(0);
    expect(fecha.getMinutes()).toBe(30);
  });

  it('cruza fin de mes correctamente', () => {
    const desde = fechaLocal(2026, 10, 31, 23, 0); 
    const resultado = calcularProximaTomaDiaria(['06:00'], desde);
    const fecha = new Date(resultado);
    expect(fecha.getMonth()).toBe(10); 
    expect(fecha.getDate()).toBe(1);
  });
});

describe('calcularProximaToma (intervalo)', () => {
  // Crea un medicamento mínimo y permite sobrescribir sus datos.
  function medicamento(overrides: Partial<Medicamento> = {}): Medicamento {
    return {
      id: 'test-1',
      nombre: 'Test',
      dosis: '100mg',
      frecuenciaHoras: 8,
      proximaToma: 0,
      estado: 'pendiente',
      createdAt: 0,
      userEmail: 'test@test.com',
      personaId: 'propia:test@test.com',
      ...overrides,
    };
  }

  it('devuelve el siguiente múltiplo de la frecuencia desde inicioHorario', () => {
    const ahora = fechaLocal(2026, 10, 12, 10, 0);
    const inicio = fechaLocal(2026, 10, 12, 6, 0); 
    const item = medicamento({
      frecuenciaHoras: 4,
      inicioHorario: inicio,
      proximaToma: fechaLocal(2026, 10, 12, 10, 0),
    });

    const resultado = calcularProximaToma(item, ahora);
    expect(new Date(resultado).getHours()).toBe(14);
  });

  it('funciona con frecuencia de 24 horas', () => {
    const ahora = fechaLocal(2026, 10, 12, 10, 0);
    const inicio = fechaLocal(2026, 10, 12, 8, 0);
    const item = medicamento({
      frecuenciaHoras: 24,
      inicioHorario: inicio,
      proximaToma: inicio,
    });
    const resultado = calcularProximaToma(item, ahora);
    // La próxima toma corresponde a las 08:00 del día siguiente.
    expect(new Date(resultado).getDate()).toBe(13);
    expect(new Date(resultado).getHours()).toBe(8);
  });

  it('deriva a calcularProximaTomaDiaria si tipoHorario es diario', () => {
    const ahora = fechaLocal(2026, 10, 12, 7, 0);
    const item = medicamento({
      tipoHorario: 'diario',
      horariosDiarios: ['08:00', '20:00'],
    });
    const resultado = calcularProximaToma(item, ahora);
    expect(new Date(resultado).getHours()).toBe(8);
  });

  it('respeta el inicioHorario como ancla', () => {
    const ahora = fechaLocal(2026, 10, 12, 9, 30);
    const inicio = fechaLocal(2026, 10, 12, 6, 0);
    const item = medicamento({
      frecuenciaHoras: 6,
      inicioHorario: inicio,
    });
    // Los múltiplos siguientes son 06:00, 12:00 y 18:00.
    const resultado = calcularProximaToma(item, ahora);
    expect(new Date(resultado).getHours()).toBe(12);
  });
});
