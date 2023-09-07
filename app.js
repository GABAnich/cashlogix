const fs = require('fs');

const { MongoClient, ServerApiVersion } = require("mongodb");

console.log('cashlogix - expenses visualization');
console.log();
console.log('Usage:   cashlogix [options]');
console.log();
console.log('Examples:');
console.log();
console.log('   cashlogix logs.json');

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

const date_to_datetime = (log) => ({ ...log, date: new Date(log.date * 1000) });

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

const client = new MongoClient('mongodb://localhost',  {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  }
);
client.connect().then(() => {
  const log = client.db("test").collection("log");

  const to_insert = transformed_data
    .map(date_to_datetime);

  log.deleteMany({}).then(() => {
    log.insertMany(to_insert).then(() => {
      console.log(`inserted: ${to_insert.length}`);

      log.aggregate([
        { $group: { _id: '$description', total: { $sum: '$value' } } },
        { $sort: { total: -1 } },
      ])
        .toArray()
        .then((expenses_by_categories) => {
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
  <h1>Expenses by Categories</h1>
  ${array_to_html_table(expenses_by_categories)}    

  <h2>Percentage</h2>
  ${array_to_html_table(calculate_category_percentages(transformed_data))}
</body>
</html>`;

          fs.writeFileSync('./out.html', html_out);
        })
    });
  })
});
