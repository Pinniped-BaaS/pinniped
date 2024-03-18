import Column from '../models/column.js';

export default function parseJsonColumns(table, rows) {
  console.log(table, rows);
  for (let row of rows) {
    for (let key in row) {
      if (key === 'id' || key === 'created_at' || key === 'updated_at')
        continue;
      console.log(key, table.getColumnByName(key)?.type);
      const column = table.getColumnByName(key);
      const columnType = column?.type;
      const isStringifiedJson = Column.COLUMN_MAP[columnType].isJson;
      if (isStringifiedJson) {
        console.log('fixing', row[key]);
        try {
          row[key] = JSON.parse(row[key]);
        } catch (err) {
          continue;
        }
      }
    }
  }
}
