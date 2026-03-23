package secure_shop.backend.config.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import secure_shop.backend.security.jwt.JwtService;

import java.security.Principal;

/**
 * Intercepts STOMP CONNECT frames to authenticate via JWT.
 * Extracts the Bearer token from the "Authorization" header,
 * validates it, and sets the Principal (userId) on the session.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String userId = jwtService.getSubject(token);
                    log.info("WebSocket STOMP authenticated user: {}", userId);
                    accessor.setUser(new StompPrincipal(userId));
                } catch (Exception e) {
                    log.warn("WebSocket STOMP authentication failed: {}", e.getMessage());
                }
            }
        }
        return message;
    }

    /**
     * Simple Principal implementation that wraps the user ID string.
     */
    private record StompPrincipal(String name) implements Principal {
        @Override
        public String getName() {
            return name;
        }
    }
}
