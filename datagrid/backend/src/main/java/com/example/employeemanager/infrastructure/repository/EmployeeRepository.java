package com.example.employeemanager.infrastructure.repository;

import com.example.employeemanager.domain.Employee;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface EmployeeRepository extends R2dbcRepository<Employee, Long> {
    
    @Query("""
        SELECT * FROM employees e
        WHERE (:searchTerm IS NULL OR 
               LOWER(e.first_name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
               LOWER(e.last_name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
               LOWER(e.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        AND (:companyId IS NULL OR e.company_id = :companyId)
        AND (:includeTerminated = TRUE OR e.termination_date IS NULL)
        ORDER BY 
            CASE WHEN :sortDirection = 'ASC' THEN
                CASE :sortField
                    WHEN 'id' THEN CAST(e.id AS VARCHAR)
                    WHEN 'company_id' THEN CAST(e.company_id AS VARCHAR)
                    WHEN 'first_name' THEN e.first_name
                    WHEN 'last_name' THEN e.last_name
                    WHEN 'email' THEN e.email
                    WHEN 'start_date' THEN CAST(e.start_date AS VARCHAR)
                    WHEN 'termination_date' THEN CAST(e.termination_date AS VARCHAR)
                    WHEN 'updated_at' THEN CAST(e.updated_at AS VARCHAR)
                    ELSE CAST(e.id AS VARCHAR)
                END
            END ASC,
            CASE WHEN :sortDirection = 'DESC' THEN
                CASE :sortField
                    WHEN 'id' THEN CAST(e.id AS VARCHAR)
                    WHEN 'company_id' THEN CAST(e.company_id AS VARCHAR)
                    WHEN 'first_name' THEN e.first_name
                    WHEN 'last_name' THEN e.last_name
                    WHEN 'email' THEN e.email
                    WHEN 'start_date' THEN CAST(e.start_date AS VARCHAR)
                    WHEN 'termination_date' THEN CAST(e.termination_date AS VARCHAR)
                    WHEN 'updated_at' THEN CAST(e.updated_at AS VARCHAR)
                    ELSE CAST(e.id AS VARCHAR)
                END
            END DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<Employee> findAllWithFilterAndSort(
            @Param("searchTerm") String searchTerm,
            @Param("companyId") Long companyId,
            @Param("includeTerminated") boolean includeTerminated,
            @Param("sortField") String sortField,
            @Param("sortDirection") String sortDirection,
            @Param("offset") int offset,
            @Param("limit") int limit
    );
    
    @Query("""
        SELECT COUNT(*) FROM employees e
        WHERE (:searchTerm IS NULL OR 
               LOWER(e.first_name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
               LOWER(e.last_name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
               LOWER(e.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        AND (:companyId IS NULL OR e.company_id = :companyId)
        AND (:includeTerminated = TRUE OR e.termination_date IS NULL)
        """)
    Mono<Long> countWithFilter(
            @Param("searchTerm") String searchTerm,
            @Param("companyId") Long companyId,
            @Param("includeTerminated") boolean includeTerminated
    );
}
