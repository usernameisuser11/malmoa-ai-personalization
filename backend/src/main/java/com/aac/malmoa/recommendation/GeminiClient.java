package com.aac.malmoa.recommendation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.*;

@Component
public class GeminiClient {
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiClient(ObjectMapper objectMapper,
                        @Value("${app.gemini.base-url}") String baseUrl,
                        @Value("${app.gemini.api-key}") String apiKey,
                        @Value("${app.gemini.model}") String model) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
        this.model = model;
    }

    public List<String> generateSentences(String prompt) {
        if (apiKey == null || apiKey.isBlank()) return List.of();
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.35,
                        "candidateCount", 1,
                        "responseMimeType", "application/json"
                )
        );
        try {
            String raw = restClient.post()
                    .uri("/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            if (raw == null) return List.of();
            JsonNode response = objectMapper.readTree(raw);
            String text = response.at("/candidates/0/content/parts/0/text").asText("");
            if (text.isBlank()) return List.of();
            JsonNode json = objectMapper.readTree(stripFence(text));
            JsonNode sentences = json.isArray() ? json : json.path("sentences");
            List<String> result = new ArrayList<>();
            if (sentences.isArray()) {
                sentences.forEach(node -> {
                    String value = node.asText("").trim();
                    if (!value.isBlank()) result.add(value);
                });
            }
            return result.stream().limit(6).toList();
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private String stripFence(String text) {
        String t = text.trim();
        if (t.startsWith("```")) {
            int firstNewLine = t.indexOf('\n');
            int lastFence = t.lastIndexOf("```");
            if (firstNewLine >= 0 && lastFence > firstNewLine) t = t.substring(firstNewLine + 1, lastFence).trim();
        }
        return t;
    }
}
