import type {
  AlterTableBatch,
  ColumnDefinition,
  ConstraintDefinition,
  IndexDefinition,
  TableDefinition
} from '@data-peek/shared'
import { describe, expect, it } from 'vitest'
import {
  buildAlterPreviewDDL,
  buildAlterTable,
  buildCreateIndex,
  buildCreateTable,
  buildDropTable,
  buildPreviewDDL,
  validateTableDefinition
} from '../ddl-builder'

// Test fixtures
const createColumn = (overrides: Partial<ColumnDefinition> = {}): ColumnDefinition => ({
  id: 'col-1',
  name: 'test_column',
  dataType: 'varchar',
  isNullable: true,
  isPrimaryKey: false,
  isUnique: false,
  ...overrides
})

const createTableDef = (overrides: Partial<TableDefinition> = {}): TableDefinition => ({
  schema: 'public',
  name: 'users',
  columns: [
    createColumn({
      id: 'col-1',
      name: 'id',
      dataType: 'integer',
      isNullable: false,
      isPrimaryKey: true
    }),
    createColumn({
      id: 'col-2',
      name: 'name',
      dataType: 'varchar',
      length: 100,
      isNullable: false
    }),
    createColumn({
      id: 'col-3',
      name: 'email',
      dataType: 'varchar',
      length: 255,
      isNullable: false,
      isUnique: true
    }),
    createColumn({ id: 'col-4', name: 'created_at', dataType: 'timestamp', defaultValue: 'now()' })
  ],
  constraints: [],
  indexes: [],
  ...overrides
})

