import { isSilentRoute } from '../use-sound-preference'

describe('isSilentRoute', () => {
  it('returns true for /writing', () => {
    expect(isSilentRoute('/writing')).toBe(true)
  })

  it('returns true for /writing/task-1', () => {
    expect(isSilentRoute('/writing/task-1')).toBe(true)
  })

  it('returns true for /speaking', () => {
    expect(isSilentRoute('/speaking')).toBe(true)
  })

  it('returns true for /speaking/submit', () => {
    expect(isSilentRoute('/speaking/submit')).toBe(true)
  })

  it('returns false for /dashboard', () => {
    expect(isSilentRoute('/dashboard')).toBe(false)
  })

  it('returns false for /reading', () => {
    expect(isSilentRoute('/reading')).toBe(false)
  })

  it('returns false for /', () => {
    expect(isSilentRoute('/')).toBe(false)
  })
})
