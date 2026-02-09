package secure_shop.backend.config;

import org.springframework.context.annotation.Configuration;

/**
 * Chat configuration - no longer needed with direct Gemini REST client
 * Keeping file for compatibility but can be removed
 */
@Configuration
public class ChatConfig {
    // Direct GeminiRestClient is now injected via @Service
    // No bean configuration needed
}