describe('buildCreateTable', () => {
  describe('basic table creation', () => {
    it('should create a simple table with columns', () => {
      const tableDef = createTableDef()
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('CREATE TABLE "users"')
      expect(result.sql).toContain('"id" integer NOT NULL PRIMARY KEY')
      expect(result.sql).toContain('"name" varchar(100) NOT NULL')
      expect(result.sql).toContain('"email" varchar(255) NOT NULL UNIQUE')
      expect(result.sql).toContain('"created_at" timestamp DEFAULT now()')
      expect(result.params).toEqual([])
    })

    it('should handle custom schema', () => {
      const tableDef = createTableDef({ schema: 'analytics' })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('CREATE TABLE "analytics"."users"')
    })

    it('should not include schema for public', () => {
      const tableDef = createTableDef({ schema: 'public' })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).not.toContain('"public".')
      expect(result.sql).toContain('CREATE TABLE "users"')
    })

    it('should not include schema for dbo in MSSQL', () => {
      const tableDef = createTableDef({ schema: 'dbo' })
      const result = buildCreateTable(tableDef, 'mssql')

      expect(result.sql).not.toContain('[dbo].')
      expect(result.sql).toContain('CREATE TABLE [users]')
    })

    it('should handle unlogged tables (PostgreSQL)', () => {
      const tableDef = createTableDef({ unlogged: true })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('CREATE UNLOGGED TABLE "users"')
    })
  })

  describe('column data types', () => {
    it('should handle varchar with length', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'name', dataType: 'varchar', length: 50 })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('"name" varchar(50)')
    })

    it('should handle char with length', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'code', dataType: 'char', length: 3 })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('"code" char(3)')
    })

    it('should handle numeric with precision and scale', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'price', dataType: 'numeric', precision: 10, scale: 2 })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('"price" numeric(10,2)')
    })

    it('should handle numeric with precision only', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'amount', dataType: 'numeric', precision: 15 })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('"amount" numeric(15)')
    })

    it('should handle array types', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'tags', dataType: 'text', isArray: true })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('"tags" text[]')
    })
  })

  describe('column constraints', () => {
    it('should add NOT NULL constraint', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'required', dataType: 'text', isNullable: false })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('"required" text NOT NULL')
    })

    it('should handle PRIMARY KEY', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'id', dataType: 'integer', isPrimaryKey: true })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('"id" integer PRIMARY KEY')
    })

    it('should handle UNIQUE constraint', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'email', dataType: 'varchar', isUnique: true })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('"email" varchar UNIQUE')
    })

    it('should handle DEFAULT values', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'status', dataType: 'varchar', defaultValue: "'active'" })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain("DEFAULT 'active'")
    })

    it('should handle DEFAULT with expression', () => {
      const tableDef = createTableDef({
        columns: [
          createColumn({
            name: 'uuid',
            dataType: 'uuid',
            defaultValue: 'gen_random_uuid()',
            defaultType: 'expression'
          })
        ]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('DEFAULT gen_random_uuid()')
    })

    it('should handle DEFAULT with sequence', () => {
      const tableDef = createTableDef({
        columns: [
          createColumn({
            name: 'id',
            dataType: 'integer',
            defaultType: 'sequence',
            sequenceName: 'users_id_seq',
            defaultValue: "nextval('users_id_seq')"
          })
        ]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain("DEFAULT nextval('users_id_seq')")
    })

    it('should handle column-level CHECK constraint', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'age', dataType: 'integer', checkConstraint: 'age >= 0' })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('CHECK (age >= 0)')
    })

    it('should handle COLLATE', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'name', dataType: 'text', collation: 'C' })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('COLLATE "C"')
    })
  })

  describe('composite primary keys', () => {
    it('should create table constraint for composite PK', () => {
      const tableDef = createTableDef({
        columns: [
          createColumn({ name: 'user_id', dataType: 'integer', isPrimaryKey: true }),
          createColumn({ name: 'org_id', dataType: 'integer', isPrimaryKey: true }),
          createColumn({ name: 'role', dataType: 'varchar' })
        ]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('PRIMARY KEY ("user_id", "org_id")')
      // Should not have inline PRIMARY KEY on columns
      expect(result.sql).not.toMatch(/"user_id" integer.*PRIMARY KEY[^(]/)
    })
  })

  describe('table-level constraints', () => {
    it('should add FOREIGN KEY constraint', () => {
      const tableDef = createTableDef({
        constraints: [
          {
            id: 'fk-1',
            type: 'foreign_key',
            name: 'fk_users_org',
            columns: ['org_id'],
            referencedSchema: 'public',
            referencedTable: 'organizations',
            referencedColumns: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION'
          } as ConstraintDefinition
        ]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('CONSTRAINT "fk_users_org" FOREIGN KEY ("org_id")')
      expect(result.sql).toContain('REFERENCES "organizations" ("id")')
      expect(result.sql).toContain('ON DELETE CASCADE')
    })

    it('should add UNIQUE constraint', () => {
      const tableDef = createTableDef({
        constraints: [
          {
            id: 'uq-1',
            type: 'unique',
            name: 'uq_email_org',
            columns: ['email', 'org_id']
          } as ConstraintDefinition
        ]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('CONSTRAINT "uq_email_org" UNIQUE ("email", "org_id")')
    })

    it('should add CHECK constraint', () => {
      const tableDef = createTableDef({
        constraints: [
          {
            id: 'ck-1',
            type: 'check',
            name: 'ck_positive_price',
            columns: [],
            checkExpression: 'price > 0'
          } as ConstraintDefinition
        ]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('CONSTRAINT "ck_positive_price" CHECK (price > 0)')
    })

    it('should add EXCLUDE constraint', () => {
      const tableDef = createTableDef({
        constraints: [
          {
            id: 'ex-1',
            type: 'exclude',
            name: 'ex_no_overlap',
            columns: [],
            excludeUsing: 'gist',
            excludeElements: [
              { column: 'room_id', operator: '=' },
              { column: 'during', operator: '&&' }
            ]
          } as ConstraintDefinition
        ]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('CONSTRAINT "ex_no_overlap" EXCLUDE USING gist')
      expect(result.sql).toContain('"room_id" WITH =')
      expect(result.sql).toContain('"during" WITH &&')
    })
  })

  describe('indexes', () => {
    it('should create index after table', () => {
      const tableDef = createTableDef({
        indexes: [
          {
            id: 'idx-1',
            name: 'idx_users_email',
            columns: [{ name: 'email' }],
            isUnique: false
          } as IndexDefinition
        ]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('CREATE INDEX "idx_users_email"')
      expect(result.sql).toContain('ON "users"')
      expect(result.sql).toContain('("email")')
    })
  })

  describe('table comments', () => {
    it('should add table comment', () => {
      const tableDef = createTableDef({ comment: 'User accounts table' })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('COMMENT ON TABLE')
      expect(result.sql).toContain("'User accounts table'")
    })

    it('should add column comments', () => {
      const tableDef = createTableDef({
        columns: [createColumn({ name: 'id', dataType: 'integer', comment: 'Primary identifier' })]
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('COMMENT ON COLUMN')
      expect(result.sql).toContain("'Primary identifier'")
    })
  })

  describe('table options', () => {
    it('should handle INHERITS', () => {
      const tableDef = createTableDef({ inherits: ['base_table'] })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('INHERITS ("base_table")')
    })

    it('should handle PARTITION BY', () => {
      const tableDef = createTableDef({
        partition: { type: 'RANGE', columns: ['created_at'] }
      })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('PARTITION BY RANGE ("created_at")')
    })

    it('should handle TABLESPACE', () => {
      const tableDef = createTableDef({ tablespace: 'fast_ssd' })
      const result = buildCreateTable(tableDef, 'postgresql')

      expect(result.sql).toContain('TABLESPACE "fast_ssd"')
    })
  })

  describe('dialect differences', () => {
    it('should use backticks for MySQL', () => {
      const tableDef = createTableDef()
      const result = buildCreateTable(tableDef, 'mysql')

      expect(result.sql).toContain('CREATE TABLE `users`')
      expect(result.sql).toContain('`id`')
      expect(result.sql).toContain('`name`')
    })

    it('should use square brackets for MSSQL', () => {
      const tableDef = createTableDef()
      const result = buildCreateTable(tableDef, 'mssql')

      expect(result.sql).toContain('CREATE TABLE [users]')
      expect(result.sql).toContain('[id]')
      expect(result.sql).toContain('[name]')
    })
  })
})

describe('buildCreateIndex', () => {
  it('should create a simple index', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      name: 'idx_users_name',
      columns: [{ name: 'name' }],
      isUnique: false
    }
    const result = buildCreateIndex('public', 'users', index, 'postgresql')

    expect(result.sql).toBe('CREATE INDEX "idx_users_name" ON "users" ("name");')
  })

  it('should create a unique index', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      name: 'idx_users_email',
      columns: [{ name: 'email' }],
      isUnique: true
    }
    const result = buildCreateIndex('public', 'users', index, 'postgresql')

    expect(result.sql).toContain('CREATE UNIQUE INDEX')
  })

  it('should create concurrent index (PostgreSQL)', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      name: 'idx_users_name',
      columns: [{ name: 'name' }],
      isUnique: false,
      concurrent: true
    }
    const result = buildCreateIndex('public', 'users', index, 'postgresql')

    expect(result.sql).toContain('CONCURRENTLY')
  })

  it('should skip CONCURRENTLY for unsupported dialects', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      name: 'idx_users_name',
      columns: [{ name: 'name' }],
      isUnique: false,
      concurrent: true
    }
    const result = buildCreateIndex('public', 'users', index, 'mysql')

    expect(result.sql).not.toContain('CONCURRENTLY')
  })

  it('should include USING method when not btree', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      name: 'idx_users_tags',
      columns: [{ name: 'tags' }],
      isUnique: false,
      method: 'gin'
    }
    const result = buildCreateIndex('public', 'users', index, 'postgresql')

    expect(result.sql).toContain('USING gin')
  })

  it('should not include USING btree (default)', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      name: 'idx_users_name',
      columns: [{ name: 'name' }],
      isUnique: false,
      method: 'btree'
    }
    const result = buildCreateIndex('public', 'users', index, 'postgresql')

    expect(result.sql).not.toContain('USING')
  })

  it('should handle column ordering', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      name: 'idx_users_created',
      columns: [{ name: 'created_at', order: 'DESC', nullsPosition: 'LAST' }],
      isUnique: false
    }
    const result = buildCreateIndex('public', 'users', index, 'postgresql')

    expect(result.sql).toContain('"created_at" DESC NULLS LAST')
  })

  it('should handle INCLUDE columns (covering index)', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      name: 'idx_users_email',
      columns: [{ name: 'email' }],
      isUnique: false,
      include: ['name', 'created_at']
    }
    const result = buildCreateIndex('public', 'users', index, 'postgresql')

    expect(result.sql).toContain('INCLUDE ("name", "created_at")')
  })

  it('should handle WHERE clause (partial index)', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      name: 'idx_active_users',
      columns: [{ name: 'email' }],
      isUnique: false,
      where: 'active = true'
    }
    const result = buildCreateIndex('public', 'users', index, 'postgresql')

    expect(result.sql).toContain('WHERE active = true')
  })

  it('should auto-generate index name when not provided', () => {
    const index: IndexDefinition = {
      id: 'idx-1',
      columns: [{ name: 'email' }, { name: 'name' }],
      isUnique: false
    }
    const result = buildCreateIndex('public', 'users', index, 'postgresql')

    expect(result.sql).toContain('idx_users_email_name')
  })
})

