package com.example.employeemanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeEvent {
    
    public enum EventType {
        CREATED,
        UPDATED,
        TERMINATED,
        UNTERMINATED
    }
    
    private EventType eventType;
    private Employee employee;
    private Instant timestamp;
    
    public static EmployeeEvent created(Employee employee) {
        return EmployeeEvent.builder()
                .eventType(EventType.CREATED)
                .employee(employee)
                .timestamp(Instant.now())
                .build();
    }
    
    public static EmployeeEvent updated(Employee employee) {
        return EmployeeEvent.builder()
                .eventType(EventType.UPDATED)
                .employee(employee)
                .timestamp(Instant.now())
                .build();
    }
    
    public static EmployeeEvent terminated(Employee employee) {
        return EmployeeEvent.builder()
                .eventType(EventType.TERMINATED)
                .employee(employee)
                .timestamp(Instant.now())
                .build();
    }
    
    public static EmployeeEvent unterminated(Employee employee) {
        return EmployeeEvent.builder()
                .eventType(EventType.UNTERMINATED)
                .employee(employee)
                .timestamp(Instant.now())
                .build();
    }
}
