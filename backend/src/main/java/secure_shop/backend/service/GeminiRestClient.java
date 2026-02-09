package secure_shop.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Direct REST client for Google Gemini API
 * Free tier: 1500 requests/day with gemini-pro model
 */
@Service
@Slf4j
public class GeminiRestClient {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-pro}")
    private String model;

    @Value("${gemini.api.temperature:0.2}")
    private double temperature;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s";

    /**
     * Generate AI response from Gemini
     * 
     * @param systemPrompt System context/instructions
     * @param userMessage  User's message
     * @return AI generated response
     */
    public String generate(String systemPrompt, String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key not configured");
            return null;
        }

        try {
            String url = String.format(GEMINI_API_URL, model, apiKey);

            // Build request body for Gemini API
            // Combine system prompt and user message into single content
            String combinedPrompt = systemPrompt + "\n\nUser: " + userMessage;

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "parts", List.of(
                                            Map.of("text", combinedPrompt)))),
                    "generationConfig", Map.of(
                            "temperature", temperature,
                            "maxOutputTokens", 1000));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("Calling Gemini API with model: {}", model);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // Parse Gemini response
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");

                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

                    if (parts != null && !parts.isEmpty()) {
                        String text = (String) parts.get(0).get("text");
                        log.info("Gemini API response received successfully");
                        return text;
                    }
                }
            }

            log.warn("Unexpected Gemini API response format");
            return null;

        } catch (Exception ex) {
            log.error("Gemini API call failed", ex);
            return null;
        }
    }

    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }
}
