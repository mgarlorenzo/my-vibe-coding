package com.example.employeemanager.application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePaging {
    private Integer offset;
    private Integer limit;
    
    public int getOffset() {
        return offset != null ? offset : 0;
    }
    
    public int getLimit() {
        return limit != null ? limit : 100;
    }
}
