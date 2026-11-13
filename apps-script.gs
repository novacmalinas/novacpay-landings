/**
 * Приём анкет с form.html в Google-таблицу.
 * Таблица: первая строка — заголовки из HEADERS, лист называется «Анкеты».
 * Развернуть: Расширения → Apps Script → вставить код → Развернуть → Новое развёртывание →
 * тип «Веб-приложение», «Выполнять от имени: я», «Доступ: все». Полученный URL поставить в FORM_ENDPOINT в form.html.
 */
var SHEET_NAME = 'Анкеты';
var HEADERS = ['Время', 'Метка (источник)', 'Имя', 'Telegram или телефон', 'Кто', 'Интересы', 'Функции',
  'Переводы в Китай: сумма', 'Переводы в Китай: как платят', 'Переводы в Китай: комиссия',
  'Согласие на рассылку'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
    else if (sh.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') !== HEADERS.join('|'))
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);  /* новые столбцы в заголовке */
    sh.appendRow([
      new Date(d.time || Date.now()), clean(d.source), clean(d.name), clean(d.contact), clean(d.who),
      clean(d.interests), clean(d.features), clean(d.china_amount), clean(d.china_now), clean(d.china_fee),
      clean(d.marketing)
    ]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  } finally {
    lock.releaseLock();
  }
}

/* Не даём ячейке превратиться в формулу: значения из формы всегда текст. */
function clean(v) {
  v = (v == null ? '' : String(v)).slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
