package com.example.employeemanager.application;

import com.example.employeemanager.domain.Employee;
import com.example.employeemanager.domain.EmployeeEvent;
import com.example.employeemanager.infrastructure.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeService {
    
    private final EmployeeRepository employeeRepository;
    private final Sinks.Many<EmployeeEvent> employeeEventSink;
    
    public Flux<Employee> findAll(EmployeeFilter filter, EmployeePaging paging, EmployeeSorting sorting) {
        log.debug("Finding all employees with filter: {}, paging: {}, sorting: {}", filter, paging, sorting);
        
        return employeeRepository.findAllWithFilterAndSort(
                filter != null ? filter.getSearchTerm() : null,
                filter != null ? filter.getCompanyId() : null,
                filter != null && filter.getIncludeTerminated() != null && filter.getIncludeTerminated(),
                sorting != null ? sorting.getField() : "id",
                sorting != null ? sorting.getDirection() : "ASC",
                paging != null ? paging.getOffset() : 0,
                paging != null ? paging.getLimit() : 100
        );
    }
    
    public Mono<Long> count(EmployeeFilter filter) {
        return employeeRepository.countWithFilter(
                filter != null ? filter.getSearchTerm() : null,
                filter != null ? filter.getCompanyId() : null,
                filter != null && filter.getIncludeTerminated() != null && filter.getIncludeTerminated()
        );
    }
    
    public Mono<Employee> findById(Long id) {
        log.debug("Finding employee by id: {}", id);
        return employeeRepository.findById(id);
    }
    
    public Mono<Employee> create(Employee employee) {
        log.debug("Creating employee: {}", employee);
        
        Instant now = Instant.now();
        employee.setCreationDate(now);
        employee.setUpdatedAt(now);
        
        return employeeRepository.save(employee)
                .doOnSuccess(saved -> {
                    log.info("Employee created with id: {}", saved.getId());
                    employeeEventSink.tryEmitNext(EmployeeEvent.created(saved));
                });
    }
    
    public Mono<Employee> update(Long id, Employee updates) {
        log.debug("Updating employee with id: {}", id);
        
        return employeeRepository.findById(id)
                .switchIfEmpty(Mono.error(new EmployeeNotFoundException(id)))
                .flatMap(existing -> {
                    applyUpdates(existing, updates);
                    existing.setUpdatedAt(Instant.now());
                    return employeeRepository.save(existing);
                })
                .doOnSuccess(updated -> {
                    log.info("Employee updated with id: {}", updated.getId());
                    EmployeeEvent event = EmployeeEvent.updated(updated);
                    var result = employeeEventSink.tryEmitNext(event);
                    log.info("Event emitted for employee {}: result={}, subscribers={}", 
                            updated.getId(), result, employeeEventSink.currentSubscriberCount());
                });
    }
    
    public Mono<Employee> terminate(Long id, Instant terminationDate, String reason, String reasonType, String observations) {
        log.debug("Terminating employee with id: {}", id);
        
        return employeeRepository.findById(id)
                .switchIfEmpty(Mono.error(new EmployeeNotFoundException(id)))
                .flatMap(employee -> {
                    employee.terminate(
                            terminationDate != null ? terminationDate : Instant.now(),
                            reason,
                            reasonType,
                            observations
                    );
                    return employeeRepository.save(employee);
                })
                .doOnSuccess(terminated -> {
                    log.info("Employee terminated with id: {}", terminated.getId());
                    employeeEventSink.tryEmitNext(EmployeeEvent.terminated(terminated));
                });
    }
    
    public Mono<Employee> unterminate(Long id, Instant unterminationDate) {
        log.debug("Unterminating employee with id: {}", id);
        
        return employeeRepository.findById(id)
                .switchIfEmpty(Mono.error(new EmployeeNotFoundException(id)))
                .flatMap(employee -> {
                    employee.unterminate(unterminationDate);
                    return employeeRepository.save(employee);
                })
                .doOnSuccess(unterminated -> {
                    log.info("Employee unterminated with id: {}", unterminated.getId());
                    employeeEventSink.tryEmitNext(EmployeeEvent.unterminated(unterminated));
                });
    }
    
    public Flux<EmployeeEvent> subscribeToEvents() {
        return employeeEventSink.asFlux();
    }
    
    private void applyUpdates(Employee existing, Employee updates) {
        if (updates.getCompanyId() != null) existing.setCompanyId(updates.getCompanyId());
        if (updates.getAffiliation() != null) existing.setAffiliation(updates.getAffiliation());
        if (updates.getAllReporteesGroupId() != null) existing.setAllReporteesGroupId(updates.getAllReporteesGroupId());
        if (updates.getAuthorId() != null) existing.setAuthorId(updates.getAuthorId());
        if (updates.getCountry() != null) existing.setCountry(updates.getCountry());
        if (updates.getDateOfBirth() != null) existing.setDateOfBirth(updates.getDateOfBirth());
        if (updates.getEmail() != null) existing.setEmail(updates.getEmail());
        if (updates.getFirstName() != null) existing.setFirstName(updates.getFirstName());
        if (updates.getGender() != null) existing.setGender(updates.getGender());
        if (updates.getLastName() != null) existing.setLastName(updates.getLastName());
        if (updates.getLegalEntityId() != null) existing.setLegalEntityId(updates.getLegalEntityId());
        if (updates.getLocationId() != null) existing.setLocationId(updates.getLocationId());
        if (updates.getManagerId() != null) existing.setManagerId(updates.getManagerId());
        if (updates.getStartDate() != null) existing.setStartDate(updates.getStartDate());
        if (updates.getAddressLine1() != null) existing.setAddressLine1(updates.getAddressLine1());
        if (updates.getAddressLine2() != null) existing.setAddressLine2(updates.getAddressLine2());
        if (updates.getBankNumber() != null) existing.setBankNumber(updates.getBankNumber());
        if (updates.getCity() != null) existing.setCity(updates.getCity());
        if (updates.getCompanyIdentifier() != null) existing.setCompanyIdentifier(updates.getCompanyIdentifier());
        if (updates.getCreatedById() != null) existing.setCreatedById(updates.getCreatedById());
        if (updates.getCreatedByType() != null) existing.setCreatedByType(updates.getCreatedByType());
        if (updates.getDisabilityPercentageCents() != null) existing.setDisabilityPercentageCents(updates.getDisabilityPercentageCents());
        if (updates.getEmployeeGroupId() != null) existing.setEmployeeGroupId(updates.getEmployeeGroupId());
        if (updates.getIdentifier() != null) existing.setIdentifier(updates.getIdentifier());
        if (updates.getIrpfCents() != null) existing.setIrpfCents(updates.getIrpfCents());
        if (updates.getIsResident() != null) existing.setIsResident(updates.getIsResident());
        if (updates.getNationality() != null) existing.setNationality(updates.getNationality());
        if (updates.getPhoneNumber() != null) existing.setPhoneNumber(updates.getPhoneNumber());
        if (updates.getPostalCode() != null) existing.setPostalCode(updates.getPostalCode());
        if (updates.getSocialSecurityNumber() != null) existing.setSocialSecurityNumber(updates.getSocialSecurityNumber());
        if (updates.getState() != null) existing.setState(updates.getState());
        if (updates.getSwiftBic() != null) existing.setSwiftBic(updates.getSwiftBic());
        if (updates.getTaxId() != null) existing.setTaxId(updates.getTaxId());
    }
    
    public static class EmployeeNotFoundException extends RuntimeException {
        public EmployeeNotFoundException(Long id) {
            super("Employee not found with id: " + id);
        }
    }
}
