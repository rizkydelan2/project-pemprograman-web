// ========== STATE MANAGEMENT ==========
const STORAGE_KEY = 'finance_tracker_data';
let transactions = [];
let currentType = 'income';
let editingId = null;
let categoryChart = null;
let trendChart = null;

// ========== LOAD DATA ==========
function loadData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    transactions = JSON.parse(data);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setTodayDate();
  initTypeToggle();
  initEditTypeToggle();
  
  // Initialize charts FIRST before rendering data
  initCharts();
  
  // Then render all data
  renderAll();
  
  // Add demo data if empty (OPTIONAL - comment out jika tidak perlu)
  addDemoDataIfEmpty();
});

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
}

// ========== TYPE TOGGLE ==========
function initTypeToggle() {
  const typeBtns = document.querySelectorAll('#transactionForm .type-btn');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => {
        b.classList.remove('active-income', 'active-expense');
      });
      currentType = btn.dataset.type;
      btn.classList.add(currentType === 'income' ? 'active-income' : 'active-expense');
    });
  });
}

function initEditTypeToggle() {
  const editTypeBtns = document.querySelectorAll('#editForm .type-btn');
  editTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      editTypeBtns.forEach(b => {
        b.classList.remove('active-income', 'active-expense');
      });
      const type = btn.dataset.type;
      btn.classList.add(type === 'income' ? 'active-income' : 'active-expense');
    });
  });
}

// ========== FORM SUBMIT ==========
document.getElementById('transactionForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const transaction = {
    id: Date.now(),
    type: currentType,
    amount: parseInt(document.getElementById('amount').value),
    category: document.getElementById('category').value,
    description: document.getElementById('description').value,
    date: document.getElementById('date').value
  };

  transactions.push(transaction);
  saveData();
  renderAll();

  // Reset form
  e.target.reset();
  setTodayDate();

  alert('✅ Transaksi berhasil ditambahkan!');
});

// ========== EDIT MODAL ==========
document.getElementById('closeModal').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);

function openEditModal(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;

  editingId = id;
  document.getElementById('editId').value = id;
  document.getElementById('editAmount').value = transaction.amount;
  document.getElementById('editCategory').value = transaction.category;
  document.getElementById('editDescription').value = transaction.description;
  document.getElementById('editDate').value = transaction.date;

  const editTypeBtns = document.querySelectorAll('#editForm .type-btn');
  editTypeBtns.forEach(btn => {
    btn.classList.remove('active-income', 'active-expense');
    if (btn.dataset.type === transaction.type) {
      btn.classList.add(transaction.type === 'income' ? 'active-income' : 'active-expense');
    }
  });

  document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
  editingId = null;
}

document.getElementById('editForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const id = parseInt(document.getElementById('editId').value);
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;

  const activeTypeBtn = document.querySelector('#editForm .type-btn.active-income, #editForm .type-btn.active-expense');
  const type = activeTypeBtn ? activeTypeBtn.dataset.type : 'income';

  transaction.type = type;
  transaction.amount = parseInt(document.getElementById('editAmount').value);
  transaction.category = document.getElementById('editCategory').value;
  transaction.description = document.getElementById('editDescription').value;
  transaction.date = document.getElementById('editDate').value;

  saveData();
  renderAll();
  closeEditModal();

  alert('✅ Transaksi berhasil diupdate!');
});

// ========== DELETE ==========
function deleteTransaction(id) {
  if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
}

// ========== RENDER ALL ==========
function renderAll() {
  renderSummary();
  renderTransactions();
  updateCharts();
}

// ========== SUMMARY CARDS ==========
function renderSummary() {
  const filtered = getFilteredTransactions();

  const income = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = filtered
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  document.getElementById('totalIncome').textContent = formatCurrency(income);
  document.getElementById('totalExpense').textContent = formatCurrency(expense);
  document.getElementById('balance').textContent = formatCurrency(balance);
}

