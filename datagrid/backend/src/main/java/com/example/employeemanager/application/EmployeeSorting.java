package com.example.employeemanager.application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSorting {
    private String field;
    private String direction;
    
    public String getField() {
        return field != null ? field : "id";
    }
    
    public String getDirection() {
        return direction != null ? direction : "ASC";
    }
}
