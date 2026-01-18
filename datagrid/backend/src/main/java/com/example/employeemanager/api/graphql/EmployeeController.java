package com.example.employeemanager.api.graphql;

import com.example.employeemanager.application.EmployeeFilter;
import com.example.employeemanager.application.EmployeePaging;
import com.example.employeemanager.application.EmployeeService;
import com.example.employeemanager.application.EmployeeSorting;
import com.example.employeemanager.domain.Employee;
import com.example.employeemanager.domain.EmployeeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class EmployeeController {
    
    private final EmployeeService employeeService;
    
    @QueryMapping
    public Mono<EmployeeConnection> employees(
            @Argument EmployeeFilter filter,
            @Argument EmployeePaging paging,
            @Argument EmployeeSorting sorting) {
        
        log.debug("Query employees with filter: {}, paging: {}, sorting: {}", filter, paging, sorting);
        
        return employeeService.findAll(filter, paging, sorting)
                .collectList()
                .zipWith(employeeService.count(filter))
                .map(tuple -> {
                    var items = tuple.getT1();
                    var totalCount = tuple.getT2();
                    int limit = paging != null ? paging.getLimit() : 100;
                    int offset = paging != null ? paging.getOffset() : 0;
                    boolean hasNextPage = offset + items.size() < totalCount;
                    return new EmployeeConnection(items, totalCount.intValue(), hasNextPage);
                });
    }
    
    @QueryMapping
    public Mono<Employee> employee(@Argument Long id) {
        log.debug("Query employee by id: {}", id);
        return employeeService.findById(id);
    }
    
    @MutationMapping
    public Mono<Employee> createEmployee(@Argument("input") Map<String, Object> input) {
        log.debug("Creating employee with input: {}", input);
        Employee employee = mapToEmployee(input);
        return employeeService.create(employee);
    }
    
    @MutationMapping
    public Mono<Employee> updateEmployee(@Argument Long id, @Argument("input") Map<String, Object> input) {
        log.debug("Updating employee {} with input: {}", id, input);
        Employee updates = mapToEmployee(input);
        return employeeService.update(id, updates);
    }
    
    @MutationMapping
    public Mono<Employee> terminateEmployee(@Argument Long id, @Argument("input") Map<String, Object> input) {
        log.debug("Terminating employee {} with input: {}", id, input);
        
        Instant terminationDate = null;
        String reason = null;
        String reasonType = null;
        String observations = null;
        
        if (input != null) {
            if (input.get("terminationDate") != null) {
                terminationDate = parseInstant(input.get("terminationDate"));
            }
            reason = (String) input.get("terminationReason");
            reasonType = (String) input.get("terminationReasonType");
            observations = (String) input.get("terminationObservations");
        }
        
        return employeeService.terminate(id, terminationDate, reason, reasonType, observations);
    }
    
    @MutationMapping
    public Mono<Employee> unterminateEmployee(@Argument Long id, @Argument("date") Object date) {
        log.debug("Unterminating employee {} with date: {}", id, date);
        Instant unterminationDate = date != null ? parseInstant(date) : null;
        return employeeService.unterminate(id, unterminationDate);
    }
    
    @SubscriptionMapping
    public Flux<EmployeeEvent> employeeChanged() {
        log.debug("Subscription to employee changes started");
        return employeeService.subscribeToEvents();
    }
    
    private Employee mapToEmployee(Map<String, Object> input) {
        Employee employee = new Employee();
        
        if (input.get("companyId") != null) {
            employee.setCompanyId(((Number) input.get("companyId")).longValue());
        }
        if (input.get("affiliation") != null) {
            employee.setAffiliation((String) input.get("affiliation"));
        }
        if (input.get("allReporteesGroupId") != null) {
            employee.setAllReporteesGroupId(((Number) input.get("allReporteesGroupId")).longValue());
        }
        if (input.get("authorId") != null) {
            employee.setAuthorId(((Number) input.get("authorId")).longValue());
        }
        if (input.get("country") != null) {
            employee.setCountry((String) input.get("country"));
        }
        if (input.get("dateOfBirth") != null) {
            employee.setDateOfBirth(parseInstant(input.get("dateOfBirth")));
        }
        if (input.get("email") != null) {
            employee.setEmail((String) input.get("email"));
        }
        if (input.get("firstName") != null) {
            employee.setFirstName((String) input.get("firstName"));
        }
        if (input.get("gender") != null) {
            employee.setGender((String) input.get("gender"));
        }
        if (input.get("lastName") != null) {
            employee.setLastName((String) input.get("lastName"));
        }
        if (input.get("legalEntityId") != null) {
            employee.setLegalEntityId(((Number) input.get("legalEntityId")).longValue());
        }
        if (input.get("locationId") != null) {
            employee.setLocationId(((Number) input.get("locationId")).longValue());
        }
        if (input.get("managerId") != null) {
            employee.setManagerId(((Number) input.get("managerId")).longValue());
        }
        if (input.get("startDate") != null) {
            employee.setStartDate(parseInstant(input.get("startDate")));
        }
        if (input.get("addressLine1") != null) {
            employee.setAddressLine1((String) input.get("addressLine1"));
        }
        if (input.get("addressLine2") != null) {
            employee.setAddressLine2((String) input.get("addressLine2"));
        }
        if (input.get("bankNumber") != null) {
            employee.setBankNumber((String) input.get("bankNumber"));
        }
        if (input.get("city") != null) {
            employee.setCity((String) input.get("city"));
        }
        if (input.get("companyIdentifier") != null) {
            employee.setCompanyIdentifier((String) input.get("companyIdentifier"));
        }
        if (input.get("createdById") != null) {
            employee.setCreatedById(((Number) input.get("createdById")).longValue());
        }
        if (input.get("createdByType") != null) {
            employee.setCreatedByType((String) input.get("createdByType"));
        }
        if (input.get("disabilityPercentageCents") != null) {
            employee.setDisabilityPercentageCents(((Number) input.get("disabilityPercentageCents")).intValue());
        }
        if (input.get("employeeGroupId") != null) {
            employee.setEmployeeGroupId(((Number) input.get("employeeGroupId")).longValue());
        }
        if (input.get("identifier") != null) {
            employee.setIdentifier((String) input.get("identifier"));
        }
        if (input.get("irpfCents") != null) {
            employee.setIrpfCents(((Number) input.get("irpfCents")).intValue());
        }
        if (input.get("isResident") != null) {
            employee.setIsResident((Boolean) input.get("isResident"));
        }
        if (input.get("nationality") != null) {
            employee.setNationality((String) input.get("nationality"));
        }
        if (input.get("phoneNumber") != null) {
            employee.setPhoneNumber((String) input.get("phoneNumber"));
        }
        if (input.get("postalCode") != null) {
            employee.setPostalCode((String) input.get("postalCode"));
        }
        if (input.get("socialSecurityNumber") != null) {
            employee.setSocialSecurityNumber((String) input.get("socialSecurityNumber"));
        }
        if (input.get("state") != null) {
            employee.setState((String) input.get("state"));
        }
        if (input.get("swiftBic") != null) {
            employee.setSwiftBic((String) input.get("swiftBic"));
        }
        if (input.get("taxId") != null) {
            employee.setTaxId((String) input.get("taxId"));
        }
        
        return employee;
    }
    
    private Instant parseInstant(Object value) {
        if (value == null) return null;
        if (value instanceof Instant) return (Instant) value;
        if (value instanceof String) return Instant.parse((String) value);
        return null;
    }
}
