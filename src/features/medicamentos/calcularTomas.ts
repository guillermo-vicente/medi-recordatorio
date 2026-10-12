// Funciones puras para calcular la proxima toma.
// Sin dependencias de storage ni de React Native, para que sean fáciles de testear.

import type { Medicamento } from './medicamentoService';

const HORA_MS = 60 * 60 * 1000;

export function calcularProximaToma(item: Medicamento, desde = Date.now()): number {
  if (item.tipoHorario === 'diario' && item.horariosDiarios?.length) {
    return calcularProximaTomaDiaria(item.horariosDiarios, desde);
  }

  const intervalMs = Math.max(1, item.frecuenciaHoras) * HORA_MS;
  const anchor = item.inicioHorario ?? item.proximaToma - intervalMs;
  const intervalsElapsed = Math.floor((desde - anchor) / intervalMs) + 1;
  return anchor + Math.max(1, intervalsElapsed) * intervalMs;
}

export function calcularProximaTomaDiaria(horarios: string[], desde = Date.now()): number {
  const validTimes = horarios
    .map((value) => value.split(':').map(Number))
    .filter(([hour, minute]) => Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
    .map(([hour, minute]) => ({ hour, minute, minuteOfDay: hour * 60 + minute }))
    .sort((a, b) => a.minuteOfDay - b.minuteOfDay);
  if (!validTimes.length) return desde;

  const now = new Date(desde);
  const minuteOfDayNow = now.getHours() * 60 + now.getMinutes();
  const upcoming = validTimes.find((time) => time.minuteOfDay > minuteOfDayNow);
  const chosen = upcoming ?? validTimes[0];
  const next = new Date(desde);
  if (!upcoming) next.setDate(next.getDate() + 1);
  next.setHours(chosen.hour, chosen.minute, 0, 0);
  return next.getTime();
}