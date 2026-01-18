package com.example.employeemanager;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureHttpGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.test.tester.HttpGraphQlTester;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureHttpGraphQlTester
class GraphQLIntegrationTest {
    
    @Autowired
    private HttpGraphQlTester graphQlTester;
    
    @Test
    void shouldQueryEmployees() {
        graphQlTester.document("""
                query {
                    employees(paging: {offset: 0, limit: 10}) {
                        items {
                            id
                            companyId
                            firstName
                            lastName
                            email
                        }
                        totalCount
                        hasNextPage
                    }
                }
                """)
                .execute()
                .path("employees.items")
                .entityList(Object.class)
                .hasSizeGreaterThan(0);
    }
    
    @Test
    void shouldQuerySingleEmployee() {
        graphQlTester.document("""
                query {
                    employee(id: 1) {
                        id
                        companyId
                        firstName
                        lastName
                        email
                        updatedAt
                    }
                }
                """)
                .execute()
                .path("employee.id")
                .entity(String.class)
                .isEqualTo("1");
    }
    
    @Test
    void shouldCreateEmployee() {
        graphQlTester.document("""
                mutation {
                    createEmployee(input: {
                        companyId: 1
                        firstName: "Test"
                        lastName: "User"
                        email: "test.user@example.com"
                        country: "Spain"
                    }) {
                        id
                        companyId
                        firstName
                        lastName
                        email
                        updatedAt
                        creationDate
                    }
                }
                """)
                .execute()
                .path("createEmployee.firstName")
                .entity(String.class)
                .isEqualTo("Test")
                .path("createEmployee.updatedAt")
                .entity(String.class)
                .satisfies(updatedAt -> assertThat(updatedAt).isNotNull());
    }
    
    @Test
    void shouldUpdateEmployee() {
        // First create an employee
        var createResult = graphQlTester.document("""
                mutation {
                    createEmployee(input: {
                        companyId: 1
                        firstName: "Update"
                        lastName: "Test"
                        email: "update.test@example.com"
                    }) {
                        id
                    }
                }
                """)
                .execute()
                .path("createEmployee.id")
                .entity(String.class)
                .get();
        
        // Then update it
        graphQlTester.document("""
                mutation UpdateEmployee($id: ID!) {
                    updateEmployee(id: $id, input: {
                        lastName: "Updated"
                        email: "updated.email@example.com"
                    }) {
                        id
                        lastName
                        email
                        updatedAt
                    }
                }
                """)
                .variable("id", createResult)
                .execute()
                .path("updateEmployee.lastName")
                .entity(String.class)
                .isEqualTo("Updated")
                .path("updateEmployee.email")
                .entity(String.class)
                .isEqualTo("updated.email@example.com");
    }
    
    @Test
    void shouldTerminateEmployee() {
        // First create an employee
        var createResult = graphQlTester.document("""
                mutation {
                    createEmployee(input: {
                        companyId: 1
                        firstName: "Terminate"
                        lastName: "Test"
                    }) {
                        id
                    }
                }
                """)
                .execute()
                .path("createEmployee.id")
                .entity(String.class)
                .get();
        
        // Then terminate it
        graphQlTester.document("""
                mutation TerminateEmployee($id: ID!) {
                    terminateEmployee(id: $id, input: {
                        terminationReason: "Voluntary resignation"
                        terminationReasonType: "VOLUNTARY"
                        terminationObservations: "Left for new opportunity"
                    }) {
                        id
                        terminationDate
                        terminationReason
                        terminationReasonType
                        terminationObservations
                    }
                }
                """)
                .variable("id", createResult)
                .execute()
                .path("terminateEmployee.terminationReason")
                .entity(String.class)
                .isEqualTo("Voluntary resignation")
                .path("terminateEmployee.terminationDate")
                .entity(String.class)
                .satisfies(date -> assertThat(date).isNotNull());
    }
    
    @Test
    void shouldUnterminateEmployee() {
        // First create and terminate an employee
        var createResult = graphQlTester.document("""
                mutation {
                    createEmployee(input: {
                        companyId: 1
                        firstName: "Unterminate"
                        lastName: "Test"
                    }) {
                        id
                    }
                }
                """)
                .execute()
                .path("createEmployee.id")
                .entity(String.class)
                .get();
        
        // Terminate
        graphQlTester.document("""
                mutation TerminateEmployee($id: ID!) {
                    terminateEmployee(id: $id, input: {
                        terminationReason: "Test termination"
                    }) {
                        id
                    }
                }
                """)
                .variable("id", createResult)
                .execute();
        
        // Then unterminate
        graphQlTester.document("""
                mutation UnterminateEmployee($id: ID!) {
                    unterminateEmployee(id: $id) {
                        id
                        terminationDate
                        unterminationDate
                    }
                }
                """)
                .variable("id", createResult)
                .execute()
                .path("unterminateEmployee.terminationDate")
                .valueIsNull()
                .path("unterminateEmployee.unterminationDate")
                .entity(String.class)
                .satisfies(date -> assertThat(date).isNotNull());
    }
    
    @Test
    void shouldFilterEmployeesBySearchTerm() {
        graphQlTester.document("""
                query {
                    employees(filter: {searchTerm: "Maria"}, paging: {offset: 0, limit: 10}) {
                        items {
                            id
                            firstName
                            lastName
                        }
                        totalCount
                    }
                }
                """)
                .execute()
                .path("employees.items[0].firstName")
                .entity(String.class)
                .isEqualTo("Maria");
    }
    
    @Test
    void shouldPaginateEmployees() {
        graphQlTester.document("""
                query {
                    employees(paging: {offset: 0, limit: 2}) {
                        items {
                            id
                        }
                        totalCount
                        hasNextPage
                    }
                }
                """)
                .execute()
                .path("employees.items")
                .entityList(Object.class)
                .hasSize(2)
                .path("employees.hasNextPage")
                .entity(Boolean.class)
                .isEqualTo(true);
    }
    
    @Test
    void shouldSortEmployees() {
        graphQlTester.document("""
                query {
                    employees(sorting: {field: "first_name", direction: "ASC"}, paging: {offset: 0, limit: 100}) {
                        items {
                            firstName
                        }
                    }
                }
                """)
                .execute()
                .path("employees.items")
                .entityList(Object.class)
                .hasSizeGreaterThan(0);
    }
}