// ========== TRANSACTIONS TABLE ==========
function renderTransactions() {
  const tbody = document.getElementById('transactionsBody');
  const emptyState = document.getElementById('emptyState');
  const filtered = getFilteredTransactions();

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  filtered.forEach(transaction => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(transaction.date)}</td>
      <td>${transaction.description}</td>
      <td><span class="category-badge">${transaction.category}</span></td>
      <td>${transaction.type === 'income' ? '📈 Pemasukan' : '📉 Pengeluaran'}</td>
      <td class="${transaction.type === 'income' ? 'amount-income' : 'amount-expense'}">
        ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
      </td>
      <td>
        <div class="action-btns">
          <button class="icon-btn" onclick="openEditModal(${transaction.id})">✏️</button>
          <button class="icon-btn delete" onclick="deleteTransaction(${transaction.id})">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ========== FILTERS ==========
document.getElementById('filterMonth').addEventListener('change', renderAll);
document.getElementById('filterCategory').addEventListener('change', renderAll);

function getFilteredTransactions() {
  let filtered = [...transactions];

  const monthFilter = document.getElementById('filterMonth').value;
  if (monthFilter) {
    filtered = filtered.filter(t => {
      const month = t.date.split('-')[1];
      return month === monthFilter;
    });
  }

  const categoryFilter = document.getElementById('filterCategory').value;
  if (categoryFilter) {
    filtered = filtered.filter(t => t.category === categoryFilter);
  }

  return filtered;
}

// ========== CHARTS ==========
function initCharts() {
  // Category Chart (Doughnut)
  const ctxCategory = document.getElementById('categoryChart');
  if (!ctxCategory) return;

  categoryChart = new Chart(ctxCategory, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#10b981',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#14b8a6'
        ],
        borderWidth: 2,
        borderColor: '#1a1f3a'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            padding: 15,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = formatCurrency(context.parsed);
              return label + ': ' + value;
            }
          }
        }
      }
    }
  });

  // Trend Chart (Line)
  const ctxTrend = document.getElementById('trendChart');
  if (!ctxTrend) return;

  trendChart = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Pemasukan',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2
        },
        {
          label: 'Pengeluaran',
          data: [],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            padding: 15,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = formatCurrency(context.parsed.y);
              return label + ': ' + value;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { 
            color: '#94a3b8',
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        },
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

function updateCharts() {
  updateCategoryChart();
  updateTrendChart();
}

function updateCategoryChart() {
  if (!categoryChart) return;

  const expenses = transactions.filter(t => t.type === 'expense');
  const categoryTotals = {};

  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  categoryChart.data.labels = labels;
  categoryChart.data.datasets[0].data = data;
  categoryChart.update();
}

function updateTrendChart() {
  if (!trendChart) return;

  // Get last 6 months
  const months = [];
  const incomeData = [];
  const expenseData = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toISOString().slice(0, 7); // YYYY-MM

    months.push(date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }));

    const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    incomeData.push(income);
    expenseData.push(expense);
  }

  trendChart.data.labels = months;
  trendChart.data.datasets[0].data = incomeData;
  trendChart.data.datasets[1].data = expenseData;
  trendChart.update();
}

// ========== EXPORT CSV ==========
document.getElementById('exportCSV').addEventListener('click', () => {
  if (transactions.length === 0) {
    alert('Tidak ada data untuk diekspor!');
    return;
  }

  let csv = 'Tanggal,Tipe,Kategori,Deskripsi,Jumlah\n';

  transactions.forEach(t => {
    csv += `${t.date},${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'},${t.category},"${t.description}",${t.amount}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance-tracker-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  alert('✅ Data berhasil diekspor ke CSV!');
});

// ========== CLEAR DATA ==========
document.getElementById('clearData').addEventListener('click', () => {
  if (!confirm('⚠️ Yakin ingin menghapus SEMUA data? Tindakan ini tidak bisa dibatalkan!')) return;

  transactions = [];
  saveData();
  renderAll();

  alert('✅ Semua data telah dihapus!');
});

// ========== UTILITIES ==========
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}



