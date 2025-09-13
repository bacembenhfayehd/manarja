import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cacheKey';
export const CACHE_TTL_METADATA = 'cacheTTL';

export const CacheKey = (key: string, ttl: number = 300) => 
  SetMetadata(CACHE_KEY_METADATA, { key, ttl });

// Parameter decorator to build dynamic cache keys
export const CacheParam = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;
    const query = request.query;

    // Build cache key based on context
    const keyParts = [
      'analytics',
      data || 'default',
      user?.id || 'anonymous',
      params?.projectId || 'all-projects',
      query?.dateRange || 'default-range'
    ];

    return keyParts.join(':');
  },
);

// Usage examples:
// @CacheKey('dashboard-kpis', 600) // 10 minutes
// @CacheKey('user-reports', 1800) // 30 minutes
// getDashboard(@CacheParam('dashboard') cacheKey: string)
