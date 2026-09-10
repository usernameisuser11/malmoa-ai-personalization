package com.aac.malmoa.api;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(NoSuchElementException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String,String> notFound(NoSuchElementException e) {
        return Map.of("error", "NOT_FOUND", "message", "요청한 데이터를 찾을 수 없습니다.");
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> badRequest(Exception e) {
        return Map.of("error", "BAD_REQUEST", "message", "입력값을 확인해주세요.");
    }
}
