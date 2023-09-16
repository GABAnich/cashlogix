const fs = require('fs');

const generalize_description = require('./generalize');

console.log('cashlogix - expenses visualization');
console.log();
console.log('Usage:   cashlogix [options]');
console.log();
console.log('Examples:');
console.log();
console.log('   cashlogix logs.json');

const calculate_total = (expenses) => {
  return expenses.reduce((acc, expense) => acc += expense.value, 0);
};

const calculate_category_percentages = (expenses) => {
  const category_total = expenses.reduce((acc, expense) => {
    const { description, value } = expense;
    acc[description] = (acc[description] || 0) + value;
    return acc;
  }, {});

  const sorted_categories = Object.keys(category_total)
    .map(k => ({ description: k, value: category_total[k] }))
    .sort((a, b) => b.value - a.value);

  const total_value = sorted_categories.reduce((acc, curr) => acc + curr.value, 0);

  const category_percentages = sorted_categories.map((category) => {
    const percentage = (category_total[category.description] / total_value) * 100;
    return { ...category, percentage }
  }, {});

  return category_percentages;
}

const calculate_expenses_by_categories = (expenses) => {
  const category_total = expenses.reduce((acc, curr) => {
    acc[curr.description] = (acc[curr.description] || 0) + curr.value;
    return acc;
  }, {});

  const res = Object.keys(category_total)
    .map(k => ({ description: k, value: category_total[k] }))
    .sort((a, b) => b.value - a.value);

  return res;
};

const array_to_html_table = (data) => {
  let html = '<table border="1">';
  
  html += '<tr>';
  for (const key in data[0]) {
    html += `<th>${key}</th>`;
  }
  html += '</tr>';

  data.forEach(obj => {
    html += '<tr>';
    for (const key in obj) {
      html += `<td>${obj[key]}</td>`;
    }
    html += '</tr>';
  });

  html += '</table>';
  return html;
}

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
const transformed_data = data
  .map(remove_chat_id)
  .map(remove_original)
  .map(trim_value)
  .filter(is_negative_value)
  .map(drop_value_sign)
  .map(value_to_number)

const lines = transformed_data
  .map(ts_to_iso_date)
  .map(to_csv_row);

const out = ['date,value,description', ...lines].join('\n');

fs.writeFileSync('./out.csv', out);

console.log(
  transformed_data
    .map((log) => `insert events,category=${log.description.split(' ').join('_') || 'none'} value=${log.value} ${log.date*1000*1000*1000}`)
  .join('\n')
);

const html_out = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        /* Target the table headers */
        table th {
            background-color: #f2f2f2;
            border: 1px solid #ccc;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }

        /* Add hover effect on table headers */
        table th:hover {
            background-color: #e0e0e0;
            cursor: pointer;
        }

        /* Style the table */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        /* Style table rows */
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }

        /* Style table data cells */
        td {
            border: 1px solid #ccc;
            padding: 8px;
        }
    </style>
</head>
<body>
  <h1>Total</h1>
  <h2>${calculate_total(transformed_data.map(generalize_description))}</h2>
  <hr />

  <h1>Expenses by Categories</h1>
  <div>
    <canvas id="expenses_by_category"><canvas/>
  </div>
  ${array_to_html_table(calculate_expenses_by_categories(transformed_data.map(generalize_description)))}    
  <hr />

  <h1>Percentage</h1>
  <div>
    <canvas id="category_percentages"><canvas/>
  </div>
  ${array_to_html_table(calculate_category_percentages(transformed_data.map(generalize_description)))}
  <hr />

  <script>
    const expenses_by_category = ${JSON.stringify(
      calculate_expenses_by_categories(transformed_data.map(generalize_description))
    )};
    const category_percentages = ${JSON.stringify(
      calculate_category_percentages(transformed_data.map(generalize_description))
    )};
  </script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="./scripts/index.js"></script>

</body>
</html>`;

fs.writeFileSync('./out.html', html_out);
