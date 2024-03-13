import Column from "./column.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import knex from "knex";
import DAO from "../dao/dao.js";
import { BadRequestError } from "../utils/errors.js";

class Table {
  static API_RULES = [
    "getAllRule",
    "getOneRule",
    "createRule",
    "updateRule",
    "deleteRule",
  ];
  static API_RULE_VALUES = ["public", "user", "creator", "admin"];
  static DEFAULT_RULE = "public";

  static getNewConnection() {
    return new DAO().getDB();
  }

  constructor({
    id = uuidv4(),
    name = "",
    columns = [],
    getAllRule = Table.DEFAULT_RULE,
    getOneRule = Table.DEFAULT_RULE,
    createRule = Table.DEFAULT_RULE,
    updateRule = Table.DEFAULT_RULE,
    deleteRule = Table.DEFAULT_RULE,
  }) {
    this.id = id;
    this.name = name;
    if (typeof columns === "string") {
      columns = JSON.parse(columns);
    }
    this.columns = columns.map((column) => new Column({ ...column }));
    this.getAllRule = getAllRule;
    this.getOneRule = getOneRule;
    this.createRule = createRule;
    this.deleteRule = deleteRule;
    this.updateRule = updateRule;

    this.validate();
  }

  /**
   * Validates the table object to match our table structure.
   * @returns {undefined}
   */
  validate() {
    if (!this.id) throw new BadRequestError("Table doesn't have a valid ID.");
    if (!this.name) throw new BadRequestError("The table must have a name.");
    if (this.columns.length === 0) {
      throw new BadRequestError("The table must have at least one column.");
    }
    if (!this.columns.every((column) => column.id)) {
      throw new BadRequestError("Columns must have IDs.");
    }
    if (!this.columns.every((column) => column.name)) {
      throw new BadRequestError("All columns must have names.");
    }
    if (!this.columns.every((column) => column.type)) {
      throw new BadRequestError("All columns must have types.");
    }
    if (!this.columns.every((column) => Column.isValidType(column.type))) {
      throw new BadRequestError(
        `Invalid type passed: valid types are ${Object.keys(Column.COLUMN_MAP)}`
      );
    }

    if (
      this.columns.some(
        (column) =>
          column.name === "id" ||
          column.name === "created_at" ||
          column.name === "updated_at"
      )
    ) {
      throw new BadRequestError(
        "Cannot add a column with a name of id, created_at, or updated_at"
      );
    }

    let colNames = this.columns.map((column) => column.name);
    let setNames = new Set(colNames);
    if (colNames.length !== setNames.size) {
      throw new BadRequestError(
        "All column names must be unique for a single table."
      );
    }

    Table.API_RULES.forEach((rule) => {
      if (!Table.API_RULE_VALUES.includes(this[rule])) {
        throw new BadRequestError(`Invalid ${rule}: ${this[rule]}`);
      }
    });
  }

  /**
   * Validates the proposed schema changes.
   * @param {object Table} newTable
   * @returns {undefined}
   */
  async validateUpdateTo(newTable) {
    /// VALIDATING THE UPDATE
    if (this.id !== newTable.id) {
      throw new BadRequestError("Table ID cannot be changed.");
    }
    // no column type changes

    // no relationship
  }

  generateId() {
    this.id = uuidv4();
  }

  getColumns() {
    return this.columns;
  }

  stringifyColumns() {
    return JSON.stringify(this.getColumns());
  }

  getColumnById(id) {
    let foundColumn = this.columns.find((column) => column.id === id);
    if (!foundColumn) return null;
    return foundColumn;
  }

  initializeIds() {
    this.columns.forEach((column) => column.initializeId());
  }

  /**
   * Adds the calling table to the database and to the tablemeta

   * Creates and runs migration file using `knex` migrations api and `fs`
   * @returns {undefined}
   */
  async create() {
    const dao = new DAO();
    const existingTable = await dao.findTableByName(this.name);
    if (existingTable.length) {
      throw new BadRequestError("The table name already exists: ", this.name);
    }

    const db = Table.getNewConnection();

    let filePath = await db.migrate.make(`create_table_${this.name}`);

    const stringTable = JSON.stringify(this);

    const stringTableMetaRow = JSON.stringify({
      ...this,
      columns: this.stringifyColumns(),
    });

    const migrateTemplate = `
      import DAO from "../src/dao/dao.js";

      export async function up(knex) {
        const dao = new DAO("", knex);
        await dao.createTable(${stringTable});
        await dao.addTableMetaData(${stringTableMetaRow});
      }


      export async function down(knex) {
        const dao = new DAO("", knex);
        await dao.dropTable("${this.name}");
        await dao.deleteTableMetaData("${this.id}");
      }
     `;

    fs.writeFileSync(filePath, migrateTemplate);

    await db.migrate.up();

    // must close connection after running migrations or socket will hang
    await db.destroy();
  }

