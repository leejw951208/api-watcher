import { BaseException, CreateResponseDto, CursorResponseDto, OffsetResponseDto, POST_ERROR } from '@libs/common'
import { PostStatus } from '@libs/prisma'
import { Test, TestingModule } from '@nestjs/testing'
import { PostCreateDto } from './dto/post-create.dto'
import { PostCursorRequestDto } from './dto/post-cursor-request.dto'
import { PostOffsetRequestDto } from './dto/post-offset-request.dto'
import { PostResponseDto } from './dto/post-response.dto'
import { PostUpdateDto } from './dto/post-update.dto'
import { PostRepository } from './post.repository'
import { PostService } from './post.service'

describe('PostService', () => {
    let service: PostService

    const mockRepository = {
        create: jest.fn(),
        findByIdAndUserId: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        incrementViewCount: jest.fn(),
        findPostsOffset: jest.fn(),
        findPostsCursor: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PostService, { provide: PostRepository, useValue: mockRepository }]
        }).compile()

        service = module.get<PostService>(PostService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('savePost', () => {
        it('should create a post and return CreateResponseDto', async () => {
            const userId = 1
            const reqDto: PostCreateDto = {
                title: 'Test Title',
                content: 'Test Content',
                status: PostStatus.PUBLISHED
            }
            const createdPost = {
                id: 1,
                ...reqDto,
                userId,
                viewCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            mockRepository.create.mockResolvedValue(createdPost)

            const result = await service.savePost(userId, reqDto)

            expect(mockRepository.create).toHaveBeenCalledWith({
                userId,
                title: reqDto.title,
                content: reqDto.content,
                status: reqDto.status
            })
            expect(result).toBeInstanceOf(CreateResponseDto)
            expect(result.data).toBe(createdPost.id)
        })
    })

    describe('getPost', () => {
        it('should return a post', async () => {
            const userId = 1
            const postId = 1
            const post = {
                id: postId,
                title: 'Test Title',
                content: 'Test Content',
                userId,
                status: PostStatus.PUBLISHED,
                viewCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false
            }

            mockRepository.findByIdAndUserId.mockResolvedValue(post)

            const result = await service.getPost(userId, postId)

            expect(mockRepository.findByIdAndUserId).toHaveBeenCalledWith(postId, userId)
            expect(result).toBeInstanceOf(PostResponseDto)
        })

        it('should throw exception if post not found', async () => {
            const userId = 1
            const postId = 1

            mockRepository.findByIdAndUserId.mockResolvedValue(null)

            await expect(service.getPost(userId, postId)).rejects.toThrow(BaseException)
            await expect(service.getPost(userId, postId)).rejects.toThrow(POST_ERROR.NOT_FOUND.message)
        })
    })

    describe('updatePost', () => {
        it('should update a post', async () => {
            const userId = 1
            const postId = 1
            const reqDto: PostUpdateDto = {
                title: 'Updated Title'
            }
            const post = {
                id: postId,
                userId
            }

            mockRepository.findByIdAndUserId.mockResolvedValue(post)
            mockRepository.update.mockResolvedValue({ ...post, ...reqDto })

            await service.updatePost(userId, postId, reqDto)

            expect(mockRepository.findByIdAndUserId).toHaveBeenCalledWith(postId, userId)
            expect(mockRepository.update).toHaveBeenCalledWith(post.id, reqDto)
        })

        it('should throw exception if post not found', async () => {
            const userId = 1
            const postId = 1
            const reqDto: PostUpdateDto = { title: 'Updated Title' }

            mockRepository.findByIdAndUserId.mockResolvedValue(null)

            await expect(service.updatePost(userId, postId, reqDto)).rejects.toThrow(BaseException)
            await expect(service.updatePost(userId, postId, reqDto)).rejects.toThrow(POST_ERROR.NOT_FOUND.message)
        })
    })

    describe('deletePost', () => {
        it('should soft delete a post', async () => {
            const userId = 1
            const postId = 1
            const post = {
                id: postId,
                userId
            }

            mockRepository.findByIdAndUserId.mockResolvedValue(post)
            mockRepository.softDelete.mockResolvedValue(post)

            await service.deletePost(userId, postId)

            expect(mockRepository.findByIdAndUserId).toHaveBeenCalledWith(postId, userId)
            expect(mockRepository.softDelete).toHaveBeenCalledWith(post.id)
        })

        it('should throw exception if post not found', async () => {
            const userId = 1
            const postId = 1

            mockRepository.findByIdAndUserId.mockResolvedValue(null)

            await expect(service.deletePost(userId, postId)).rejects.toThrow(BaseException)
            await expect(service.deletePost(userId, postId)).rejects.toThrow(POST_ERROR.NOT_FOUND.message)
        })
    })

    describe('getPostsOffset', () => {
        it('should return paginated posts', async () => {
            const query: PostOffsetRequestDto = {
                page: 1,
                size: 10,
                order: 'desc',
                title: ''
            }
            const posts = [
                {
                    id: 1,
                    title: 'Test Title',
                    content: 'Test Content',
                    userId: 1,
                    status: PostStatus.PUBLISHED,
                    viewCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false
                }
            ]
            const totalCount = 1

            mockRepository.findPostsOffset.mockResolvedValue({ items: posts, totalCount })

            const result = await service.getPostsOffset(query)

            expect(mockRepository.findPostsOffset).toHaveBeenCalledWith(query, undefined)
            expect(result).toBeInstanceOf(OffsetResponseDto)
            expect(result.data[0]).toBeInstanceOf(PostResponseDto)
            expect(result.meta.totalCount).toBe(totalCount)
        })

        it('should return my posts when userId is provided', async () => {
            const userId = 1
            const query: PostOffsetRequestDto = {
                page: 1,
                size: 10,
                order: 'desc',
                title: ''
            }
            const posts = [
                {
                    id: 1,
                    title: 'Test Title',
                    content: 'Test Content',
                    userId,
                    status: PostStatus.PUBLISHED,
                    viewCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false
                }
            ]
            const totalCount = 1

            mockRepository.findPostsOffset.mockResolvedValue({ items: posts, totalCount })

            const result = await service.getPostsOffset(query, userId)

            expect(mockRepository.findPostsOffset).toHaveBeenCalledWith(query, userId)
            expect(result).toBeInstanceOf(OffsetResponseDto)
            expect(result.data[0]).toBeInstanceOf(PostResponseDto)
            expect(result.meta.totalCount).toBe(totalCount)
        })
    })

    describe('getPostsCursor', () => {
        it('should return cursor paginated posts', async () => {
            const query: PostCursorRequestDto = {
                lastCursor: undefined,
                size: 10,
                order: 'desc',
                title: ''
            }
            const posts = [
                {
                    id: 1,
                    title: 'Test Title',
                    content: 'Test Content',
                    userId: 1,
                    status: PostStatus.PUBLISHED,
                    viewCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false
                }
            ]
            const nextCursor = 1

            mockRepository.findPostsCursor.mockResolvedValue({ items: posts, nextCursor })

            const result = await service.getPostsCursor(query)

            expect(mockRepository.findPostsCursor).toHaveBeenCalledWith(query, undefined)
            expect(result).toBeInstanceOf(CursorResponseDto)
            expect(result.data[0]).toBeInstanceOf(PostResponseDto)
            expect(result.meta.nextCursor).toBe(nextCursor)
        })

        it('should return my cursor paginated posts when userId is provided', async () => {
            const userId = 1
            const query: PostCursorRequestDto = {
                lastCursor: undefined,
                size: 10,
                order: 'desc',
                title: ''
            }
            const posts = [
                {
                    id: 1,
                    title: 'Test Title',
                    content: 'Test Content',
                    userId,
                    status: PostStatus.PUBLISHED,
                    viewCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false
                }
            ]
            const nextCursor = 1

            mockRepository.findPostsCursor.mockResolvedValue({ items: posts, nextCursor })

            const result = await service.getPostsCursor(query, userId)

            expect(mockRepository.findPostsCursor).toHaveBeenCalledWith(query, userId)
            expect(result).toBeInstanceOf(CursorResponseDto)
            expect(result.data[0]).toBeInstanceOf(PostResponseDto)
            expect(result.meta.nextCursor).toBe(nextCursor)
        })
    })
})
