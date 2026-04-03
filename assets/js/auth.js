// ==================== AUTH ====================
function renderRoleOptions() {
const select = document.getElementById('roleSelect');
if (!select || typeof staffConfig === 'undefined') return;

select.innerHTML = '<option value="">-- Выберите пользователя --</option>';

const managerGroup = document.createElement('optgroup');
managerGroup.label = 'Менеджеры по сетям';
staffConfig.managers.forEach(manager => {
const option = document.createElement('option');
option.value = manager.id;
option.textContent = `${manager.name} (${manager.networks.length} сетей)`;
managerGroup.appendChild(option);
});
select.appendChild(managerGroup);

const techGroup = document.createElement('optgroup');
techGroup.label = 'Технический отдел';
staffConfig.tech.forEach(user => {
const option = document.createElement('option');
option.value = user.id;
option.textContent = `${user.name} (Технический специалист)`;
techGroup.appendChild(option);
});
select.appendChild(techGroup);
}

async function login() {
const value = document.getElementById('roleSelect').value;
if (!value) { showToast('error', 'Пожалуйста, выберите пользователя'); return; }
await initializeStorage();
currentUser = value;
currentRole = value.startsWith('manager') ? 'manager' : 'tech';
document.getElementById('loginScreen').style.display = 'none';
document.getElementById('appContainer').classList.remove('hidden');
setupUI();
try {
checkAlerts();
} catch (error) {
console.error('Alerts init failed', error);
}
}

function logout() { location.reload(); }

function setupUI() {
document.getElementById('userRole').textContent = currentRole === 'manager' ? 'Менеджер' : 'Технический специалист';
document.getElementById('userName').textContent = (typeof userNames !== 'undefined' && userNames[currentUser]) ? userNames[currentUser] : currentUser;

try {
setupNavigation();
} catch (error) {
renderFallbackNavigation();
console.error('Navigation init failed', error);
}

const defaultSection = currentRole === 'manager' ? 'createPromoSection' : 'techTasksSection';
showSection(defaultSection);

try {
if (currentRole === 'manager') {
if (typeof setupManagerView === 'function') setupManagerView();
document.getElementById('editPricesBtn').style.display = 'none';
document.getElementById('versionHistoryBtn').style.display = 'none';
} else {
if (typeof setupTechView === 'function') setupTechView();
document.getElementById('editPricesBtn').style.display = 'inline-flex';
document.getElementById('versionHistoryBtn').style.display = 'inline-flex';
if (typeof loadTechTasks === 'function') loadTechTasks();
}
} catch (error) {
console.error('Role setup failed', error);
}
}

function renderFallbackNavigation() {
const navTabs = document.getElementById('navTabs');
if (currentRole === 'manager') {
navTabs.innerHTML = `
<button class="nav-tab active" onclick="showSection('createPromoSection'); updateNavTabs(this)">Создать промо</button>
<button class="nav-tab" onclick="showSection('myPromosSection'); updateNavTabs(this)">Мои промо</button>
<button class="nav-tab" onclick="showSection('activePromosSection'); updateNavTabs(this)">Активные промо</button>
<button class="nav-tab" onclick="showSection('archiveSection'); updateNavTabs(this)">Архив</button>
<button class="nav-tab" onclick="showSection('basePricesSection'); updateNavTabs(this)">Базовые цены</button>
`;
return;
}

navTabs.innerHTML = `
<button class="nav-tab active" onclick="showSection('techTasksSection'); updateNavTabs(this)">Заявки</button>
<button class="nav-tab" onclick="showSection('promoPricesSection'); updateNavTabs(this)">Акционные цены</button>
<button class="nav-tab" onclick="showSection('techHistorySection'); updateNavTabs(this)">История</button>
<button class="nav-tab" onclick="showSection('basePricesSection'); updateNavTabs(this)">Базовые цены</button>
`;
}

function setupNavigation() {
const navTabs = document.getElementById('navTabs');
if (currentRole === 'manager') {
navTabs.innerHTML = `
<button class="nav-tab active" onclick="showSection('createPromoSection'); updateNavTabs(this)">Создать промо</button>
<button class="nav-tab" onclick="showSection('myPromosSection'); updateNavTabs(this); loadMyPromos()">Мои промо</button>
<button class="nav-tab" onclick="showSection('activePromosSection'); updateNavTabs(this); loadActivePromos()">Активные промо</button>
<button class="nav-tab" onclick="showSection('archiveSection'); updateNavTabs(this); loadArchive()">Архив</button>
<button class="nav-tab" onclick="showSection('basePricesSection'); updateNavTabs(this); loadBasePrices()">Базовые цены</button>
`;
} else {
navTabs.innerHTML = `
<button class="nav-tab active" onclick="showSection('techTasksSection'); updateNavTabs(this); loadTechTasks()">Заявки <span class="badge" id="pendingBadge">0</span></button>
<button class="nav-tab" onclick="showSection('promoPricesSection'); updateNavTabs(this); loadPromoPrices()">Акционные цены</button>
<button class="nav-tab" onclick="showSection('techHistorySection'); updateNavTabs(this); loadTechHistory()">История</button>
<button class="nav-tab" onclick="showSection('basePricesSection'); updateNavTabs(this); loadBasePrices()">Базовые цены</button>
`;
}
}

function updateNavTabs(activeTab) {
document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
activeTab.classList.add('active');
}

function showSection(sectionId) {
document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
document.getElementById(sectionId).classList.add('active');
}

// Откладываем рендеринг до загрузки конфигурации
document.addEventListener('DOMContentLoaded', function() {
    if (typeof staffConfig !== 'undefined') {
        renderRoleOptions();
    } else {
        // Ждём загрузки config.js
        const checkConfig = setInterval(() => {
            if (typeof staffConfig !== 'undefined') {
                clearInterval(checkConfig);
                renderRoleOptions();
            }
        }, 50);
        // Таймаут на случай если конфиг не загрузится
        setTimeout(() => clearInterval(checkConfig), 3000);
    }
});
