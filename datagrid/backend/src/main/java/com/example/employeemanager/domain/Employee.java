package com.example.employeemanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("employees")
public class Employee {
    
    @Id
    private Long id;
    
    @Column("company_id")
    private Long companyId;
    
    @Column("updated_at")
    private Instant updatedAt;
    
    private String affiliation;
    
    @Column("all_reportees_group_id")
    private Long allReporteesGroupId;
    
    @Column("author_id")
    private Long authorId;
    
    private String country;
    
    @Column("creation_date")
    private Instant creationDate;
    
    @Column("date_of_birth")
    private Instant dateOfBirth;
    
    private String email;
    
    @Column("first_name")
    private String firstName;
    
    private String gender;
    
    @Column("last_name")
    private String lastName;
    
    @Column("legal_entity_id")
    private Long legalEntityId;
    
    @Column("location_id")
    private Long locationId;
    
    @Column("manager_id")
    private Long managerId;
    
    @Column("start_date")
    private Instant startDate;
    
    @Column("termination_date")
    private Instant terminationDate;
    
    @Column("termination_reason")
    private String terminationReason;
    
    @Column("termination_reason_type")
    private String terminationReasonType;
    
    @Column("termination_request_date")
    private Instant terminationRequestDate;
    
    @Column("untermination_date")
    private Instant unterminationDate;
    
    @Column("address_line_1")
    private String addressLine1;
    
    @Column("address_line_2")
    private String addressLine2;
    
    @Column("bank_number")
    private String bankNumber;
    
    private String city;
    
    @Column("company_identifier")
    private String companyIdentifier;
    
    @Column("created_by_id")
    private Long createdById;
    
    @Column("created_by_type")
    private String createdByType;
    
    @Column("disability_percentage_cents")
    private Integer disabilityPercentageCents;
    
    @Column("employee_group_id")
    private Long employeeGroupId;
    
    private String identifier;
    
    @Column("irpf_cents")
    private Integer irpfCents;
    
    @Column("is_resident")
    private Boolean isResident;
    
    private String nationality;
    
    @Column("phone_number")
    private String phoneNumber;
    
    @Column("postal_code")
    private String postalCode;
    
    @Column("social_security_number")
    private String socialSecurityNumber;
    
    private String state;
    
    @Column("swift_bic")
    private String swiftBic;
    
    @Column("tax_id")
    private String taxId;
    
    @Column("termination_observations")
    private String terminationObservations;
    
    public boolean isTerminated() {
        return terminationDate != null;
    }
    
    public void terminate(Instant terminationDate, String reason, String reasonType, String observations) {
        this.terminationDate = terminationDate;
        this.terminationReason = reason;
        this.terminationReasonType = reasonType;
        this.terminationObservations = observations;
        this.terminationRequestDate = Instant.now();
        this.updatedAt = Instant.now();
    }
    
    public void unterminate(Instant unterminationDate) {
        this.unterminationDate = unterminationDate != null ? unterminationDate : Instant.now();
        this.terminationDate = null;
        this.terminationReason = null;
        this.terminationReasonType = null;
        this.terminationObservations = null;
        this.terminationRequestDate = null;
        this.updatedAt = Instant.now();
    }
}
