package com.aac.malmoa.recommendation;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/{userId}/personalization-context")
public class PersonalizationContextController {
    private final PersonalizationContextService service;

    public PersonalizationContextController(PersonalizationContextService service) {
        this.service = service;
    }

    @GetMapping
    public PersonalizationContextService.Snapshot get(@PathVariable Long userId) {
        return service.snapshot(userId);
    }
}
