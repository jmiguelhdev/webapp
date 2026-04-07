import { el } from '../../utils/dom.js';

/** Utility to render common Time Filter UI */
export function renderTimeFilterUI(options) {
  const timeRow = el('div', { classes: ['selector-row'], style: 'margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; justify-content: flex-start;' });
  const timeLabel = el('span', { text: 'Período:', classes: ['selector-label'] });
  
  const timeSelect = el('select', { 
    classes: ['form-input'],
    style: 'border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 8px; background: var(--bg-main); color: var(--text-main); font-size: 0.9rem; cursor: pointer;',
    html: `
      <option value="all" ${options.timeFilterType === 'all' ? 'selected' : ''}>Todos los Viajes</option>
      <option value="count" ${options.timeFilterType === 'count' ? 'selected' : ''}>Últimos N Viajes</option>
      <option value="range" ${options.timeFilterType === 'range' ? 'selected' : ''}>Rango de Fechas</option>
    `
  });
  
  const timeControlsArea = el('div', { style: 'display: flex; gap: 0.5rem; align-items: center;' });
  
  const updateTimeUI = () => {
    timeControlsArea.innerHTML = '';
    const t = timeSelect.value;
    if (t === 'count') {
      const input = el('input', { attrs: { type: 'number', min: '1', value: options.timeFilterType === 'count' ? options.timeFilterValue : 10 }, style: 'width: 80px; padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);' });
      const applyBtn = el('button', { classes: ['btn-primary'], text: 'Aplicar', style: 'padding: 0.4rem 0.8rem; margin: 0; font-size: 0.85rem;' });
      applyBtn.onclick = () => options.onTimeFilter('count', input.value);
      timeControlsArea.appendChild(input);
      timeControlsArea.appendChild(applyBtn);
    } else if (t === 'range') {
      const val = options.timeFilterType === 'range' && options.timeFilterValue ? options.timeFilterValue : {};
      const today = new Date().toISOString().split('T')[0];
      const startInput = el('input', { attrs: { type: 'date', value: val.start || today }, style: 'padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);' });
      const endInput = el('input', { attrs: { type: 'date', value: val.end || today }, style: 'padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);' });
      const applyBtn = el('button', { classes: ['btn-primary'], text: 'Aplicar', style: 'padding: 0.4rem 0.8rem; margin: 0; font-size: 0.85rem;' });
      applyBtn.onclick = () => options.onTimeFilter('range', { start: startInput.value, end: endInput.value });
      timeControlsArea.appendChild(startInput);
      timeControlsArea.appendChild(endInput);
      timeControlsArea.appendChild(applyBtn);
    }
  };
  
  timeSelect.onchange = (e) => {
    if (e.target.value === 'all') {
      options.onTimeFilter('all', null);
    } else {
      updateTimeUI();
    }
  };
  updateTimeUI();
  
  timeRow.appendChild(timeLabel);
  timeRow.appendChild(timeSelect);
  timeRow.appendChild(timeControlsArea);
  
  return timeRow;
}
