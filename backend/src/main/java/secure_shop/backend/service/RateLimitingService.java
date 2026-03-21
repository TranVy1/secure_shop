package secure_shop.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimitingService {

    private final StringRedisTemplate redisTemplate;

    /**
     * Fixed window rate limiter using Redis.
     *
     * @param key    The unique key (e.g., action + IP)
     * @param limit  Max allowed requests in the given window
     * @param window Time window duration
     * @return true if allowed, false if limit exceeded
     */
    public boolean checkRateLimit(String key, int limit, Duration window) {
        Long currentCount = redisTemplate.opsForValue().increment(key);
        if (currentCount != null) {
            if (currentCount == 1) {
                redisTemplate.expire(key, window);
            }
            return currentCount <= limit;
        }
        return false;
    }
}
