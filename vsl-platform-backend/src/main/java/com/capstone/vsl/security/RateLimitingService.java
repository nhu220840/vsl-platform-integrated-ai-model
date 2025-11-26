package com.capstone.vsl.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory rate limiting service backed by Bucket4j.
 * Buckets are stored per key (e.g., IP + route) to throttle abusive clients.
 */
@Service
public class RateLimitingService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Try to consume a single token from the bucket identified by the key.
     *
     * @param key       unique key (usually IP + route)
     * @param bandwidth bandwidth definition to apply if bucket needs to be created
     * @return true if the request is allowed, false otherwise
     */
    public boolean tryConsume(String key, Bandwidth bandwidth) {
        Bucket bucket = buckets.computeIfAbsent(key, ignored ->
                Bucket.builder()
                        .addLimit(bandwidth)
                        .build()
        );
        return bucket.tryConsume(1);
    }
}

