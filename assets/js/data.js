// ==================== DATA ====================
const networks = Object.fromEntries(staffConfig.managers.map(manager => [manager.id, manager.networks]));
networks.tech = [];

const allNetworks = staffConfig.managers.flatMap(manager => manager.networks);
const priceColumns = ['maria-ra', 'federal', 'local', 'distributors', 'gorod', 'rrc', 'rac'];
const priceColumnNames = {
'maria-ra': 'Мария-Ра',
'federal': 'Федеральные сети',
'local': 'Локальные сети',
'distributors': 'Дистрибьюторы',
'gorod': 'Город',
'rrc': 'РРЦ',
'rac': 'РАЦ'
};
const userNames = Object.fromEntries(
[...staffConfig.managers, ...staffConfig.tech].map(user => [user.id, user.name])
);

const basePricesData = {
'1001': { name: 'Молоко 3.2% 1л', category: 'dairy', updated: '2024-01-15', prices: { 'maria-ra': 89.90, 'federal': 92.00, 'local': 87.00, 'distributors': 85.00, 'gorod': 92.00, 'rrc': 95.00, 'rac': 90.00 } },
'1002': { name: 'Хлеб бородинский 400г', category: 'bakery', updated: '2024-01-14', prices: { 'maria-ra': 45.00, 'federal': 47.00, 'local': 43.00, 'distributors': 42.00, 'gorod': 47.00, 'rrc': 50.00, 'rac': 48.00 } },
'1003': { name: 'Яйца С0 10шт', category: 'dairy', updated: '2024-01-15', prices: { 'maria-ra': 120.00, 'federal': 125.00, 'local': 115.00, 'distributors': 115.00, 'gorod': 125.00, 'rrc': 130.00, 'rac': 125.00 } },
'1004': { name: 'Сахар 1кг', category: 'grocery', updated: '2024-01-10', prices: { 'maria-ra': 65.50, 'federal': 68.00, 'local': 63.00, 'distributors': 62.00, 'gorod': 68.00, 'rrc': 70.00, 'rac': 67.00 } },
'1005': { name: 'Масло подсолнечное 1л', category: 'oil', updated: '2024-01-12', prices: { 'maria-ra': 110.00, 'federal': 115.00, 'local': 105.00, 'distributors': 105.00, 'gorod': 115.00, 'rrc': 120.00, 'rac': 115.00 } },
'1006': { name: 'Кефир 2.5% 1л', category: 'dairy', updated: '2024-01-15', prices: { 'maria-ra': 75.00, 'federal': 78.00, 'local': 72.00, 'distributors': 70.00, 'gorod': 78.00, 'rrc': 80.00, 'rac': 77.00 } },
'1007': { name: 'Батон нарезной', category: 'bakery', updated: '2024-01-14', prices: { 'maria-ra': 38.00, 'federal': 40.00, 'local': 36.00, 'distributors': 35.00, 'gorod': 40.00, 'rrc': 42.00, 'rac': 40.00 } },
'1008': { name: 'Рис круглозерный 1кг', category: 'grocery', updated: '2024-01-11', prices: { 'maria-ra': 95.00, 'federal': 98.00, 'local': 92.00, 'distributors': 90.00, 'gorod': 98.00, 'rrc': 100.00, 'rac': 97.00 } },
'1009': { name: 'Гречка 1кг', category: 'grocery', updated: '2024-01-11', prices: { 'maria-ra': 120.00, 'federal': 125.00, 'local': 115.00, 'distributors': 115.00, 'gorod': 125.00, 'rrc': 130.00, 'rac': 125.00 } },
'1010': { name: 'Масло оливковое 500мл', category: 'oil', updated: '2024-01-13', prices: { 'maria-ra': 450.00, 'federal': 470.00, 'local': 430.00, 'distributors': 430.00, 'gorod': 470.00, 'rrc': 500.00, 'rac': 480.00 } }
};

let priceVersionHistory = [
{ id: 1, scope: 'cell', sku: '1001', column: 'maria-ra', oldPrice: 87.00, newPrice: 89.90, changedBy: 'Иван Петров', changedAt: '2024-01-15 10:30', action: 'manual_update', summary: 'Точечная корректировка цены' },
{ id: 2, scope: 'cell', sku: '1003', column: 'federal', oldPrice: 120.00, newPrice: 125.00, changedBy: 'Иван Петров', changedAt: '2024-01-15 11:15', action: 'manual_update', summary: 'Корректировка цены по федеральным сетям' },
{ id: 3, scope: 'cell', sku: '1005', column: 'rac', oldPrice: 110.00, newPrice: 115.00, changedBy: 'Алексей Сидоров', changedAt: '2024-01-14 14:20', action: 'manual_update', summary: 'Изменение РАЦ' }
];

