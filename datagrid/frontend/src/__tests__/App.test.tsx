import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import App from '../App';
import { GET_EMPLOYEES } from '../graphql/queries';

const mockEmployees = [
  {
    id: '1',
    company_id: 1,
    first_name: 'Maria',
    last_name: 'Garcia',
    email: 'maria.garcia@example.com',
    country: 'Spain',
    start_date: '2023-01-15T09:00:00Z',
    termination_date: null,
    updated_at: '2024-01-01T10:00:00Z',
    affiliation: null,
    all_reportees_group_id: null,
    author_id: null,
    creation_date: '2023-01-15T09:00:00Z',
    date_of_birth: null,
    gender: 'Female',
    legal_entity_id: null,
    location_id: null,
    manager_id: null,
    termination_reason: null,
    termination_reason_type: null,
    termination_request_date: null,
    untermination_date: null,
    address_line_1: 'Calle Gran Via 123',
    address_line_2: null,
    bank_number: null,
    city: 'Madrid',
    company_identifier: null,
    created_by_id: null,
    created_by_type: null,
    disability_percentage_cents: null,
    employee_group_id: null,
    identifier: null,
    irpf_cents: null,
    is_resident: null,
    nationality: 'Spanish',
    phone_number: '+34 612 345 678',
    postal_code: '28001',
    social_security_number: null,
    state: 'Madrid',
    swift_bic: null,
    tax_id: null,
    termination_observations: null,
  },
  {
    id: '2',
    company_id: 1,
    first_name: 'Carlos',
    last_name: 'Rodriguez',
    email: 'carlos.rodriguez@example.com',
    country: 'Spain',
    start_date: '2023-02-01T09:00:00Z',
    termination_date: null,
    updated_at: '2024-01-01T10:00:00Z',
    affiliation: null,
    all_reportees_group_id: null,
    author_id: null,
    creation_date: '2023-02-01T09:00:00Z',
    date_of_birth: null,
    gender: 'Male',
    legal_entity_id: null,
    location_id: null,
    manager_id: null,
    termination_reason: null,
    termination_reason_type: null,
    termination_request_date: null,
    untermination_date: null,
    address_line_1: 'Passeig de Gracia 45',
    address_line_2: null,
    bank_number: null,
    city: 'Barcelona',
    company_identifier: null,
    created_by_id: null,
    created_by_type: null,
    disability_percentage_cents: null,
    employee_group_id: null,
    identifier: null,
    irpf_cents: null,
    is_resident: null,
    nationality: 'Spanish',
    phone_number: '+34 623 456 789',
    postal_code: '08001',
    social_security_number: null,
    state: 'Catalonia',
    swift_bic: null,
    tax_id: null,
    termination_observations: null,
  },
];

const mocks = [
  {
    request: {
      query: GET_EMPLOYEES,
      variables: {
        filter: { searchTerm: undefined, includeTerminated: true },
        paging: { offset: 0, limit: 25 },
        sorting: { field: 'id', direction: 'ASC' },
      },
    },
    result: {
      data: {
        employees: {
          items: mockEmployees,
          totalCount: 2,
          hasNextPage: false,
        },
      },
    },
  },
];

// Mock WebSocket for subscriptions
vi.mock('graphql-ws', () => ({
  createClient: () => ({
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the employee management title', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <App />
      </MockedProvider>
    );

    expect(await screen.findByText('Employee Management')).toBeInTheDocument();
  });

  it('renders the add employee button', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <App />
      </MockedProvider>
    );

    expect(await screen.findByTestId('add-employee-button')).toBeInTheDocument();
  });

  it('renders the data grid', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <App />
      </MockedProvider>
    );

    expect(await screen.findByTestId('employee-data-grid')).toBeInTheDocument();
  });
});
