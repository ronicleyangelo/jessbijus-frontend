import { Pipe, PipeTransform } from '@angular/core';

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function parseBrlCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  const clean = value.replace(/R\$\s?/i, '').trim();
  if (!clean || !/^[\d.,]+$/.test(clean)) return Number.NaN;
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(?:\.\d{3})+$/.test(clean) ? clean.replace(/\./g, '') : clean;
  return Number(normalized);
}

@Pipe({ name: 'brlCurrency', standalone: true })
export class BrlCurrencyPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value == null || value === '') return '';
    const amount = parseBrlCurrency(value);
    return Number.isFinite(amount) ? formatter.format(amount) : String(value);
  }
}
