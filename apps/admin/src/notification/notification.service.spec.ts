import { Test, TestingModule } from '@nestjs/testing'
import { NotificationType } from '@libs/prisma'
import { CreateNotificationRequestDto } from './dto/notification-create-request.dto'
import { NotificationPaginationRequestDto } from './dto/notification-pagination-request.dto'
import { NotificationRepository } from './notification.repository'
import { NotificationService } from './notification.service'

describe('NotificationService', () => {
    let service: NotificationService

    const mockRepository = {
        create: jest.fn(),
        findNotificationsOffset: jest.fn()
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

    describe('createNotification', () => {
        it('should create notification successfully', async () => {
            const dto: CreateNotificationRequestDto = {
                title: 'Test',
                content: 'Test Content',
                type: NotificationType.SYSTEM
            }

            mockRepository.create.mockResolvedValue({})

            await service.createNotification(dto)

            expect(mockRepository.create).toHaveBeenCalledWith({
                userId: undefined,
                title: dto.title,
                content: dto.content,
                type: dto.type
            })
        })
    })

    describe('getNotifications', () => {
        it('should return list of notifications', async () => {
            const dto: NotificationPaginationRequestDto = {
                page: 1,
                size: 10,
                order: 'desc'
            }

            const mockData = {
                totalCount: 1,
                items: [
                    {
                        id: 1,
                        userId: null,
                        adminId: null,
                        title: 'Test',
                        content: 'Content',
                        type: NotificationType.SYSTEM,
                        createdAt: new Date(),
                        createdBy: 1
                    }
                ]
            }

            mockRepository.findNotificationsOffset.mockResolvedValue(mockData)

            const result = await service.getNotifications(dto)

            expect(result.data).toHaveLength(1)
            expect(result.meta.totalCount).toBe(1)
            expect(mockRepository.findNotificationsOffset).toHaveBeenCalledWith({
                pagination: { page: dto.page, size: dto.size, order: dto.order },
                searchCondition: { userId: dto.userId, type: dto.type, keyword: dto.keyword }
            })
        })
    })
})
