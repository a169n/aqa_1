import { env } from '../config/env';

const apiServerUrl = `http://localhost:${env.PORT}`;
const bearerAuth = [{ bearerAuth: [] }];

const schemaRef = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (items: Record<string, unknown>) => ({ type: 'array', items });
const json = (schema: Record<string, unknown>) => ({ 'application/json': { schema } });
const ok = (description: string, schema: Record<string, unknown>) => ({
  description,
  content: json(schema),
});
const noContent = (description: string) => ({ description });
const error = (description: string) => ok(description, schemaRef('ErrorResponse'));
const idParam = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer' },
});

const authErrors = {
  '401': error('Authentication required'),
};

const adminErrors = {
  ...authErrors,
  '403': error('Admin access required'),
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Inkwell Platform API',
    version: '1.0.0',
    description:
      'API documentation for the server workspace. It covers public, authenticated, workspace, moderation, taxonomy, and admin endpoints.',
  },
  servers: [{ url: apiServerUrl, description: 'Local development server' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Posts' },
    { name: 'Taxonomy' },
    { name: 'Workspace' },
    { name: 'Bookmarks' },
    { name: 'Reports' },
    { name: 'Profile' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: { message: { type: 'string', example: 'Authentication required.' } },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'user'] },
          avatarUrl: { type: 'string', nullable: true },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          slug: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          slug: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthSession: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: schemaRef('User'),
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
        properties: { refreshToken: { type: 'string' } },
      },
      LogoutRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
      CreatePostRequest: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          excerpt: { type: 'string', nullable: true },
          categoryId: { type: 'integer', nullable: true },
          tagIds: arrayOf({ type: 'integer' }),
        },
      },
      UpdatePostRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          excerpt: { type: 'string', nullable: true },
          categoryId: { type: 'integer', nullable: true },
          tagIds: arrayOf({ type: 'integer' }),
        },
      },
      CommentRequest: {
        type: 'object',
        required: ['content'],
        properties: { content: { type: 'string' } },
      },
      ReportRequest: {
        type: 'object',
        required: ['reason'],
        properties: {
          postId: { type: 'integer', nullable: true },
          commentId: { type: 'integer', nullable: true },
          reason: { type: 'string' },
        },
      },
      UpdateReportRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['open', 'resolved', 'dismissed'] },
          resolutionNote: { type: 'string', nullable: true },
        },
      },
      NameRequest: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
      UpdateProfileRequest: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      UpdateUserRoleRequest: {
        type: 'object',
        required: ['role'],
        properties: { role: { type: 'string', enum: ['admin', 'user'] } },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          content: { type: 'string' },
          postId: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          author: schemaRef('User'),
        },
      },
      CommentWithPost: {
        allOf: [
          schemaRef('Comment'),
          {
            type: 'object',
            properties: {
              post: {
                type: 'object',
                properties: { id: { type: 'integer' }, title: { type: 'string' } },
              },
            },
          },
        ],
      },
      Like: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          postId: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          user: schemaRef('User'),
        },
      },
      LikeWithPost: {
        allOf: [
          schemaRef('Like'),
          {
            type: 'object',
            properties: {
              post: {
                type: 'object',
                properties: { id: { type: 'integer' }, title: { type: 'string' } },
              },
            },
          },
        ],
      },
      PostSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          content: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          excerpt: { type: 'string', nullable: true },
          authorId: { type: 'integer' },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          archivedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          author: schemaRef('User'),
          category: { allOf: [schemaRef('Category')], nullable: true },
          tags: arrayOf(schemaRef('Tag')),
          isBookmarked: { type: 'boolean' },
          commentsCount: { type: 'integer' },
          likesCount: { type: 'integer' },
          viewerHasLiked: { type: 'boolean' },
          viewerLikeId: { type: 'integer', nullable: true },
        },
      },
      PostDetail: {
        allOf: [
          schemaRef('PostSummary'),
          { type: 'object', properties: { comments: arrayOf(schemaRef('Comment')) } },
        ],
      },
      BookmarkRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          postId: { type: 'integer' },
          userId: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Bookmark: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          post: schemaRef('PostSummary'),
        },
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          reason: { type: 'string' },
          status: { type: 'string', enum: ['open', 'resolved', 'dismissed'] },
          reporterId: { type: 'integer' },
          postId: { type: 'integer', nullable: true },
          commentId: { type: 'integer', nullable: true },
          resolutionNote: { type: 'string', nullable: true },
          resolvedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          reporter: schemaRef('User'),
          resolvedBy: { allOf: [schemaRef('User')], nullable: true },
          post: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer' },
              title: { type: 'string' },
              status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            },
          },
          comment: {
            type: 'object',
            nullable: true,
            properties: { id: { type: 'integer' }, content: { type: 'string' } },
          },
        },
      },
      Profile: {
        allOf: [
          schemaRef('User'),
          {
            type: 'object',
            properties: {
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              posts: arrayOf(schemaRef('PostDetail')),
              comments: arrayOf(schemaRef('CommentWithPost')),
            },
          },
        ],
      },
      AdminUser: {
        allOf: [
          schemaRef('User'),
          {
            type: 'object',
            properties: {
              createdAt: { type: 'string', format: 'date-time' },
              postsCount: { type: 'integer' },
              commentsCount: { type: 'integer' },
              likesCount: { type: 'integer' },
            },
          },
        ],
      },
      HealthResponse: {
        type: 'object',
        properties: { status: { type: 'string', example: 'ok' } },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': ok('Server is healthy', schemaRef('HealthResponse')) },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: { required: true, content: json(schemaRef('RegisterRequest')) },
        responses: {
          '201': ok('Registered successfully', schemaRef('AuthSession')),
          '400': error('Email and password are required'),
          '409': error('User already exists'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        requestBody: { required: true, content: json(schemaRef('LoginRequest')) },
        responses: {
          '200': ok('Authenticated successfully', schemaRef('AuthSession')),
          '401': error('Invalid credentials'),
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh tokens',
        requestBody: { required: true, content: json(schemaRef('RefreshTokenRequest')) },
        responses: {
          '200': ok('Tokens refreshed', schemaRef('AuthSession')),
          '400': error('Refresh token is required'),
          '401': error('Refresh token is invalid or expired'),
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        requestBody: { required: true, content: json(schemaRef('LogoutRequest')) },
        responses: { '204': noContent('Logged out') },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: bearerAuth,
        responses: {
          '200': ok('Authenticated user', schemaRef('User')),
          '401': error('Missing or invalid token'),
        },
      },
    },
    '/api/posts': {
      get: {
        tags: ['Posts'],
        summary: 'List posts',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['draft', 'published', 'archived'] },
          },
          { name: 'categoryId', in: 'query', schema: { type: 'integer' } },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'authorId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': ok('Posts list', arrayOf(schemaRef('PostSummary'))) },
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a draft post',
        security: bearerAuth,
        requestBody: { required: true, content: json(schemaRef('CreatePostRequest')) },
        responses: {
          '201': ok('Created post', schemaRef('PostDetail')),
          ...authErrors,
          '400': error('Validation failed'),
        },
      },
    },
    '/api/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Get a single post',
        parameters: [idParam('id', 'Post ID')],
        responses: {
          '200': ok('Post details', schemaRef('PostDetail')),
          '404': error('Post not found'),
        },
      },
      put: {
        tags: ['Posts'],
        summary: 'Update a post',
        security: bearerAuth,
        parameters: [idParam('id', 'Post ID')],
        requestBody: { required: true, content: json(schemaRef('UpdatePostRequest')) },
        responses: {
          '200': ok('Updated post', schemaRef('PostDetail')),
          ...authErrors,
          '400': error('Validation failed'),
          '403': error('No permission to update'),
          '404': error('Post not found'),
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete a post',
        security: bearerAuth,
        parameters: [idParam('id', 'Post ID')],
        responses: {
          '204': noContent('Deleted'),
          ...authErrors,
          '403': error('No permission to delete'),
          '404': error('Post not found'),
        },
      },
    },
    '/api/posts/{id}/publish': {
      post: {
        tags: ['Posts'],
        summary: 'Publish a post',
        security: bearerAuth,
        parameters: [idParam('id', 'Post ID')],
        responses: {
          '200': ok('Published post', schemaRef('PostDetail')),
          ...authErrors,
          '403': error('No permission to publish'),
          '404': error('Post not found'),
        },
      },
    },
    '/api/posts/{id}/archive': {
      post: {
        tags: ['Posts'],
        summary: 'Archive a post',
        security: bearerAuth,
        parameters: [idParam('id', 'Post ID')],
        responses: {
          '200': ok('Archived post', schemaRef('PostDetail')),
          ...authErrors,
          '403': error('No permission to archive'),
          '404': error('Post not found'),
        },
      },
    },
    '/api/posts/{id}/restore': {
      post: {
        tags: ['Posts'],
        summary: 'Restore an archived post to draft',
        security: bearerAuth,
        parameters: [idParam('id', 'Post ID')],
        responses: {
          '200': ok('Restored post', schemaRef('PostDetail')),
          ...authErrors,
          '403': error('No permission to restore'),
          '404': error('Post not found'),
        },
      },
    },
    '/api/posts/{postId}/comments': {
      post: {
        tags: ['Posts'],
        summary: 'Add a comment to a post',
        security: bearerAuth,
        parameters: [idParam('postId', 'Post ID')],
        requestBody: { required: true, content: json(schemaRef('CommentRequest')) },
        responses: {
          '201': ok('Created comment', schemaRef('Comment')),
          ...authErrors,
          '400': error('Comment content is required'),
          '403': error('Action available only for published posts'),
          '404': error('Post not found'),
        },
      },
    },
    '/api/posts/comments/{id}': {
      delete: {
        tags: ['Posts'],
        summary: 'Delete a comment',
        security: bearerAuth,
        parameters: [idParam('id', 'Comment ID')],
        responses: {
          '204': noContent('Deleted'),
          ...authErrors,
          '403': error('No permission to delete'),
          '404': error('Comment not found'),
        },
      },
    },
    '/api/posts/{postId}/likes': {
      post: {
        tags: ['Posts'],
        summary: 'Like a post',
        security: bearerAuth,
        parameters: [idParam('postId', 'Post ID')],
        responses: {
          '201': ok('Like created', schemaRef('Like')),
          ...authErrors,
          '403': error('Action available only for published posts'),
          '404': error('Post not found'),
          '409': error('You have already liked this post'),
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Remove a like from a post',
        security: bearerAuth,
        parameters: [idParam('postId', 'Post ID')],
        responses: { '204': noContent('Deleted'), ...authErrors, '404': error('Like not found') },
      },
    },
    '/api/posts/{id}/bookmarks': {
      post: {
        tags: ['Bookmarks'],
        summary: 'Bookmark a published post',
        security: bearerAuth,
        parameters: [idParam('id', 'Post ID')],
        responses: {
          '201': ok('Bookmark created or returned if already present', schemaRef('BookmarkRecord')),
          ...authErrors,
          '404': error('Published post not found'),
        },
      },
      delete: {
        tags: ['Bookmarks'],
        summary: 'Remove a bookmark from a post',
        security: bearerAuth,
        parameters: [idParam('id', 'Post ID')],
        responses: {
          '204': noContent('Deleted'),
          ...authErrors,
          '404': error('Bookmark not found'),
        },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Taxonomy'],
        summary: 'List categories',
        responses: { '200': ok('Categories list', arrayOf(schemaRef('Category'))) },
      },
    },
    '/api/tags': {
      get: {
        tags: ['Taxonomy'],
        summary: 'List tags',
        responses: { '200': ok('Tags list', arrayOf(schemaRef('Tag'))) },
      },
    },
    '/api/workspace/posts': {
      get: {
        tags: ['Workspace'],
        summary: 'List current user workspace posts',
        security: bearerAuth,
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['draft', 'published', 'archived'] },
          },
        ],
        responses: {
          '200': ok('Workspace posts', arrayOf(schemaRef('PostSummary'))),
          ...authErrors,
        },
      },
    },
    '/api/bookmarks': {
      get: {
        tags: ['Bookmarks'],
        summary: 'List current user bookmarks',
        security: bearerAuth,
        responses: { '200': ok('Bookmarks list', arrayOf(schemaRef('Bookmark'))), ...authErrors },
      },
    },
    '/api/reports': {
      post: {
        tags: ['Reports'],
        summary: 'Create a moderation report for a published post or comment',
        security: bearerAuth,
        requestBody: { required: true, content: json(schemaRef('ReportRequest')) },
        responses: {
          '201': ok('Created report', schemaRef('Report')),
          ...authErrors,
          '400': error('Report input is invalid'),
          '404': error('Published post or comment not found'),
          '409': error('Open report already exists'),
        },
      },
    },
    '/api/user/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Get current profile',
        security: bearerAuth,
        responses: { '200': ok('Profile details', schemaRef('Profile')), ...authErrors },
      },
      put: {
        tags: ['Profile'],
        summary: 'Update current profile',
        security: bearerAuth,
        requestBody: { required: true, content: json(schemaRef('UpdateProfileRequest')) },
        responses: {
          '200': ok('Updated user', schemaRef('User')),
          ...authErrors,
          '400': error('Name and email are required'),
          '409': error('Another user already uses this email'),
        },
      },
    },
    '/api/user/profile/avatar': {
      post: {
        tags: ['Profile'],
        summary: 'Upload avatar',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: { avatar: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          '200': ok('Updated user', schemaRef('User')),
          ...authErrors,
          '400': error('Avatar image is required'),
          '413': error('Avatar image must be 5MB or smaller'),
        },
      },
    },
    '/api/admin/posts': {
      get: {
        tags: ['Admin'],
        summary: 'List all posts as admin',
        security: bearerAuth,
        responses: { '200': ok('Posts list', arrayOf(schemaRef('PostSummary'))), ...adminErrors },
      },
    },
    '/api/admin/posts/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update any post as admin',
        security: bearerAuth,
        parameters: [idParam('id', 'Post ID')],
        requestBody: { required: true, content: json(schemaRef('UpdatePostRequest')) },
        responses: {
          '200': ok('Updated post', schemaRef('PostDetail')),
          ...adminErrors,
          '400': error('Validation failed'),
          '404': error('Post not found'),
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete any post as admin',
        security: bearerAuth,
        parameters: [idParam('id', 'Post ID')],
        responses: { '204': noContent('Deleted'), ...adminErrors, '404': error('Post not found') },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users as admin',
        security: bearerAuth,
        responses: { '200': ok('Users list', arrayOf(schemaRef('AdminUser'))), ...adminErrors },
      },
    },
    '/api/admin/users/{id}/role': {
      put: {
        tags: ['Admin'],
        summary: 'Update a user role',
        security: bearerAuth,
        parameters: [idParam('id', 'User ID')],
        requestBody: { required: true, content: json(schemaRef('UpdateUserRoleRequest')) },
        responses: {
          '200': ok('Updated user', schemaRef('User')),
          ...adminErrors,
          '400': error('Invalid role or last admin demotion is forbidden'),
          '404': error('User not found'),
        },
      },
    },
    '/api/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user',
        security: bearerAuth,
        parameters: [idParam('id', 'User ID')],
        responses: {
          '204': noContent('Deleted'),
          ...adminErrors,
          '400': error('Last admin deletion is forbidden'),
          '404': error('User not found'),
        },
      },
    },
    '/api/admin/comments': {
      get: {
        tags: ['Admin'],
        summary: 'List comments as admin',
        security: bearerAuth,
        responses: {
          '200': ok('Comments list', arrayOf(schemaRef('CommentWithPost'))),
          ...adminErrors,
        },
      },
    },
    '/api/admin/comments/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a comment as admin',
        security: bearerAuth,
        parameters: [idParam('id', 'Comment ID')],
        responses: {
          '204': noContent('Deleted'),
          ...adminErrors,
          '404': error('Comment not found'),
        },
      },
    },
    '/api/admin/likes': {
      get: {
        tags: ['Admin'],
        summary: 'List likes as admin',
        security: bearerAuth,
        responses: { '200': ok('Likes list', arrayOf(schemaRef('LikeWithPost'))), ...adminErrors },
      },
    },
    '/api/admin/likes/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a like as admin',
        security: bearerAuth,
        parameters: [idParam('id', 'Like ID')],
        responses: { '204': noContent('Deleted'), ...adminErrors, '404': error('Like not found') },
      },
    },
    '/api/admin/reports': {
      get: {
        tags: ['Admin'],
        summary: 'List moderation reports',
        security: bearerAuth,
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['open', 'resolved', 'dismissed'] },
          },
        ],
        responses: { '200': ok('Reports list', arrayOf(schemaRef('Report'))), ...adminErrors },
      },
    },
    '/api/admin/reports/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Update report status or resolution',
        security: bearerAuth,
        parameters: [idParam('id', 'Report ID')],
        requestBody: { required: true, content: json(schemaRef('UpdateReportRequest')) },
        responses: {
          '200': ok('Updated report', schemaRef('Report')),
          ...adminErrors,
          '400': error('Invalid report status'),
          '404': error('Report not found'),
        },
      },
    },
    '/api/admin/categories': {
      get: {
        tags: ['Admin'],
        summary: 'List categories as admin',
        security: bearerAuth,
        responses: { '200': ok('Categories list', arrayOf(schemaRef('Category'))), ...adminErrors },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create a category',
        security: bearerAuth,
        requestBody: { required: true, content: json(schemaRef('NameRequest')) },
        responses: {
          '201': ok('Created category', schemaRef('Category')),
          ...adminErrors,
          '400': error('Category name is required'),
          '409': error('Category with this name already exists'),
        },
      },
    },
    '/api/admin/categories/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update a category',
        security: bearerAuth,
        parameters: [idParam('id', 'Category ID')],
        requestBody: { required: true, content: json(schemaRef('NameRequest')) },
        responses: {
          '200': ok('Updated category', schemaRef('Category')),
          ...adminErrors,
          '400': error('Category input is invalid'),
          '404': error('Category not found'),
          '409': error('Category with this name already exists'),
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a category',
        security: bearerAuth,
        parameters: [idParam('id', 'Category ID')],
        responses: {
          '204': noContent('Deleted'),
          ...adminErrors,
          '404': error('Category not found'),
        },
      },
    },
    '/api/admin/tags': {
      get: {
        tags: ['Admin'],
        summary: 'List tags as admin',
        security: bearerAuth,
        responses: { '200': ok('Tags list', arrayOf(schemaRef('Tag'))), ...adminErrors },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create a tag',
        security: bearerAuth,
        requestBody: { required: true, content: json(schemaRef('NameRequest')) },
        responses: {
          '201': ok('Created tag', schemaRef('Tag')),
          ...adminErrors,
          '400': error('Tag name is required'),
          '409': error('Tag with this name already exists'),
        },
      },
    },
    '/api/admin/tags/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update a tag',
        security: bearerAuth,
        parameters: [idParam('id', 'Tag ID')],
        requestBody: { required: true, content: json(schemaRef('NameRequest')) },
        responses: {
          '200': ok('Updated tag', schemaRef('Tag')),
          ...adminErrors,
          '400': error('Tag input is invalid'),
          '404': error('Tag not found'),
          '409': error('Tag with this name already exists'),
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a tag',
        security: bearerAuth,
        parameters: [idParam('id', 'Tag ID')],
        responses: { '204': noContent('Deleted'), ...adminErrors, '404': error('Tag not found') },
      },
    },
  },
};
