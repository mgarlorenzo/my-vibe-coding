import { gql } from '@apollo/client';

export const EMPLOYEE_FIELDS = gql`
  fragment EmployeeFields on Employee {
    id
    companyId
    updatedAt
    affiliation
    allReporteesGroupId
    authorId
    country
    creationDate
    dateOfBirth
    email
    firstName
    gender
    lastName
    legalEntityId
    locationId
    managerId
    startDate
    terminationDate
    terminationReason
    terminationReasonType
    terminationRequestDate
    unterminationDate
    addressLine1
    addressLine2
    bankNumber
    city
    companyIdentifier
    createdById
    createdByType
    disabilityPercentageCents
    employeeGroupId
    identifier
    irpfCents
    isResident
    nationality
    phoneNumber
    postalCode
    socialSecurityNumber
    state
    swiftBic
    taxId
    terminationObservations
  }
`;

export const GET_EMPLOYEES = gql`
  ${EMPLOYEE_FIELDS}
  query GetEmployees($filter: EmployeeFilter, $paging: EmployeePaging, $sorting: EmployeeSorting) {
    employees(filter: $filter, paging: $paging, sorting: $sorting) {
      items {
        ...EmployeeFields
      }
      totalCount
      hasNextPage
    }
  }
`;

export const GET_EMPLOYEE = gql`
  ${EMPLOYEE_FIELDS}
  query GetEmployee($id: ID!) {
    employee(id: $id) {
      ...EmployeeFields
    }
  }
`;

export const CREATE_EMPLOYEE = gql`
  ${EMPLOYEE_FIELDS}
  mutation CreateEmployee($input: CreateEmployeeInput!) {
    createEmployee(input: $input) {
      ...EmployeeFields
    }
  }
`;

export const UPDATE_EMPLOYEE = gql`
  ${EMPLOYEE_FIELDS}
  mutation UpdateEmployee($id: ID!, $input: UpdateEmployeeInput!) {
    updateEmployee(id: $id, input: $input) {
      ...EmployeeFields
    }
  }
`;

export const TERMINATE_EMPLOYEE = gql`
  ${EMPLOYEE_FIELDS}
  mutation TerminateEmployee($id: ID!, $input: TerminateEmployeeInput) {
    terminateEmployee(id: $id, input: $input) {
      ...EmployeeFields
    }
  }
`;

export const UNTERMINATE_EMPLOYEE = gql`
  ${EMPLOYEE_FIELDS}
  mutation UnterminateEmployee($id: ID!, $date: DateTime) {
    unterminateEmployee(id: $id, date: $date) {
      ...EmployeeFields
    }
  }
`;

export const EMPLOYEE_CHANGED_SUBSCRIPTION = gql`
  ${EMPLOYEE_FIELDS}
  subscription EmployeeChanged {
    employeeChanged {
      eventType
      employee {
        ...EmployeeFields
      }
      timestamp
    }
  }
`;
