/**
 * SQL Statement Splitter
 *
 * Shared implementation for splitting SQL into individual statements,
 * respecting string literals, quoted identifiers, and comments.
 *
 * Uses configuration to handle database-specific syntax:
 * - PostgreSQL: dollar-quoted strings, nested block comments
 * - MySQL: backtick identifiers, backslash escapes, # comments
 * - MSSQL: bracket identifiers
 */

import type { DatabaseType } from '@shared/index'

/**
 * Configuration for database-specific parsing behavior
 */
export interface SqlParserConfig {
  /** Support dollar-quoted strings like $$...$$ or $tag$...$tag$ (PostgreSQL) */
  dollarQuotes: boolean
  /** Support nested block comments (PostgreSQL) */
  nestedBlockComments: boolean
  /** Support backtick-quoted identifiers (MySQL) */
  backtickIdentifiers: boolean
  /** Support backslash escape in strings like \' (MySQL) */
  backslashEscape: boolean
  /** Support # as line comment (MySQL) */
  hashLineComment: boolean
  /** Support bracket-quoted identifiers like [...] (MSSQL) */
  bracketIdentifiers: boolean
}

/**
 * Pre-defined configurations for each database type
 */
export const SQL_PARSER_CONFIGS: Record<DatabaseType, SqlParserConfig> = {
  postgresql: {
    dollarQuotes: true,
    nestedBlockComments: true,
    backtickIdentifiers: false,
    backslashEscape: false,
    hashLineComment: false,
    bracketIdentifiers: false
  },
  mysql: {
    dollarQuotes: false,
    nestedBlockComments: false,
    backtickIdentifiers: true,
    backslashEscape: true,
    hashLineComment: true,
    bracketIdentifiers: false
  },
  mssql: {
    dollarQuotes: false,
    nestedBlockComments: false,
    backtickIdentifiers: false,
    backslashEscape: false,
    hashLineComment: false,
    bracketIdentifiers: true
  },
  sqlite: {
    dollarQuotes: false,
    nestedBlockComments: false,
    backtickIdentifiers: true,
    backslashEscape: false,
    hashLineComment: false,
    bracketIdentifiers: true
  }
}

/**
 * Split SQL into individual statements, respecting string literals and comments.
 *
 * @param sql - The SQL text to split
 * @param dbType - Database type for dialect-specific parsing
 * @returns Array of individual SQL statements (without trailing semicolons)
 */
export function splitStatements(sql: string, dbType: DatabaseType): string[] {
  const config = SQL_PARSER_CONFIGS[dbType]
  const statements: string[] = []
  let current = ''
  let i = 0

  while (i < sql.length) {
    const char = sql[i]
    const nextChar = sql[i + 1]

    // Handle single-quoted strings
    if (char === "'") {
      current += char
      i++
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          // Escaped single quote (standard SQL)
          current += "''"
          i += 2
        } else if (config.backslashEscape && sql[i] === '\\' && sql[i + 1] === "'") {
          // MySQL backslash escape
          current += "\\'"
          i += 2
        } else if (sql[i] === "'") {
          current += "'"
          i++
          break
        } else {
          current += sql[i]
          i++
        }
      }
      continue
    }

    // Handle double-quoted identifiers/strings
    if (char === '"') {
      current += char
      i++
      while (i < sql.length) {
        if (sql[i] === '"' && sql[i + 1] === '"') {
          // Escaped double quote
          current += '""'
          i += 2
        } else if (sql[i] === '"') {
          current += '"'
          i++
          break
        } else {
          current += sql[i]
          i++
        }
      }
      continue
    }

    // Handle backtick-quoted identifiers (MySQL)
    if (config.backtickIdentifiers && char === '`') {
      current += char
      i++
      while (i < sql.length) {
        if (sql[i] === '`' && sql[i + 1] === '`') {
          current += '``'
          i += 2
        } else if (sql[i] === '`') {
          current += '`'
          i++
          break
        } else {
          current += sql[i]
          i++
        }
      }
      continue
    }

    // Handle bracket-quoted identifiers (MSSQL)
    if (config.bracketIdentifiers && char === '[') {
      current += char
      i++
      while (i < sql.length) {
        if (sql[i] === ']' && sql[i + 1] === ']') {
          current += ']]'
          i += 2
        } else if (sql[i] === ']') {
          current += ']'
          i++
          break
        } else {
          current += sql[i]
          i++
        }
      }
      continue
    }

    // Handle dollar-quoted strings (PostgreSQL)
    if (config.dollarQuotes && char === '$') {
      // Find the tag (e.g., $tag$ or $$)
      let tag = '$'
      let j = i + 1
      while (j < sql.length && (sql[j].match(/[a-zA-Z0-9_]/) || sql[j] === '$')) {
        tag += sql[j]
        if (sql[j] === '$') {
          j++
          break
        }
        j++
      }
      if (tag.endsWith('$') && tag.length >= 2) {
        // Valid dollar quote tag
        current += tag
        i = j
        // Find closing tag
        const closeIdx = sql.indexOf(tag, i)
        if (closeIdx !== -1) {
          current += sql.substring(i, closeIdx + tag.length)
          i = closeIdx + tag.length
        } else {
          // No closing tag, consume rest
          current += sql.substring(i)
          i = sql.length
        }
        continue
      }
    }

    // Handle hash line comments (MySQL)
    if (config.hashLineComment && char === '#') {
      current += '#'
      i++
      while (i < sql.length && sql[i] !== '\n') {
        current += sql[i]
        i++
      }
      continue
    }

    // Handle line comments (--)
    if (char === '-' && nextChar === '-') {
      current += '--'
      i += 2
      while (i < sql.length && sql[i] !== '\n') {
        current += sql[i]
        i++
      }
      continue
    }

    // Handle block comments (/* */)
    if (char === '/' && nextChar === '*') {
      current += '/*'
      i += 2
      if (config.nestedBlockComments) {
        // PostgreSQL: track nesting depth
        let depth = 1
        while (i < sql.length && depth > 0) {
          if (sql[i] === '/' && sql[i + 1] === '*') {
            current += '/*'
            depth++
            i += 2
          } else if (sql[i] === '*' && sql[i + 1] === '/') {
            current += '*/'
            depth--
            i += 2
          } else {
            current += sql[i]
            i++
          }
        }
      } else {
        // Standard: no nesting support
        while (i < sql.length) {
          if (sql[i] === '*' && sql[i + 1] === '/') {
            current += '*/'
            i += 2
            break
          } else {
            current += sql[i]
            i++
          }
        }
      }
      continue
    }

    // Statement separator
    if (char === ';') {
      const stmt = current.trim()
      if (stmt) {
        statements.push(stmt)
      }
      current = ''
      i++
      continue
    }

    current += char
    i++
  }

  // Don't forget the last statement (without trailing semicolon)
  const lastStmt = current.trim()
  if (lastStmt) {
    statements.push(lastStmt)
  }

  return statements
}

/**
 * Create a database-specific statement splitter function.
 * Useful for creating a bound function without passing dbType each time.
 *
 * @param dbType - Database type
 * @returns A function that splits SQL statements for that database type
 */
export function createStatementSplitter(dbType: DatabaseType): (sql: string) => string[] {
  return (sql: string) => splitStatements(sql, dbType)
}
