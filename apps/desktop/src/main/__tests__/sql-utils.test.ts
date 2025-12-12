import { describe, it, expect } from 'vitest'
import { quoteIdentifier } from '../sql-utils'

describe('quoteIdentifier', () => {
  describe('PostgreSQL style (double quotes)', () => {
    const quote = '"'

    it('should quote simple identifiers', () => {
      expect(quoteIdentifier('users', quote)).toBe('"users"')
      expect(quoteIdentifier('id', quote)).toBe('"id"')
      expect(quoteIdentifier('created_at', quote)).toBe('"created_at"')
    })

    it('should escape embedded double quotes by doubling', () => {
      expect(quoteIdentifier('user"name', quote)).toBe('"user""name"')
      expect(quoteIdentifier('a"b"c', quote)).toBe('"a""b""c"')
    })

    it('should handle identifiers with special characters', () => {
      expect(quoteIdentifier('user name', quote)).toBe('"user name"')
      expect(quoteIdentifier('table-name', quote)).toBe('"table-name"')
      expect(quoteIdentifier('123numbers', quote)).toBe('"123numbers"')
    })

    it('should handle reserved words', () => {
      expect(quoteIdentifier('select', quote)).toBe('"select"')
      expect(quoteIdentifier('from', quote)).toBe('"from"')
      expect(quoteIdentifier('table', quote)).toBe('"table"')
    })

    it('should handle empty string', () => {
      expect(quoteIdentifier('', quote)).toBe('""')
    })
  })

  describe('MySQL style (backticks)', () => {
    const quote = '`'

    it('should quote simple identifiers', () => {
      expect(quoteIdentifier('users', quote)).toBe('`users`')
      expect(quoteIdentifier('id', quote)).toBe('`id`')
      expect(quoteIdentifier('created_at', quote)).toBe('`created_at`')
    })

    it('should escape embedded backticks by doubling', () => {
      expect(quoteIdentifier('user`name', quote)).toBe('`user``name`')
      expect(quoteIdentifier('a`b`c', quote)).toBe('`a``b``c`')
    })

    it('should handle identifiers with special characters', () => {
      expect(quoteIdentifier('user name', quote)).toBe('`user name`')
      expect(quoteIdentifier('table-name', quote)).toBe('`table-name`')
    })
  })

  describe('MSSQL style (square brackets)', () => {
    const quote = '['

    it('should quote simple identifiers', () => {
      expect(quoteIdentifier('users', quote)).toBe('[users]')
      expect(quoteIdentifier('id', quote)).toBe('[id]')
      expect(quoteIdentifier('created_at', quote)).toBe('[created_at]')
    })

    it('should escape embedded right brackets by doubling', () => {
      expect(quoteIdentifier('user]name', quote)).toBe('[user]]name]')
      expect(quoteIdentifier('a]b]c', quote)).toBe('[a]]b]]c]')
    })

    it('should handle identifiers with special characters', () => {
      expect(quoteIdentifier('user name', quote)).toBe('[user name]')
      expect(quoteIdentifier('table-name', quote)).toBe('[table-name]')
    })

    it('should handle left brackets without escaping', () => {
      // Left brackets don't need escaping in MSSQL
      expect(quoteIdentifier('user[name', quote)).toBe('[user[name]')
    })
  })
})
