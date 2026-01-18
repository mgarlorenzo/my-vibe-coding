package com.example.employeemanager.infrastructure.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class WebSocketConfig {
    // WebSocket configuration for GraphQL subscriptions is handled by Spring GraphQL auto-configuration
    // The websocket endpoint is configured in application.yml: spring.graphql.websocket.path=/graphql
}
