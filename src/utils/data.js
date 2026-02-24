const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export { MONTHS, MONTHS_FULL };

export function getQuarterMonths(quarter) {
    const start = (quarter - 1) * 3;
    return MONTHS.slice(start, start + 3);
}

export function getMonthIndex(dateStr) {
    const d = new Date(dateStr);
    return d.getMonth();
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
}

export function toInputDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function fromInputDate(inputVal) {
    return inputVal; // already yyyy-mm-dd
}

/**
 * Calculate left% and width% for a feature bar.
 * If visibleMonths is provided (e.g. [0,1,2] for Q1), calculations are relative
 * to only those months instead of the full year.
 */
export function calculateBarPosition(startDate, endDate, year, visibleMonths) {
    let rangeStart, rangeEnd;

    if (visibleMonths && visibleMonths.length > 0 && visibleMonths.length < 12) {
        const firstMonth = Math.min(...visibleMonths);
        const lastMonth = Math.max(...visibleMonths);
        rangeStart = new Date(year, firstMonth, 1);
        // last day of last visible month
        rangeEnd = new Date(year, lastMonth + 1, 0);
    } else {
        rangeStart = new Date(year, 0, 1);
        rangeEnd = new Date(year, 11, 31);
    }

    let start = new Date(startDate + 'T00:00:00');
    let end = new Date(endDate + 'T00:00:00');

    // Clamp to visible range
    if (start < rangeStart) start = rangeStart;
    if (end > rangeEnd) end = rangeEnd;
    if (start > rangeEnd || end < rangeStart) return null; // out of range

    const totalDays = (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24) + 1;
    const startDay = (start - rangeStart) / (1000 * 60 * 60 * 24);
    const duration = (end - start) / (1000 * 60 * 60 * 24) + 1;

    const left = (startDay / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatCreatedDate(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}
