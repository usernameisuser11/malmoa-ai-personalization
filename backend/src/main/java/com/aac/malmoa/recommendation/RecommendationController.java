package com.aac.malmoa.recommendation;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import static com.aac.malmoa.recommendation.RecommendationDtos.*;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService service;
    public RecommendationController(RecommendationService service) { this.service = service; }

    @PostMapping("/personalized")
    public Result personalized(@Valid @RequestBody Request request) { return service.personalized(request); }

    @PostMapping("/baseline")
    public Result baseline(@Valid @RequestBody Request request) { return service.baseline(request); }

    @PostMapping("/compare")
    public Comparison compare(@Valid @RequestBody Request request) { return service.compare(request); }
}
