import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { searchIndiaCatalog, type IndiaCatalogRow } from './infowaySymbolCatalog'

const sampleRows: IndiaCatalogRow[] = [
  { code: 'INFY.IN', localSymbol: 'INFY', name: 'Infosys Ltd', isIndex: false },
  { code: 'NIFTY.IN', localSymbol: 'NIFTY', name: 'Nifty 50', isIndex: true },
  { code: 'TCS.IN', localSymbol: 'TCS', name: 'Tata Consultancy', isIndex: false },
]

describe('India symbol catalog search', () => {
  it('filters indices by default and paginates', () => {
    const page = searchIndiaCatalog(sampleRows, { offset: 0, limit: 1 })
    assert.equal(page.total, 2)
    assert.equal(page.items.length, 1)
    assert.equal(page.items[0]?.localSymbol, 'INFY')
  })

  it('matches company names', () => {
    const page = searchIndiaCatalog(sampleRows, { q: 'tata', offset: 0, limit: 10, stocksOnly: true })
    assert.equal(page.total, 1)
    assert.equal(page.items[0]?.localSymbol, 'TCS')
  })
})
