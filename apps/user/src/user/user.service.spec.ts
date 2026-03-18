import { BaseException, USER_ERROR } from '@libs/common'
import { UserStatus } from '@libs/prisma'
import { Test, TestingModule } from '@nestjs/testing'
import { UserResponseDto } from './dto/user-response.dto'
import { UserUpdateDto } from './dto/user-update.dto'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

describe('UserService', () => {
    let service: UserService

    const mockRepository = {
        findById: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserService, { provide: UserRepository, useValue: mockRepository }]
        }).compile()

        service = module.get<UserService>(UserService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('getMe', () => {
        it('should return user info', async () => {
            const userId = 1
            const user = {
                id: userId,
                email: 'test@example.com',
                name: 'Test User',
                status: UserStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            mockRepository.findById.mockResolvedValue(user)

            const result = await service.getMe(userId)

            expect(mockRepository.findById).toHaveBeenCalledWith(userId)
            expect(result).toBeInstanceOf(UserResponseDto)
            expect(result.id).toBe(user.id)
        })

        it('should throw exception if user not found', async () => {
            const userId = 1

            mockRepository.findById.mockResolvedValue(null)

            await expect(service.getMe(userId)).rejects.toThrow(BaseException)
            await expect(service.getMe(userId)).rejects.toThrow(USER_ERROR.NOT_FOUND.message)
        })
    })

    describe('updateMe', () => {
        it('should update user info', async () => {
            const userId = 1
            const updateDto: UserUpdateDto = {
                email: 'updated@example.com',
                phone: '01012345678'
            }
            const user = {
                id: userId,
                email: 'test@example.com',
                name: 'Test User'
            }
            const updatedUser = {
                ...user,
                ...updateDto
            }

            mockRepository.findById.mockResolvedValue(user)
            mockRepository.update.mockResolvedValue(updatedUser)

            await service.updateMe(userId, updateDto)

            expect(mockRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockRepository.update).toHaveBeenCalledWith(userId, updateDto)
        })

        it('should throw exception if user not found', async () => {
            const userId = 1
            const updateDto: UserUpdateDto = {
                email: 'updated@example.com',
                phone: '01012345678'
            }

            mockRepository.findById.mockResolvedValue(null)

            await expect(service.updateMe(userId, updateDto)).rejects.toThrow(BaseException)
            await expect(service.updateMe(userId, updateDto)).rejects.toThrow(USER_ERROR.NOT_FOUND.message)
        })
    })

    describe('withdraw', () => {
        it('should successfully withdraw user', async () => {
            const userId = 1
            const user = {
                id: userId,
                email: 'test@example.com',
                name: 'Test User',
                status: UserStatus.ACTIVE,
                isDeleted: false,
                deletedAt: null,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            mockRepository.findById.mockResolvedValue(user)
            mockRepository.softDelete.mockResolvedValue({ ...user, status: UserStatus.WITHDRAWN, isDeleted: true })

            await service.withdraw(userId)

            expect(mockRepository.findById).toHaveBeenCalledWith(userId)
            expect(mockRepository.softDelete).toHaveBeenCalledWith(userId)
        })

        it('should throw exception if user not found', async () => {
            const userId = 1

            mockRepository.findById.mockResolvedValue(null)

            await expect(service.withdraw(userId)).rejects.toThrow(BaseException)
            await expect(service.withdraw(userId)).rejects.toThrow(USER_ERROR.NOT_FOUND.message)
        })

        it('should throw exception if user is already deleted', async () => {
            const userId = 1
            const deletedUser = {
                id: userId,
                email: 'test@example.com',
                name: 'Test User',
                status: UserStatus.ACTIVE,
                isDeleted: true,
                deletedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }

            mockRepository.findById.mockResolvedValue(deletedUser)

            await expect(service.withdraw(userId)).rejects.toThrow(BaseException)
            await expect(service.withdraw(userId)).rejects.toThrow(USER_ERROR.ALREADY_DELETED.message)
        })
    })
})
