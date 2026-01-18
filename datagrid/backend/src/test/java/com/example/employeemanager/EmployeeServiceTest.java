package com.example.employeemanager;

import com.example.employeemanager.application.EmployeeFilter;
import com.example.employeemanager.application.EmployeePaging;
import com.example.employeemanager.application.EmployeeService;
import com.example.employeemanager.application.EmployeeSorting;
import com.example.employeemanager.domain.Employee;
import com.example.employeemanager.domain.EmployeeEvent;
import com.example.employeemanager.infrastructure.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.test.StepVerifier;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {
    
    @Mock
    private EmployeeRepository employeeRepository;
    
    private Sinks.Many<EmployeeEvent> employeeEventSink;
    private EmployeeService employeeService;
    
    @BeforeEach
    void setUp() {
        employeeEventSink = Sinks.many().multicast().onBackpressureBuffer();
        employeeService = new EmployeeService(employeeRepository, employeeEventSink);
    }
    
    @Test
    void shouldCreateEmployee() {
        Employee employee = Employee.builder()
                .companyId(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .build();
        
        Employee savedEmployee = Employee.builder()
                .id(1L)
                .companyId(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .creationDate(Instant.now())
                .updatedAt(Instant.now())
                .build();
        
        when(employeeRepository.save(any(Employee.class))).thenReturn(Mono.just(savedEmployee));
        
        StepVerifier.create(employeeService.create(employee))
                .assertNext(result -> {
                    assertThat(result.getId()).isEqualTo(1L);
                    assertThat(result.getFirstName()).isEqualTo("John");
                    assertThat(result.getLastName()).isEqualTo("Doe");
                    assertThat(result.getUpdatedAt()).isNotNull();
                })
                .verifyComplete();
    }
    
    @Test
    void shouldUpdateEmployee() {
        Employee existingEmployee = Employee.builder()
                .id(1L)
                .companyId(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .updatedAt(Instant.now().minusSeconds(3600))
                .build();
        
        Employee updates = Employee.builder()
                .lastName("Smith")
                .email("john.smith@example.com")
                .build();
        
        when(employeeRepository.findById(1L)).thenReturn(Mono.just(existingEmployee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee emp = invocation.getArgument(0);
            return Mono.just(emp);
        });
        
        StepVerifier.create(employeeService.update(1L, updates))
                .assertNext(result -> {
                    assertThat(result.getLastName()).isEqualTo("Smith");
                    assertThat(result.getEmail()).isEqualTo("john.smith@example.com");
                    assertThat(result.getFirstName()).isEqualTo("John"); // unchanged
                })
                .verifyComplete();
    }
    
    @Test
    void shouldTerminateEmployee() {
        Employee existingEmployee = Employee.builder()
                .id(1L)
                .companyId(1L)
                .firstName("John")
                .lastName("Doe")
                .build();
        
        Instant terminationDate = Instant.now();
        
        when(employeeRepository.findById(1L)).thenReturn(Mono.just(existingEmployee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee emp = invocation.getArgument(0);
            return Mono.just(emp);
        });
        
        StepVerifier.create(employeeService.terminate(1L, terminationDate, "Voluntary", "VOLUNTARY", "Left for new opportunity"))
                .assertNext(result -> {
                    assertThat(result.getTerminationDate()).isEqualTo(terminationDate);
                    assertThat(result.getTerminationReason()).isEqualTo("Voluntary");
                    assertThat(result.getTerminationReasonType()).isEqualTo("VOLUNTARY");
                    assertThat(result.getTerminationObservations()).isEqualTo("Left for new opportunity");
                    assertThat(result.isTerminated()).isTrue();
                })
                .verifyComplete();
    }
    
    @Test
    void shouldUnterminateEmployee() {
        Employee terminatedEmployee = Employee.builder()
                .id(1L)
                .companyId(1L)
                .firstName("John")
                .lastName("Doe")
                .terminationDate(Instant.now().minusSeconds(86400))
                .terminationReason("Voluntary")
                .build();
        
        when(employeeRepository.findById(1L)).thenReturn(Mono.just(terminatedEmployee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee emp = invocation.getArgument(0);
            return Mono.just(emp);
        });
        
        StepVerifier.create(employeeService.unterminate(1L, Instant.now()))
                .assertNext(result -> {
                    assertThat(result.getTerminationDate()).isNull();
                    assertThat(result.getTerminationReason()).isNull();
                    assertThat(result.getUnterminationDate()).isNotNull();
                    assertThat(result.isTerminated()).isFalse();
                })
                .verifyComplete();
    }
    
    @Test
    void shouldFindAllEmployees() {
        Employee emp1 = Employee.builder().id(1L).companyId(1L).firstName("John").build();
        Employee emp2 = Employee.builder().id(2L).companyId(1L).firstName("Jane").build();
        
        when(employeeRepository.findAllWithFilterAndSort(null, null, true, "id", "ASC", 0, 100))
                .thenReturn(Flux.just(emp1, emp2));
        
        EmployeeFilter filter = EmployeeFilter.builder().includeTerminated(true).build();
        EmployeePaging paging = EmployeePaging.builder().offset(0).limit(100).build();
        EmployeeSorting sorting = EmployeeSorting.builder().field("id").direction("ASC").build();
        
        StepVerifier.create(employeeService.findAll(filter, paging, sorting))
                .expectNext(emp1)
                .expectNext(emp2)
                .verifyComplete();
    }
    
    @Test
    void shouldFindEmployeeById() {
        Employee employee = Employee.builder()
                .id(1L)
                .companyId(1L)
                .firstName("John")
                .lastName("Doe")
                .build();
        
        when(employeeRepository.findById(1L)).thenReturn(Mono.just(employee));
        
        StepVerifier.create(employeeService.findById(1L))
                .assertNext(result -> {
                    assertThat(result.getId()).isEqualTo(1L);
                    assertThat(result.getFirstName()).isEqualTo("John");
                })
                .verifyComplete();
    }
    
    @Test
    void shouldReturnEmptyWhenEmployeeNotFound() {
        when(employeeRepository.findById(999L)).thenReturn(Mono.empty());
        
        StepVerifier.create(employeeService.findById(999L))
                .verifyComplete();
    }
    
    @Test
    void shouldEmitEventOnCreate() {
        Employee employee = Employee.builder()
                .companyId(1L)
                .firstName("John")
                .build();
        
        Employee savedEmployee = Employee.builder()
                .id(1L)
                .companyId(1L)
                .firstName("John")
                .creationDate(Instant.now())
                .updatedAt(Instant.now())
                .build();
        
        when(employeeRepository.save(any(Employee.class))).thenReturn(Mono.just(savedEmployee));
        
        // Subscribe to events before creating
        StepVerifier.create(employeeEventSink.asFlux().take(1))
                .then(() -> employeeService.create(employee).subscribe())
                .assertNext(event -> {
                    assertThat(event.getEventType()).isEqualTo(EmployeeEvent.EventType.CREATED);
                    assertThat(event.getEmployee().getId()).isEqualTo(1L);
                })
                .verifyComplete();
    }
    
    @Test
    void shouldUpdateUpdatedAtOnModification() {
        Instant originalUpdatedAt = Instant.now().minusSeconds(3600);
        
        Employee existingEmployee = Employee.builder()
                .id(1L)
                .companyId(1L)
                .firstName("John")
                .updatedAt(originalUpdatedAt)
                .build();
        
        Employee updates = Employee.builder()
                .lastName("Smith")
                .build();
        
        when(employeeRepository.findById(1L)).thenReturn(Mono.just(existingEmployee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee emp = invocation.getArgument(0);
            return Mono.just(emp);
        });
        
        StepVerifier.create(employeeService.update(1L, updates))
                .assertNext(result -> {
                    assertThat(result.getUpdatedAt()).isAfter(originalUpdatedAt);
                })
                .verifyComplete();
    }
}
