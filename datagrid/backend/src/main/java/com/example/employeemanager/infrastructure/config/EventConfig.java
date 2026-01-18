package com.example.employeemanager.infrastructure.config;

import com.example.employeemanager.domain.EmployeeEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Sinks;

@Configuration
public class EventConfig {
    
    @Bean
    public Sinks.Many<EmployeeEvent> employeeEventSink() {
        return Sinks.many().multicast().onBackpressureBuffer();
    }
}
