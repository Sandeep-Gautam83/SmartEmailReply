package com.email.service;

import com.email.repo.EmailRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;
    private final String apiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public EmailGeneratorService(WebClient.Builder webClientBuilder,
                                 @Value("${gemini.api.url}") String baseUrl,
                                 @Value("${gemini.api.key}") String geminiApiKey) {
        this.apiKey = geminiApiKey;
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    }

    public String generateEmailReply(EmailRequest emailRequest) {
        try {
            // ✅ Build JSON request body safely
            Map<String, Object> body = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", buildPrompt(emailRequest));

            Map<String, Object> content = new HashMap<>();
            content.put("parts", new Object[]{part});

            body.put("contents", new Object[]{content});

            // ✅ Call Gemini API
            String response = webClient.post()
                    .uri("/v1beta/models/gemini-2.5-flash:generateContent")
                    .header("X-goog-api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(
                            status -> status.isError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> {
                                        return Mono.error(new RuntimeException("Gemini API Error: " + errorBody));
                                    })
                    )
                    .bodyToMono(String.class)
                    .block();

            // ✅ Parse Gemini response
            return extractResponseContent(response);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI Service error: " + e.getMessage(), e);
        }
    }

    private String extractResponseContent(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);

            JsonNode candidates = root.path("candidates");
            if (candidates.isMissingNode() || !candidates.isArray() || candidates.size() == 0) {
                throw new RuntimeException("No candidates found in Gemini response: " + response);
            }

            return candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText("⚠️ No text generated");

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage(), e);
        }
    }

    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate a professional email reply for the following email.\n");

        if (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty()) {
            prompt.append("Use a ").append(emailRequest.getTone()).append(" tone.\n\n");
        }

        prompt.append("Original Email:\n").append(emailRequest.getEmailContent());
        return prompt.toString();
    }
}
