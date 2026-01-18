package com.example.employeemanager.application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeFilter {
    private String searchTerm;
    private Long companyId;
    private Boolean includeTerminated;
}