let promos = [
{
id: 1,
manager: 'manager1',
managerName: 'Александр',
network: 'Пятёрочка',
promoName: 'Скидки недели',
comment: 'Акция на молочную продукцию',
createdAt: '2024-01-10',
status: 'loaded',
revision: 0,
requiresManagerComment: false,
resubmissionComment: '',
techReturnComment: '',
taskCompletedAt: '2024-01-11 10:45',
taskEvents: [
{ type: 'created', at: '2024-01-10 09:00', by: 'Александр', comment: 'Исходная заявка менеджера' },
{ type: 'started', at: '2024-01-11 09:50', by: 'Иван Петров', comment: 'Взято в работу' },
{ type: 'loaded', at: '2024-01-11 10:45', by: 'Иван Петров', comment: 'Загрузка завершена' }
],
items: [
{ name: 'Молоко 3.2% 1л', basePrice: 89.90, promoPrice: 76.42, discount: 15, startDate: '2024-01-15', endDate: '2024-01-31' },
{ name: 'Яйца С0 10шт', basePrice: 120.00, promoPrice: 99.00, discount: 17.5, startDate: '2024-01-15', endDate: '2024-01-31' },
{ name: 'Кефир 2.5% 1л', basePrice: 75.00, promoPrice: 64.50, discount: 14, startDate: '2024-01-15', endDate: '2024-01-31' },
{ name: 'Сметана 20% 300г', basePrice: 68.00, promoPrice: 57.80, discount: 15, startDate: '2024-01-15', endDate: '2024-01-31' },
{ name: 'Творог 5% 180г', basePrice: 92.00, promoPrice: 78.20, discount: 15, startDate: '2024-01-15', endDate: '2024-01-31' },
{ name: 'Йогурт натуральный 250г', basePrice: 54.00, promoPrice: 45.90, discount: 15, startDate: '2024-01-15', endDate: '2024-01-31' }
],
techStatus: 'loaded',
loadedAt: '2024-01-11 10:30',
processedBy: 'Иван Петров'
},
{
id: 2,
manager: 'manager2',
managerName: 'Елена',
network: 'Ашан',
promoName: 'Новогодняя распродажа',
comment: '',
createdAt: '2024-01-12',
status: 'active',
revision: 0,
requiresManagerComment: false,
resubmissionComment: '',
techReturnComment: '',
taskCompletedAt: '2024-01-13 14:32',
taskEvents: [
{ type: 'created', at: '2024-01-12 12:00', by: 'Елена', comment: 'Новая заявка' },
{ type: 'started', at: '2024-01-13 13:10', by: 'Иван Петров', comment: 'Взято в работу' },
{ type: 'loaded', at: '2024-01-13 14:32', by: 'Иван Петров', comment: 'Загрузка завершена' }
],
items: [
{ name: 'Сахар 1кг', basePrice: 65.50, promoPrice: 58.95, discount: 10, startDate: '2024-01-20', endDate: '2024-01-27' },
{ name: 'Рис круглозерный 1кг', basePrice: 95.00, promoPrice: 79.00, discount: 16.8, startDate: '2024-01-20', endDate: '2024-01-27' },
{ name: 'Гречка 900г', basePrice: 115.00, promoPrice: 96.60, discount: 16, startDate: '2024-01-20', endDate: '2024-01-27' }
],
techStatus: 'loaded',
loadedAt: '2024-01-13 14:15',
processedBy: 'Иван Петров'
},
{
id: 3,
manager: 'manager1',
managerName: 'Александр',
network: 'Магнит',
promoName: 'Выгодные цены',
comment: 'Согласовано с закупкой',
createdAt: '2024-01-14',
status: 'pending',
revision: 1,
requiresManagerComment: false,
resubmissionComment: '',
techReturnComment: '',
taskCompletedAt: null,
taskEvents: [
{ type: 'created', at: '2024-01-14 11:30', by: 'Александр', comment: 'Первичная заявка' }
],
items: [
{ name: 'Масло подсолнечное 1л', basePrice: 110.00, promoPrice: 88.00, discount: 20, startDate: '2024-01-25', endDate: '2024-02-10' },
{ name: 'Кефир 2.5% 1л', basePrice: 75.00, promoPrice: 59.00, discount: 21.3, startDate: '2024-01-25', endDate: '2024-02-10' },
{ name: 'Батон нарезной', basePrice: 38.00, promoPrice: 36.10, discount: 5, startDate: '2024-01-25', endDate: '2024-02-10' },
{ name: 'Сахар 1кг', basePrice: 65.50, promoPrice: 55.70, discount: 15, startDate: '2024-01-25', endDate: '2024-02-10' },
{ name: 'Рис длиннозерный 900г', basePrice: 102.00, promoPrice: 84.70, discount: 17, startDate: '2024-01-25', endDate: '2024-02-10' }
],
techStatus: 'pending',
loadedAt: null,
processedBy: null
},
{
id: 4,
manager: 'manager3',
managerName: 'Дмитрий',
network: 'Лента',
promoName: 'Февральские скидки',
comment: '',
createdAt: '2024-01-15',
status: 'returned',
revision: 2,
requiresManagerComment: true,
resubmissionComment: '',
techReturnComment: 'Не хватает комментария по механике акции и не заполнен период для части позиций.',
taskCompletedAt: null,
taskEvents: [
{ type: 'created', at: '2024-01-15 10:00', by: 'Дмитрий', comment: 'Первичная заявка' },
{ type: 'started', at: '2024-01-15 11:05', by: 'Алексей Сидоров', comment: 'Взято в работу' },
{ type: 'returned', at: '2024-01-15 11:20', by: 'Алексей Сидоров', comment: 'Не хватает комментария по механике акции и не заполнен период для части позиций.' }
],
items: [
{ name: 'Гречка 1кг', basePrice: 120.00, promoPrice: 99.00, discount: 17.5, startDate: '2024-02-01', endDate: '2024-02-28' },
{ name: 'Масло сливочное 180г', basePrice: 165.00, promoPrice: 142.00, discount: 14, startDate: '2024-02-01', endDate: '2024-02-28' }
],
techStatus: 'returned',
loadedAt: null,
processedBy: null
},
{
id: 5,
manager: 'manager2',
managerName: 'Елена',
network: 'Перекрёсток',
promoName: 'Выходные дни',
comment: 'Только выходные',
createdAt: '2024-01-05',
status: 'expired',
revision: 0,
requiresManagerComment: false,
resubmissionComment: '',
techReturnComment: '',
taskCompletedAt: '2024-01-06 09:18',
taskEvents: [
{ type: 'created', at: '2024-01-05 16:30', by: 'Елена', comment: 'Первичная заявка' },
{ type: 'started', at: '2024-01-06 08:40', by: 'Иван Петров', comment: 'Взято в работу' },
{ type: 'loaded', at: '2024-01-06 09:18', by: 'Иван Петров', comment: 'Загрузка завершена' }
],
items: [
{ name: 'Хлеб бородинский 400г', basePrice: 45.00, promoPrice: 33.75, discount: 25, startDate: '2024-01-10', endDate: '2024-01-15' }
],
techStatus: 'loaded',
loadedAt: '2024-01-06 09:00',
processedBy: 'Иван Петров'
}
];

