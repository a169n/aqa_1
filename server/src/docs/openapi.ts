import { env } from '../config/env';

const apiServerUrl = `http://localhost:${env.PORT}`;

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Inkwell Platform API',
    version: '1.0.0',
    description: 'API documentation for the server workspace.',
  },
  servers: [
    {
      url: apiServerUrl,
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Posts' },
    { name: 'Profile' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            example: 'Authentication required.',
          },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'name', 'role', 'avatarUrl'],
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'demo@example.com' },
          name: { type: 'string', example: 'Demo User' },
          role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
          avatarUrl: { type: 'string', nullable: true, example: '/uploads/avatars/demo.png' },
        },
      },
      AuthSession: {
        type: 'object',
        required: ['accessToken', 'refreshToken', 'user'],
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          name: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      LogoutRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      PostRequest: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', example: 'Hello world' },
          content: { type: 'string', example: 'This is my first post.' },
        },
      },
      CommentRequest: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', example: 'Nice post!' },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', example: 'Updated Name' },
          email: { type: 'string', format: 'email', example: 'updated@example.com' },
        },
      },
      UpdateUserRoleRequest: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['admin', 'user'], example: 'admin' },
        },
      },
      Comment: {
        type: 'object',
        required: ['id', 'content', 'postId', 'createdAt', 'updatedAt', 'author'],
        properties: {
          id: { type: 'integer', example: 1 },
          content: { type: 'string', example: 'Thoughtful reply.' },
          postId: { type: 'integer', example: 10 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          author: { $ref: '#/components/schemas/User' },
        },
      },
      CommentWithPost: {
        allOf: [
          { $ref: '#/components/schemas/Comment' },
          {
            type: 'object',
            required: ['post'],
            properties: {
              post: {
                type: 'object',
                required: ['id', 'title'],
                properties: {
                  id: { type: 'integer', example: 10 },
                  title: { type: 'string', example: 'Hello world' },
                },
              },
            },
          },
        ],
      },
      Like: {
        type: 'object',
        required: ['id', 'postId', 'createdAt', 'user'],
        properties: {
          id: { type: 'integer', example: 1 },
          postId: { type: 'integer', example: 10 },
          createdAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      LikeWithPost: {
        allOf: [
          { $ref: '#/components/schemas/Like' },
          {
            type: 'object',
            required: ['post'],
            properties: {
              post: {
                type: 'object',
                required: ['id', 'title'],
                properties: {
                  id: { type: 'integer', example: 10 },
                  title: { type: 'string', example: 'Hello world' },
                },
              },
            },
          },
        ],
      },
      PostSummary: {
        type: 'object',
        required: [
          'id',
          'title',
          'content',
          'authorId',
          'createdAt',
          'updatedAt',
          'author',
          'commentsCount',
          'likesCount',
          'viewerHasLiked',
          'viewerLikeId',
        ],
        properties: {
          id: { type: 'integer', example: 10 },
          title: { type: 'string', example: 'Hello world' },
          content: { type: 'string', example: 'This is my first post.' },
          authorId: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          author: { $ref: '#/components/schemas/User' },
          commentsCount: { type: 'integer', example: 3 },
          likesCount: { type: 'integer', example: 7 },
          viewerHasLiked: { type: 'boolean', example: false },
          viewerLikeId: { type: 'integer', nullable: true, example: null },
        },
      },
      PostDetail: {
        allOf: [
          { $ref: '#/components/schemas/PostSummary' },
          {
            type: 'object',
            properties: {
              comments: {
                type: 'array',
                items: { $ref: '#/components/schemas/Comment' },
              },
            },
          },
        ],
      },
      Profile: {
        allOf: [
          { $ref: '#/components/schemas/User' },
          {
            type: 'object',
            required: ['createdAt', 'updatedAt', 'posts', 'comments'],
            properties: {
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              posts: {
                type: 'array',
                items: { $ref: '#/components/schemas/PostDetail' },
              },
              comments: {
                type: 'array',
                items: { $ref: '#/components/schemas/CommentWithPost' },
              },
            },
          },
        ],
      },
      AdminUser: {
        allOf: [
          { $ref: '#/components/schemas/User' },
          {
            type: 'object',
            required: ['createdAt', 'postsCount', 'commentsCount', 'likesCount'],
            properties: {
              createdAt: { type: 'string', format: 'date-time' },
              postsCount: { type: 'integer', example: 4 },
              commentsCount: { type: 'integer', example: 8 },
              likesCount: { type: 'integer', example: 12 },
            },
          },
        ],
      },
      HealthResponse: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', example: 'ok' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSession' },
              },
            },
          },
          '409': {
            description: 'User already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSession' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tokens refreshed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSession' },
              },
            },
          },
          '401': {
            description: 'Refresh token is invalid or expired',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LogoutRequest' },
            },
          },
        },
        responses: {
          '204': {
            description: 'Logged out',
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '401': {
            description: 'Missing or invalid token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/posts': {
      get: {
        tags: ['Posts'],
        summary: 'List posts',
        responses: {
          '200': {
            description: 'Posts list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PostSummary' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a post',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created post',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PostDetail' },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Get a single post',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: 'Post details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PostDetail' },
              },
            },
          },
          '404': {
            description: 'Post not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Posts'],
        summary: 'Update a post',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated post',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PostDetail' },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'No permission to update',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Post not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete a post',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '204': {
            description: 'Deleted',
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'No permission to delete',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/posts/{postId}/comments': {
      post: {
        tags: ['Posts'],
        summary: 'Add a comment to a post',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CommentRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created comment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Comment' },
              },
            },
          },
        },
      },
    },
    '/api/posts/comments/{id}': {
      delete: {
        tags: ['Posts'],
        summary: 'Delete a comment',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '204': {
            description: 'Deleted',
          },
        },
      },
    },
    '/api/posts/{postId}/likes': {
      post: {
        tags: ['Posts'],
        summary: 'Like a post',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '201': {
            description: 'Like created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Like' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Remove a like from a post',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'postId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '204': {
            description: 'Deleted',
          },
        },
      },
    },
    '/api/user/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Get current profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Profile details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Profile' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Profile'],
        summary: 'Update current profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
    '/api/user/profile/avatar': {
      post: {
        tags: ['Profile'],
        summary: 'Upload avatar',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
    '/api/admin/posts': {
      get: {
        tags: ['Admin'],
        summary: 'List all posts as admin',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Posts list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PostSummary' },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/posts/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update any post as admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated post',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PostDetail' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete any post as admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '204': {
            description: 'Deleted',
          },
        },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users as admin',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Users list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AdminUser' },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/users/{id}/role': {
      put: {
        tags: ['Admin'],
        summary: 'Update a user role',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRoleRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
    '/api/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '204': {
            description: 'Deleted',
          },
        },
      },
    },
    '/api/admin/comments': {
      get: {
        tags: ['Admin'],
        summary: 'List comments as admin',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Comments list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CommentWithPost' },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/comments/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a comment as admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '204': {
            description: 'Deleted',
          },
        },
      },
    },
    '/api/admin/likes': {
      get: {
        tags: ['Admin'],
        summary: 'List likes as admin',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Likes list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/LikeWithPost' },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/likes/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a like as admin',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '204': {
            description: 'Deleted',
          },
        },
      },
    },
  },
} as const;
