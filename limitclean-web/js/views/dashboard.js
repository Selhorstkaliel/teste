import '../../vendor/chart.umd.js';
import { listEntries, getRecentEntries } from '../services/entries.js';
import { formatDate, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfFortnight, endOfFortnight } from '../utils/dates.js';
import { toBRL } from '../utils/money.js';

const computeStatsFromEntries = (entries) => {
  let bruto = 0;
  let liquido = 0;
  let limpezasCount = 0;
  let ratingCount = 0;
  const statusCount = { Restrição: 0, Finalizado: 0, Reprotocolo: 0 };
  let ratingFeito = 0;
  entries.forEach((entry) => {
    bruto += Number(entry.valor) || 0;
    liquido += Number(entry.liquido) || 0;
    if (entry.tipo === 'limpeza') limpezasCount += 1;
    if (entry.tipo === 'rating') ratingCount += 1;
    if (statusCount[entry.status] !== undefined) {
      statusCount[entry.status] += 1;
    }
    if (entry.tipo === 'rating' && entry.feito) ratingFeito += 1;
  });
  return {
    bruto,
    liquido,
    limpezasCount,
    ratingCount,
    statusCount,
    ratingFeito,
    ratingNaoFeito: ratingCount - ratingFeito,
  };
};

const filterEntries = (entries, filter) => {
  if (filter === 'all') return entries;
  const now = new Date();
  let start;
  let end;
  if (filter === 'month') {
    start = startOfMonth(now);
    end = endOfMonth(now);
  } else if (filter === 'year') {
    start = startOfYear(now);
    end = endOfYear(now);
  } else {
    start = startOfFortnight(now);
    end = endOfFortnight(now);
  }
  return entries.filter((entry) => {
    const created = new Date(entry.createdAt);
    return created >= start && created <= end;
  });
};

export const renderDashboard = async ({ container, scheduler }) => {
  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <header class="util-flex-between">
      <h1>Dashboard Operacional</h1>
      <div class="util-align-center">
        <select class="select" id="filter-select" aria-label="Filtro de período">
          <option value="month">Mês atual</option>
          <option value="fortnight">Quinzena</option>
          <option value="year">Ano</option>
          <option value="all">Tudo</option>
        </select>
        <button class="button button--ghost" type="button" id="sync-button">Sincronizar status agora</button>
      </div>
    </header>
    <section class="util-grid-auto" id="kpi-grid"></section>
    <section class="util-grid-auto">
      <canvas id="status-chart" width="480" height="240" aria-label="Gráfico de status"></canvas>
      <canvas id="rating-chart" width="480" height="240" aria-label="Gráfico de rating"></canvas>
    </section>
    <section class="card card--compact">
      <h2>Últimas entradas</h2>
      <table class="table" aria-label="Tabela de entradas recentes">
        <thead>
          <tr>
            <th>Data</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Valor</th>
            <th>Líquido</th>
          </tr>
        </thead>
        <tbody id="entries-body"></tbody>
      </table>
    </section>
  `;
  container.append(section);

  const filterSelect = section.querySelector('#filter-select');
  const syncButton = section.querySelector('#sync-button');
  const kpiGrid = section.querySelector('#kpi-grid');
  const entriesBody = section.querySelector('#entries-body');
  const statusCanvas = section.querySelector('#status-chart');
  const ratingCanvas = section.querySelector('#rating-chart');
  let statusChart;
  let ratingChart;

  const renderKPIs = (stats) => {
    kpiGrid.innerHTML = '';
    const items = [
      { label: 'Valor Bruto', value: toBRL(stats.bruto) },
      { label: 'Valor Líquido', value: toBRL(stats.liquido) },
      { label: 'Total Limpezas', value: stats.limpezasCount },
      { label: 'Total Rating', value: stats.ratingCount },
    ];
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'card card--compact';
      card.innerHTML = `<span class="text-muted">${item.label}</span><strong>${item.value}</strong>`;
      kpiGrid.append(card);
    });
  };

  const renderEntries = async () => {
    const latest = await getRecentEntries(50);
    entriesBody.innerHTML = '';
    latest.forEach((entry) => {
      const row = document.createElement('tr');
      const statusClass =
        entry.status === 'Finalizado'
          ? 'badge badge--success'
          : entry.status === 'Reprotocolo'
          ? 'badge badge--warning'
          : 'badge badge--danger';
      row.innerHTML = `
        <td>${formatDate(entry.createdAt)}</td>
        <td>${entry.nome}</td>
        <td>${entry.tipo}</td>
        <td><span class="${statusClass}">${entry.status}</span></td>
        <td>${toBRL(entry.valor)}</td>
        <td>${toBRL(entry.liquido)}</td>
      `;
      entriesBody.append(row);
    });
  };

  const renderCharts = (stats) => {
    const statusData = {
      labels: Object.keys(stats.statusCount),
      datasets: [
        {
          data: Object.values(stats.statusCount),
          backgroundColor: ['#ff5678', '#52ffb8', '#f9d648'],
        },
      ],
    };
    const ratingData = {
      labels: ['Feito', 'Não Feito'],
      datasets: [
        {
          data: [stats.ratingFeito, stats.ratingNaoFeito],
          backgroundColor: ['#52ffb8', '#ff5678'],
        },
      ],
    };
    if (!statusChart) {
      statusChart = new Chart(statusCanvas, { type: 'bar', data: statusData });
    } else {
      statusChart.update({ data: statusData });
    }
    if (!ratingChart) {
      ratingChart = new Chart(ratingCanvas, { type: 'bar', data: ratingData });
    } else {
      ratingChart.update({ data: ratingData });
    }
  };

  const refresh = async () => {
    const entries = await listEntries();
    const filtered = filterEntries(entries, filterSelect.value);
    const stats = computeStatsFromEntries(filtered);
    renderKPIs(stats);
    renderCharts(stats);
    renderEntries();
  };

  filterSelect.addEventListener('change', refresh);
  syncButton.addEventListener('click', () => {
    scheduler?.runNow();
  });

  scheduler?.subscribe(() => refresh());

  refresh();
};
