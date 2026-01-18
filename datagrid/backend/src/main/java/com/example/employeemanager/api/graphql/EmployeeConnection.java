package com.example.employeemanager.api.graphql;

import com.example.employeemanager.domain.Employee;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeConnection {
    private List<Employee> items;
    private int totalCount;
    private boolean hasNextPage;
}
