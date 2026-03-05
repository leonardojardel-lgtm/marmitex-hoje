import { format, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function useHorario() {
  const TIMEZONE = 'America/Sao_Paulo';

  function getAgoraSP(): Date {
    return toZonedTime(new Date(), TIMEZONE);
  }

  function isAposCorte(horarioCorte: string = '14:15'): boolean {
    const agora = getAgoraSP();
    const [h, m] = horarioCorte.split(':').map(Number);
    const corte = new Date(agora);
    corte.setHours(h, m, 0, 0);
    return isAfter(agora, corte);
  }

  function podeAlunoAgir(horarioCorte: string): boolean {
    return !isAposCorte(horarioCorte);
  }

  return { getAgoraSP, isAposCorte, podeAlunoAgir };
}
