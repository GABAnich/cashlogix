const fs = require('fs');

console.log('cashlogix - expenses visualization');
console.log();
console.log('Usage:   cashlogix [options]');
console.log();
console.log('Examples:');
console.log();
console.log('   cashlogix logs.json');

const remove_chat_id = (log) => {
  const { chat_id, ...rest } = log;
  return rest;
};

const remove_original = (log) => {
  const { original, ...rest } = log;
  return rest;
};

const trim_value = (log) => ({
  ...log,
  value: log.value.at(0) === "'" ? log.value.slice(1) : log.value,
})

const value_to_number = (log) => ({ ...log, value: parseFloat(log.value) });

const ts_to_iso_date = (log) => ({
  ...log,
  date: (new Date(log.date * 1000)).toISOString(),
});

const to_csv_row = (log) => `${log.date},${log.value},${log.description}`;

const is_negative_value = (log) => log.value < 0;

const drop_value_sign = (log) => ({ ...log, value: log.value * -1 });

const data = require('./results.json');
const lines = data
  .map(remove_chat_id)
  .map(remove_original)
  .map(trim_value)
  .filter(is_negative_value)
  .map(drop_value_sign)
  .map(value_to_number)
  .map(ts_to_iso_date)
  .map(to_csv_row);

const out = ['date,value,description', ...lines].join('\n');

fs.writeFileSync('./out.csv', out);
