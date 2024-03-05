class AppError extends Error {
  constructor(message, status, errorCode, detail) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.detail = detail;
  }
}

/**
 * Message
 * Status Code
 * Error Code
 * More detailed description
 */

export class TableNotFoundError extends AppError {
  constructor(table) {
    super(
      `Table ${table} not found`,
      404,
      "TABLE_NOT_FOUND",
      `Table ${table} not found.  You've likely attempted to access a table that does not exist within the database`
    );
  }
}

export class DatabaseError extends AppError {
  constructor() {
    super(
      `Database error`,
      404,
      "DATABASE_ERROR",
      "The database encountered an error.  Don't look at us"
    );
  }
}

export class BadRequestError extends AppError {
  constructor(table) {
    super(
      "Hmm this operation didn't work",
      400,
      "BAD_REQUEST",
      "Failed to execute the request. Probably due to an invalid ID provided."
    );
  }
}

export class AdminPrivilegesRequired extends AppError {
  constructor(table) {
    super(
      `Admin privilege is required for the ${table} table`,
      401,
      "ADMIN_REQUIRED",
      "You don't have admin privileges to access this resource."
    );
  }
}

export class ValidationError extends AppError {
  constructor(table) {
    super(
      `Validation failed for this attempt`,
      402,
      "INVALID_REQUEST",
      `You likely provided data that is not compatible with the ${table} table`
    );
  }
}