  /**
   * Drops the calling table from the database, and from tablemeta.
   *
   * Creates and runs migration file using `knex` migrations api and `fs`
   * @returns {undefined}
   */
  async drop() {
    let db = Table.getNewConnection();

    let filePath = await db.migrate.make(`drop_table_${this.name}`);

    const stringTable = JSON.stringify(this);

    const stringTableMetaRow = JSON.stringify({
      ...this,
      columns: this.stringifyColumns(),
    });

    const migrateTemplate = `
        import DAO from "../src/dao/dao.js";

        export async function up(knex) {
          const dao = new DAO("", knex);
          await dao.dropTable("${this.name}");
          await dao.deleteTableMetaData("${this.id}");
        }

        export async function down(knex) {
          const dao = new DAO("", knex);
          await dao.createTable(${stringTable});
          await dao.addTableMetaData(${stringTableMetaRow})
        }
       `;

    fs.writeFileSync(filePath, migrateTemplate);

    await db.migrate.up();

    // must close connection after running migrations or socket will hang
    await db.destroy();
  }

  /**
   * Induces schema changes based on the comparison between the old table and the new table.
   * It'll loop through the columns property, looking for whether
   * (Add Column) The column exists in the new table but not the old,
   * (Delete Column) The column doesn't exist in the new table but in the old,
   * (Rename Column) The column exists in both, but has a different name in the two tables.
   *
   * Creates and runs migration file using `knex` migrations api and `fs`
   * @param {object Table} newTable
   * @returns {undefined}
   */
  async updateTo(newTable) {
    await this.validateUpdateTo(newTable);

    const db = Table.getNewConnection();

    const oldColumns = this.getColumns();
    const newColumns = newTable.getColumns();

    let filePath = await db.migrate.make(`update_table_${this.name}`);

    const newStringTableMetaRow = JSON.stringify({
      ...newTable,
      columns: newTable.stringifyColumns(),
    });

    const oldStringTableMetaRow = JSON.stringify({
      ...this,
      columns: this.stringifyColumns(),
    });

    const migrateTemplate = `
    import DAO from "../src/dao/dao.js";

    export async function up(knex) {
      const oldTable = ${JSON.stringify(this)};
      const newTable = ${JSON.stringify(newTable)};
      const oldColumns = ${JSON.stringify(oldColumns)};
      const newColumns = ${JSON.stringify(newColumns)};

      const dao = new DAO("", knex);

      // Delete Columns (Tested)
      for (let oldColumn of oldColumns) {
        if (newColumns.find((newColumn) => oldColumn.id === newColumn.id)) continue;
        await dao.dropColumn(oldTable.name, oldColumn.name);
      }

      // Add OR Rename Columns (Renaming Tested, Adding tested)
      for (let newColumn of newColumns) {
        let match = oldColumns.find((oldColumn) => oldColumn.id === newColumn.id);
        if (!match) {
          await dao.addColumn(oldTable.name, newColumn);
        }
        if (match && match.name !== newColumn.name) {
          await dao.renameColumn(oldTable.name, match.name, newColumn.name);
        }
      }

      // Rename Table (Tested)
      if (oldTable.name !== newTable.name) {
        await dao.renameTable(oldTable.name, newTable.name);
      }

      // sets the table meta to the new table
      await dao.updateTableMetaData(${newStringTableMetaRow})
    }

    export async function down(knex) {
      //Run the exact same logic as the up method, but with new and old variables
      //swapped..
      const oldTable = ${JSON.stringify(newTable)};
      const newTable = ${JSON.stringify(this)};
      const oldColumns = ${JSON.stringify(newColumns)};
      const newColumns = ${JSON.stringify(oldColumns)};

      const dao = new DAO("", knex);

      // Delete Columns
      for (let oldColumn of oldColumns) {
        if (newColumns.find((newColumn) => oldColumn.id === newColumn.id)) continue;
        await dao.dropColumn(oldTable.name, oldColumn.name);
      }

      // Add OR Rename Columns
      for (let newColumn of newColumns) {
        let match = oldColumns.find((oldColumn) => oldColumn.id === newColumn.id);
        if (!match) {
          await dao.addColumn(oldTable.name, newColumn);
        }
        if (match && match.name !== newColumn.name) {
          await dao.renameColumn(oldTable.name, match.name, newColumn.name);
        }
      }

      if (oldTable.name !== newTable.name) {
        await dao.renameTable(oldTable.name, newTable.name);
      }

      // sets the table meta to the old table
      await dao.updateTableMetaData(${oldStringTableMetaRow})
    }
   `;

    fs.writeFileSync(filePath, migrateTemplate);

    await db.migrate.up();

    // must close connection after running migrations or socket will hang
    await db.destroy();
  }
}

export default Table;
