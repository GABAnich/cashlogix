const fs = require("fs");

const generalize_description = require("./generalize");
const data = require("./results.json");

const remove_chat_id = (log) => {
  const { chat_id, ...rest } = log;
  return rest;
};

const remove_original = (log) => {
  const { original, ...rest } = log;
  return rest;
};

const ts_to_iso_date = (log) => ({
  ...log,
  date: new Date(log.date * 1000).toISOString(),
});

const to_csv_row = (log) => `${log.date},${log.value},${log.description}`;

const date_to_nanosecond = (log) => ({
  ...log,
  date: log.date * 1000 * 1000 * 1000,
});

const fill_spaces_in_description = (log) => ({
  ...log,
  description: log.description.split(" ").join("_"),
});

const empty_description_to_none = (log) => ({
  ...log,
  description: log.description || "none",
});

const to_influx_insert = (log) =>
  `insert all_events,category=${log.description} value=${log.value} ${log.date}`;

const transformed_data = data
  .map(remove_chat_id)
  .map(remove_original)
  .map(generalize_description);

const lines = transformed_data.map(ts_to_iso_date).map(to_csv_row);

const out = ["date,value,description", ...lines].join("\n");

fs.writeFileSync("./out.csv", out);

transformed_data
  .map(date_to_nanosecond)
  .map(fill_spaces_in_description)
  .map(empty_description_to_none)
  .map(to_influx_insert)
  .map((log) => {
    console.log(log);
  });
