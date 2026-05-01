import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SupabaseAuthGuard } from '../supabase-auth.guard'

const mockGetUser = jest.fn()
const mockSupabaseService = { getUser: mockGetUser }
const mockReflector = { getAllAndOverride: jest.fn().mockReturnValue(false) }

function makeContext(token?: string): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        headers: token ? { authorization: `Bearer ${token}` } : {},
        user: undefined,
      }),
    }),
  } as unknown as ExecutionContext
}

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard

  beforeEach(() => {
    jest.clearAllMocks()
    guard = new SupabaseAuthGuard(mockSupabaseService as any, mockReflector as any)
  })

  it('allows @Public() routes without token', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true)
    await expect(guard.canActivate(makeContext())).resolves.toBe(true)
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('throws 401 when no Authorization header', async () => {
    await expect(guard.canActivate(makeContext())).rejects.toThrow(UnauthorizedException)
  })

  it('throws 401 when token is invalid', async () => {
    mockGetUser.mockResolvedValue(null)
    await expect(guard.canActivate(makeContext('bad-token'))).rejects.toThrow(UnauthorizedException)
  })

  it('throws 401 with email message when email not verified (AC-2)', async () => {
    mockGetUser.mockResolvedValue({ id: 'uuid', email_confirmed_at: null })
    await expect(guard.canActivate(makeContext('valid-token'))).rejects.toThrow(
      'Please verify your email before logging in',
    )
  })

  it('attaches user to request when token is valid and email verified (AC-5, AC-6)', async () => {
    const user = { id: 'uuid', email_confirmed_at: '2026-01-01T00:00:00Z' }
    mockGetUser.mockResolvedValue(user)
    const ctx = makeContext('valid-token')
    const request = ctx.switchToHttp().getRequest()
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(request.user).toEqual(user)
  })
})
