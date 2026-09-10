package com.aac.malmoa.api;

import com.aac.malmoa.recommendation.GeminiClient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {
    private final JdbcTemplate jdbcTemplate;
    private final GeminiClient geminiClient;

    public HealthController(JdbcTemplate jdbcTemplate, GeminiClient geminiClient) {
        this.jdbcTemplate = jdbcTemplate;
        this.geminiClient = geminiClient;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "malmoa-personalization-api");
    }

    @GetMapping("/health/ready")
    public Map<String, Object> readiness() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("service", "malmoa-personalization-api");
        result.put("database", databaseReady() ? "ok" : "error");
        result.put("geminiConfigured", geminiClient.isConfigured());
        result.put("geminiModel", geminiClient.model());
        return result;
    }

    private boolean databaseReady() {
        try {
            Integer value = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return value != null && value == 1;
        } catch (Exception ignored) {
            return false;
        }
    }
}
