import { BaseException, NOTIFICATION_ERROR } from '@libs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { NotificationCursorRequestDto } from './dto/notification-cursor-request.dto'
import { NotificationRepository } from './notification.repository'
import { NotificationService } from './notification.service'

describe('NotificationService', () => {
    let service: NotificationService

    const mockRepository = {
        findNotificationsCursor: jest.fn(),
        findReadsByNotificationIds: jest.fn(),
        findByIdForUser: jest.fn(),
        findReadByNotificationId: jest.fn(),
        createRead: jest.fn(),
        findUnreadNotificationIds: jest.fn(),
        createManyReads: jest.fn(),
        softDelete: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NotificationService, { provide: NotificationRepository, useValue: mockRepository }]
        }).compile()

        service = module.get<NotificationService>(NotificationService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('getMyNotifications', () => {
        const userId = 1
        const searchCondition: NotificationCursorRequestDto = {
            size: 10,
            order: 'desc',
            lastCursor: undefined,
            isRead: undefined,
            type: undefined
        }

        it('should return notifications with read status', async () => {
            const mockItems = [
                { id: 1, userId: 1, title: 'Test 1', content: 'Content 1', type: 'SYSTEM', createdAt: new Date() },
                { id: 2, userId: 1, title: 'Test 2', content: 'Content 2', type: 'SYSTEM', createdAt: new Date() }
            ]
            const mockReads = [{ notificationId: 1, createdAt: new Date() }]

            mockRepository.findNotificationsCursor.mockResolvedValue({ items: mockItems, nextCursor: null })
            mockRepository.findReadsByNotificationIds.mockResolvedValue(mockReads)

            const result = await service.getMyNotifications(searchCondition, userId)

            expect(result.data).toHaveLength(2)
            expect(result.data[0].isRead).toBe(true)
            expect(result.data[1].isRead).toBe(false)
            expect(mockRepository.findNotificationsCursor).toHaveBeenCalledWith(searchCondition, userId)
            expect(mockRepository.findReadsByNotificationIds).toHaveBeenCalledWith(userId, [1, 2])
        })

        it('should return empty array when no notifications', async () => {
            mockRepository.findNotificationsCursor.mockResolvedValue({ items: [], nextCursor: null })
            mockRepository.findReadsByNotificationIds.mockResolvedValue([])

            const result = await service.getMyNotifications(searchCondition, userId)

            expect(result.data).toHaveLength(0)
        })
    })

    describe('getNotification', () => {
        const userId = 1
        const notificationId = 1

        it('should return notification with read status', async () => {
            const mockNotification = { id: 1, userId: 1, title: 'Test', content: 'Content', type: 'SYSTEM', isDeleted: false }
            const mockRead = { notificationId: 1, createdAt: new Date() }

            mockRepository.findByIdForUser.mockResolvedValue(mockNotification)
            mockRepository.findReadByNotificationId.mockResolvedValue(mockRead)

            const result = await service.getNotification(userId, notificationId)

            expect(result.isRead).toBe(true)
            expect(result.readAt).toBeDefined()
        })

        it('should return unread notification', async () => {
            const mockNotification = { id: 1, userId: 1, title: 'Test', content: 'Content', type: 'SYSTEM', isDeleted: false }

            mockRepository.findByIdForUser.mockResolvedValue(mockNotification)
            mockRepository.findReadByNotificationId.mockResolvedValue(null)

            const result = await service.getNotification(userId, notificationId)

            expect(result.isRead).toBe(false)
            expect(result.readAt).toBeNull()
        })

        it('should throw exception if notification not found', async () => {
            mockRepository.findByIdForUser.mockResolvedValue(null)

            await expect(service.getNotification(userId, 999)).rejects.toThrow(BaseException)
            await expect(service.getNotification(userId, 999)).rejects.toThrow(NOTIFICATION_ERROR.NOT_FOUND.message)
        })
    })

    describe('readNotification', () => {
        const userId = 1
        const notificationId = 1

        it('should create notification read record', async () => {
            const mockNotification = { id: 1, userId: 1, title: 'Test', content: 'Content', isDeleted: false }

            mockRepository.findByIdForUser.mockResolvedValue(mockNotification)
            mockRepository.findReadByNotificationId.mockResolvedValue(null)
            mockRepository.createRead.mockResolvedValue({})

            await service.readNotification(userId, notificationId)

            expect(mockRepository.createRead).toHaveBeenCalledWith(userId, notificationId)
        })

        it('should not create duplicate read record', async () => {
            const mockNotification = { id: 1, userId: 1, title: 'Test', content: 'Content', isDeleted: false }
            const existingRead = { userId, notificationId, createdAt: new Date() }

            mockRepository.findByIdForUser.mockResolvedValue(mockNotification)
            mockRepository.findReadByNotificationId.mockResolvedValue(existingRead)

            await service.readNotification(userId, notificationId)

            expect(mockRepository.createRead).not.toHaveBeenCalled()
        })

        it('should throw exception if notification not found', async () => {
            mockRepository.findByIdForUser.mockResolvedValue(null)

            await expect(service.readNotification(userId, 999)).rejects.toThrow(BaseException)
            await expect(service.readNotification(userId, 999)).rejects.toThrow(NOTIFICATION_ERROR.NOT_FOUND.message)
        })
    })

    describe('readAllNotifications', () => {
        const userId = 1

        it('should create read records for all unread notifications', async () => {
            const unreadNotificationIds = [1, 2, 3]

            mockRepository.findUnreadNotificationIds.mockResolvedValue(unreadNotificationIds)
            mockRepository.createManyReads.mockResolvedValue({ count: 3 })

            await service.readAllNotifications(userId)

            expect(mockRepository.createManyReads).toHaveBeenCalledWith(userId, unreadNotificationIds)
        })

        it('should not create any records when all notifications are read', async () => {
            mockRepository.findUnreadNotificationIds.mockResolvedValue([])

            await service.readAllNotifications(userId)

            expect(mockRepository.createManyReads).not.toHaveBeenCalled()
        })
    })

    describe('deleteNotification', () => {
        const userId = 1
        const notificationId = 1

        it('should soft delete notification', async () => {
            const mockNotification = { id: 1, userId: 1, title: 'Test', content: 'Content', isDeleted: false }

            mockRepository.findByIdForUser.mockResolvedValue(mockNotification)
            mockRepository.softDelete.mockResolvedValue({})

            await service.deleteNotification(userId, notificationId)

            expect(mockRepository.softDelete).toHaveBeenCalledWith(notificationId)
        })

        it('should throw exception if notification not found', async () => {
            mockRepository.findByIdForUser.mockResolvedValue(null)

            await expect(service.deleteNotification(userId, 999)).rejects.toThrow(BaseException)
            await expect(service.deleteNotification(userId, 999)).rejects.toThrow(NOTIFICATION_ERROR.NOT_FOUND.message)
        })
    })
})