describe('buildDropTable', () => {
  it('should create DROP TABLE statement', () => {
    const result = buildDropTable('public', 'users', false, 'postgresql')

    expect(result.sql).toBe('DROP TABLE IF EXISTS "users";')
  })

  it('should include CASCADE', () => {
    const result = buildDropTable('public', 'users', true, 'postgresql')

    expect(result.sql).toBe('DROP TABLE IF EXISTS "users" CASCADE;')
  })

  it('should include schema when not default', () => {
    const result = buildDropTable('analytics', 'events', false, 'postgresql')

    expect(result.sql).toBe('DROP TABLE IF EXISTS "analytics"."events";')
  })

  it('should use correct quoting for MySQL', () => {
    const result = buildDropTable('public', 'users', false, 'mysql')

    expect(result.sql).toContain('`users`')
  })

  it('should use correct quoting for MSSQL', () => {
    const result = buildDropTable('dbo', 'users', false, 'mssql')

    expect(result.sql).toContain('[users]')
  })
})

describe('buildAlterTable', () => {
  const createBatch = (overrides: Partial<AlterTableBatch> = {}): AlterTableBatch => ({
    schema: 'public',
    table: 'users',
    columnOperations: [],
    constraintOperations: [],
    indexOperations: [],
    ...overrides
  })

  describe('column operations', () => {
    it('should add column', () => {
      const batch = createBatch({
        columnOperations: [
          { type: 'add', column: createColumn({ name: 'new_col', dataType: 'text' }) }
        ]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results).toHaveLength(1)
      expect(results[0].sql).toBe('ALTER TABLE "users" ADD COLUMN "new_col" text;')
    })

    it('should drop column', () => {
      const batch = createBatch({
        columnOperations: [{ type: 'drop', columnName: 'old_col' }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" DROP COLUMN "old_col";')
    })

    it('should drop column with CASCADE', () => {
      const batch = createBatch({
        columnOperations: [{ type: 'drop', columnName: 'old_col', cascade: true }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('CASCADE')
    })

    it('should rename column', () => {
      const batch = createBatch({
        columnOperations: [{ type: 'rename', oldName: 'old_name', newName: 'new_name' }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" RENAME COLUMN "old_name" TO "new_name";')
    })

    it('should change column type', () => {
      const batch = createBatch({
        columnOperations: [{ type: 'set_type', columnName: 'amount', newType: 'numeric(10,2)' }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" ALTER COLUMN "amount" TYPE numeric(10,2);')
    })

    it('should change column type with USING', () => {
      const batch = createBatch({
        columnOperations: [
          {
            type: 'set_type',
            columnName: 'status',
            newType: 'integer',
            using: 'status::integer'
          }
        ]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('USING status::integer')
    })

    it('should set column nullable', () => {
      const batch = createBatch({
        columnOperations: [{ type: 'set_nullable', columnName: 'name', nullable: true }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;')
    })

    it('should set column NOT NULL', () => {
      const batch = createBatch({
        columnOperations: [{ type: 'set_nullable', columnName: 'name', nullable: false }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;')
    })

    it('should set default value', () => {
      const batch = createBatch({
        columnOperations: [{ type: 'set_default', columnName: 'status', defaultValue: "'active'" }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe(
        'ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT \'active\';'
      )
    })

    it('should drop default value', () => {
      const batch = createBatch({
        columnOperations: [{ type: 'set_default', columnName: 'status', defaultValue: null }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;')
    })

    it('should set column comment', () => {
      const batch = createBatch({
        columnOperations: [
          { type: 'set_comment', columnName: 'email', comment: 'User email address' }
        ]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('COMMENT ON COLUMN')
      expect(results[0].sql).toContain("'User email address'")
    })

    it('should remove column comment', () => {
      const batch = createBatch({
        columnOperations: [{ type: 'set_comment', columnName: 'email', comment: null }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('IS NULL')
    })
  })

  describe('constraint operations', () => {
    it('should add constraint', () => {
      const batch = createBatch({
        constraintOperations: [
          {
            type: 'add_constraint',
            constraint: {
              id: 'uq-1',
              type: 'unique',
              name: 'uq_email',
              columns: ['email']
            }
          }
        ]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('ADD CONSTRAINT "uq_email" UNIQUE ("email")')
    })

    it('should drop constraint', () => {
      const batch = createBatch({
        constraintOperations: [{ type: 'drop_constraint', name: 'old_constraint' }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" DROP CONSTRAINT "old_constraint";')
    })

    it('should drop constraint with CASCADE', () => {
      const batch = createBatch({
        constraintOperations: [{ type: 'drop_constraint', name: 'old_constraint', cascade: true }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('CASCADE')
    })

    it('should rename constraint', () => {
      const batch = createBatch({
        constraintOperations: [
          { type: 'rename_constraint', oldName: 'old_name', newName: 'new_name' }
        ]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" RENAME CONSTRAINT "old_name" TO "new_name";')
    })
  })

  describe('index operations', () => {
    it('should create index', () => {
      const batch = createBatch({
        indexOperations: [
          {
            type: 'create_index',
            index: {
              id: 'idx-1',
              name: 'idx_name',
              columns: [{ name: 'name' }],
              isUnique: false
            }
          }
        ]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('CREATE INDEX')
    })

    it('should drop index', () => {
      const batch = createBatch({
        indexOperations: [{ type: 'drop_index', name: 'old_idx' }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('DROP INDEX')
      expect(results[0].sql).toContain('IF EXISTS')
    })

    it('should drop index concurrently', () => {
      const batch = createBatch({
        indexOperations: [{ type: 'drop_index', name: 'old_idx', concurrent: true }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('CONCURRENTLY')
    })

    it('should rename index', () => {
      const batch = createBatch({
        indexOperations: [{ type: 'rename_index', oldName: 'old_idx', newName: 'new_idx' }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER INDEX "old_idx" RENAME TO "new_idx";')
    })

    it('should reindex', () => {
      const batch = createBatch({
        indexOperations: [{ type: 'reindex', name: 'idx_name' }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('REINDEX INDEX "idx_name";')
    })

    it('should reindex concurrently', () => {
      const batch = createBatch({
        indexOperations: [{ type: 'reindex', name: 'idx_name', concurrent: true }]
      })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('CONCURRENTLY')
    })
  })

  describe('table-level operations', () => {
    it('should rename table', () => {
      const batch = createBatch({ renameTable: 'new_users' })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" RENAME TO "new_users";')
    })

    it('should set schema', () => {
      const batch = createBatch({ setSchema: 'archive' })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toBe('ALTER TABLE "users" SET SCHEMA "archive";')
    })

    it('should set table comment', () => {
      const batch = createBatch({ comment: 'Updated table description' })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('COMMENT ON TABLE')
      expect(results[0].sql).toContain("'Updated table description'")
    })

    it('should remove table comment', () => {
      const batch = createBatch({ comment: null })
      const results = buildAlterTable(batch, 'postgresql')

      expect(results[0].sql).toContain('IS NULL')
    })
  })

  describe('operation ordering', () => {
    it('should execute operations in correct order', () => {
      const batch = createBatch({
        renameTable: 'new_name',
        setSchema: 'new_schema',
        columnOperations: [{ type: 'add', column: createColumn({ name: 'col' }) }],
        constraintOperations: [{ type: 'drop_constraint', name: 'old' }],
        indexOperations: [{ type: 'drop_index', name: 'idx' }],
        comment: 'New comment'
      })
      const results = buildAlterTable(batch, 'postgresql')

      // Rename table should come first
      expect(results[0].sql).toContain('RENAME TO')
      // Then schema
      expect(results[1].sql).toContain('SET SCHEMA')
      // Then columns
      expect(results[2].sql).toContain('ADD COLUMN')
      // Then constraints
      expect(results[3].sql).toContain('DROP CONSTRAINT')
      // Then indexes
      expect(results[4].sql).toContain('DROP INDEX')
      // Finally comment
      expect(results[5].sql).toContain('COMMENT ON TABLE')
    })
  })
})

describe('buildPreviewDDL', () => {
  it('should return same as buildCreateTable.sql', () => {
    const tableDef = createTableDef()
    const preview = buildPreviewDDL(tableDef, 'postgresql')
    const { sql } = buildCreateTable(tableDef, 'postgresql')

    expect(preview).toBe(sql)
  })
})

describe('buildAlterPreviewDDL', () => {
  it('should return array of SQL strings', () => {
    const batch: AlterTableBatch = {
      schema: 'public',
      table: 'users',
      columnOperations: [{ type: 'add', column: createColumn({ name: 'new_col' }) }],
      constraintOperations: [],
      indexOperations: []
    }
    const previews = buildAlterPreviewDDL(batch, 'postgresql')

    expect(previews).toBeInstanceOf(Array)
    expect(previews[0]).toContain('ADD COLUMN')
  })
})

describe('validateTableDefinition', () => {
  it('should return valid for proper table definition', () => {
    const tableDef = createTableDef()
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject missing table name', () => {
    const tableDef = createTableDef({ name: '' })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Table name is required')
  })

  it('should reject whitespace-only table name', () => {
    const tableDef = createTableDef({ name: '   ' })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Table name is required')
  })

  it('should reject table with no columns', () => {
    const tableDef = createTableDef({ columns: [] })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Table must have at least one column')
  })

  it('should reject column without name', () => {
    const tableDef = createTableDef({
      columns: [createColumn({ name: '' })]
    })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('All columns must have a name')
  })

  it('should reject duplicate column names', () => {
    const tableDef = createTableDef({
      columns: [
        createColumn({ id: '1', name: 'duplicate' }),
        createColumn({ id: '2', name: 'duplicate' })
      ]
    })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Duplicate column name: duplicate')
  })

  it('should reject duplicate column names case-insensitively', () => {
    const tableDef = createTableDef({
      columns: [createColumn({ id: '1', name: 'Name' }), createColumn({ id: '2', name: 'name' })]
    })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Duplicate column name: name')
  })

  it('should reject foreign key without referenced table', () => {
    const tableDef = createTableDef({
      constraints: [
        {
          id: 'fk-1',
          type: 'foreign_key',
          columns: ['org_id'],
          referencedColumns: ['id']
        } as ConstraintDefinition
      ]
    })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Foreign key must reference a table')
  })

  it('should reject foreign key without referenced columns', () => {
    const tableDef = createTableDef({
      constraints: [
        {
          id: 'fk-1',
          type: 'foreign_key',
          columns: ['org_id'],
          referencedTable: 'orgs',
          referencedColumns: []
        } as ConstraintDefinition
      ]
    })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Foreign key must reference columns')
  })

  it('should reject foreign key with mismatched column counts', () => {
    const tableDef = createTableDef({
      constraints: [
        {
          id: 'fk-1',
          type: 'foreign_key',
          columns: ['org_id', 'extra_col'],
          referencedTable: 'orgs',
          referencedColumns: ['id']
        } as ConstraintDefinition
      ]
    })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Foreign key column count must match referenced columns')
  })

  it('should collect multiple errors', () => {
    const tableDef = createTableDef({
      name: '',
      columns: []
    })
    const result = validateTableDefinition(tableDef)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })
})
