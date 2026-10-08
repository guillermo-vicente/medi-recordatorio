import type { AuthUser } from '../auth/AuthContext';
import { medicamentoService } from '../medicamentos/medicamentoService';
import { personaService } from '../personas/personaService';
import { notificationService } from './notificationService';

export async function ensureMedicationSchedules(user: AuthUser): Promise<void> {
  if (!notificationService.isAvailable() || !(await notificationService.hasPermission())) return;
  const [medicamentos, personas] = await Promise.all([
    medicamentoService.list(user.email),
    personaService.list(user.email, user.name),
  ]);

  for (const medicamento of medicamentos) {
    if (medicamento.notificationIds?.length) continue;
    const persona = personas.find((item) => item.id === medicamento.personaId);
    const ids = await notificationService.schedulePlan(medicamento, persona?.nombre);
    if (!ids.length) continue;
    await notificationService.cancelMany([medicamento.notificationId]);
    await medicamentoService.update(user.email, medicamento.id, {
      tipoHorario: medicamento.tipoHorario ?? 'intervalo',
      inicioHorario: medicamento.inicioHorario ?? medicamento.proximaToma - medicamento.frecuenciaHoras * 60 * 60 * 1000,
      notificationIds: ids,
      notificationId: undefined,
    });
  }
}

export async function cancelMedicationSchedules(userEmail: string): Promise<void> {
  const medicamentos = await medicamentoService.list(userEmail);
  for (const medicamento of medicamentos) {
    await notificationService.cancelMany([...(medicamento.notificationIds ?? []), medicamento.notificationId]);
    if (medicamento.notificationIds?.length || medicamento.notificationId) {
      await medicamentoService.update(userEmail, medicamento.id, {
        notificationIds: [],
        notificationId: undefined,
      });
    }
  }
}
