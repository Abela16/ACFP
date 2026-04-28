declare module "node:sqlite" {
  export type SqlValue = null | number | string | Uint8Array;

  export type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  export class StatementSync {
    run(...params: SqlValue[]): RunResult;
    get<T = unknown>(...params: SqlValue[]): T | undefined;
    all<T = unknown>(...params: SqlValue[]): T[];
  }

  export class DatabaseSync {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
