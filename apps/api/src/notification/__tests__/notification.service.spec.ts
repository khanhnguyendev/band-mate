import { NotificationService } from '../notification.service'

const mockResendSend = jest.fn()

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}))

const mockUser = { email: 'test@example.com', name: 'Test User' }

const mockPrisma = {
  user: { findUnique: jest.fn() },
  notificationPreference: { findUnique: jest.fn() },
}

describe('NotificationService', () => {
  let service: NotificationService

  beforeEach(() => {
    // clearAllMocks (not resetAllMocks) to preserve the Resend constructor mock implementation
    jest.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-key'
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.notificationPreference.findUnique.mockResolvedValue(null) // default: all enabled
    mockResendSend.mockResolvedValue({ id: 'email-id' })
    service = new NotificationService(mockPrisma as any)
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
  })

  describe('sendReportReady()', () => {
    it('sends email when preference is enabled (default)', async () => {
      await service.sendReportReady('user-1', 'report-1', 'writing', 7)
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Writing'),
        }),
      )
    })

    it('skips email when emailReportReady is false', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailReportReady: false,
        emailStreakReminder: true,
      })
      await service.sendReportReady('user-1', 'report-1', 'writing', 7)
      expect(mockResendSend).not.toHaveBeenCalled()
    })

    it('skips email when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      await service.sendReportReady('user-1', 'report-1', 'writing', 7)
      expect(mockResendSend).not.toHaveBeenCalled()
    })

    it('includes band score in email html', async () => {
      await service.sendReportReady('user-1', 'report-1', 'speaking', 6.5)
      const callArgs = mockResendSend.mock.calls[0][0]
      expect(callArgs.html).toContain('6.5')
    })
  })

  describe('sendStreakReminder()', () => {
    it('sends reminder when preference is enabled', async () => {
      await service.sendStreakReminder('user-1', 5)
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('streak'),
        }),
      )
    })

    it('skips reminder when emailStreakReminder is false', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailReportReady: true,
        emailStreakReminder: false,
      })
      await service.sendStreakReminder('user-1', 3)
      expect(mockResendSend).not.toHaveBeenCalled()
    })

    it('mentions current streak in email when > 0', async () => {
      await service.sendStreakReminder('user-1', 7)
      const callArgs = mockResendSend.mock.calls[0][0]
      expect(callArgs.html).toContain('7-day streak')
    })
  })

  describe('when RESEND_API_KEY is missing', () => {
    it('suppresses send silently', async () => {
      delete process.env.RESEND_API_KEY
      service = new NotificationService(mockPrisma as any)
      await service.sendReportReady('user-1', 'report-1', 'writing', 7)
      expect(mockResendSend).not.toHaveBeenCalled()
    })
  })
})