promos = promos.map(promo => ({
...promo,
managerName: userNames[promo.manager] || promo.managerName,
processedBy: promo.processedBy ? userNames.tech1 : promo.processedBy,
taskEvents: (promo.taskEvents || []).map(event => ({
...event,
by: event.type === 'created' || event.type === 'resubmitted'
? (userNames[promo.manager] || event.by)
: (event.type === 'started' || event.type === 'loaded' || event.type === 'returned'
? userNames.tech1
: event.by)
}))
}));

let currentUser = null, currentRole = null, currentNetwork = null;
let basePricesSort = { column: 'name', direction: 'asc' };
let promoPricesSort = { column: 'promoPrice', direction: 'asc' };
let priceEditMode = false;
let selectedPriceRows = [];
let selectedPriceCells = [];
let techTaskViewState = { promoId: null, page: 1, search: '', mode: 'details' };
let editingPromoId = null;

function formatDateTime(date) {
return date.toISOString().replace('T', ' ').substring(0, 16);
}

function formatDate(date) {
return date.toISOString().split('T')[0];
}

function getNowStamp() {
return formatDateTime(new Date());
}

function getNextHistoryId() {
return priceVersionHistory.length ? Math.max(...priceVersionHistory.map(item => item.id)) + 1 : 1;
}

function getNextPromoId() {
return promos.length ? Math.max(...promos.map(item => item.id)) + 1 : 1;
}

function addTaskEvent(promo, type, comment) {
promo.taskEvents = promo.taskEvents || [];
promo.taskEvents.unshift({
type,
at: getNowStamp(),
by: document.getElementById('userName') ? document.getElementById('userName').textContent : userNames[currentUser],
comment: comment || ''
});
}

function getTechStatusLabel(status) {
return {
pending: 'Ожидает',
in-progress: 'В работе',
loaded: 'Загружено',
returned: 'Возвращено'
}[status] || status;
}

function getTechStatusClass(status) {
return {
pending: 'pending',
in-progress: 'in-progress',
loaded: 'loaded',
returned: 'expired'
}[status] || 'archived';
}

function getPromoReturnBadge(promo) {
if (promo.techStatus === 'returned') return 'Возврат';
if (promo.revision > 1 && promo.techStatus !== 'loaded') return 'Повтор';
return '';
}

function getTaskPreviewText(items) {
const hiddenCount = Math.max(items.length - 2, 0);
return hiddenCount > 0 ? `и ещё ${hiddenCount}` : '';
}

function getPromoById(promoId) {
return promos.find(promo => promo.id === promoId);
}

function recordPriceHistory(entry) {
priceVersionHistory.unshift({
id: getNextHistoryId(),
scope: entry.scope || 'cell',
sku: entry.sku || null,
column: entry.column || null,
oldPrice: entry.oldPrice,
newPrice: entry.newPrice,
changedBy: entry.changedBy,
changedAt: entry.changedAt,
action: entry.action,
summary: entry.summary || '',
targetName: entry.targetName || '',
details: entry.details || ''
});
}
