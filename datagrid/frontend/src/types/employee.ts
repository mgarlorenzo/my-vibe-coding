export interface Employee {
  id: string;
  companyId: number;
  updatedAt: string | null;
  affiliation: string | null;
  allReporteesGroupId: number | null;
  authorId: number | null;
  country: string | null;
  creationDate: string | null;
  dateOfBirth: string | null;
  email: string | null;
  firstName: string | null;
  gender: string | null;
  lastName: string | null;
  legalEntityId: number | null;
  locationId: number | null;
  managerId: number | null;
  startDate: string | null;
  terminationDate: string | null;
  terminationReason: string | null;
  terminationReasonType: string | null;
  terminationRequestDate: string | null;
  unterminationDate: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  bankNumber: string | null;
  city: string | null;
  companyIdentifier: string | null;
  createdById: number | null;
  createdByType: string | null;
  disabilityPercentageCents: number | null;
  employeeGroupId: number | null;
  identifier: string | null;
  irpfCents: number | null;
  isResident: boolean | null;
  nationality: string | null;
  phoneNumber: string | null;
  postalCode: string | null;
  socialSecurityNumber: string | null;
  state: string | null;
  swiftBic: string | null;
  taxId: string | null;
  terminationObservations: string | null;
}

export interface EmployeeConnection {
  items: Employee[];
  totalCount: number;
  hasNextPage: boolean;
}

export interface EmployeeFilter {
  searchTerm?: string;
  companyId?: number;
  includeTerminated?: boolean;
}

export interface EmployeePaging {
  offset?: number;
  limit?: number;
}

export interface EmployeeSorting {
  field?: string;
  direction?: 'ASC' | 'DESC';
}

export interface CreateEmployeeInput {
  companyId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  country?: string;
  startDate?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  addressLine1?: string;
  nationality?: string;
  gender?: string;
}

export interface UpdateEmployeeInput {
  companyId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  country?: string;
  startDate?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  addressLine1?: string;
  nationality?: string;
  gender?: string;
}

export interface TerminateEmployeeInput {
  terminationDate?: string;
  terminationReason?: string;
  terminationReasonType?: string;
  terminationObservations?: string;
}

export type EventType = 'CREATED' | 'UPDATED' | 'TERMINATED' | 'UNTERMINATED';

export interface EmployeeEvent {
  eventType: EventType;
  employee: Employee;
  timestamp: string;
}
