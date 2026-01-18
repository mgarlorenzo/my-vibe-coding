import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useCallback, useEffect } from 'react';
import {
  GET_EMPLOYEES,
  CREATE_EMPLOYEE,
  UPDATE_EMPLOYEE,
  TERMINATE_EMPLOYEE,
  UNTERMINATE_EMPLOYEE,
  EMPLOYEE_CHANGED_SUBSCRIPTION,
} from '../graphql/queries';
import type {
  Employee,
  EmployeeConnection,
  EmployeeFilter,
  EmployeePaging,
  EmployeeSorting,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  TerminateEmployeeInput,
  EmployeeEvent,
} from '../types/employee';

interface UseEmployeesOptions {
  filter?: EmployeeFilter;
  paging?: EmployeePaging;
  sorting?: EmployeeSorting;
}

interface EmployeesQueryResult {
  employees: EmployeeConnection;
}

interface EmployeeEventResult {
  employeeChanged: EmployeeEvent;
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const { filter, paging, sorting } = options;

  const { data, loading, error, refetch } = useQuery<EmployeesQueryResult>(GET_EMPLOYEES, {
    variables: { filter, paging, sorting },
    fetchPolicy: 'cache-and-network',
  });

  const { data: subscriptionData } = useSubscription<EmployeeEventResult>(
    EMPLOYEE_CHANGED_SUBSCRIPTION
  );

  // Refetch when subscription receives an event
  useEffect(() => {
    if (subscriptionData?.employeeChanged) {
      refetch();
    }
  }, [subscriptionData, refetch]);

  const [createEmployeeMutation, { loading: creating }] = useMutation(CREATE_EMPLOYEE, {
    refetchQueries: [{ query: GET_EMPLOYEES, variables: { filter, paging, sorting } }],
  });

  const [updateEmployeeMutation, { loading: updating }] = useMutation(UPDATE_EMPLOYEE, {
    refetchQueries: [{ query: GET_EMPLOYEES, variables: { filter, paging, sorting } }],
  });

  const [terminateEmployeeMutation, { loading: terminating }] = useMutation(TERMINATE_EMPLOYEE, {
    refetchQueries: [{ query: GET_EMPLOYEES, variables: { filter, paging, sorting } }],
  });

  const [unterminateEmployeeMutation, { loading: unterminating }] = useMutation(UNTERMINATE_EMPLOYEE, {
    refetchQueries: [{ query: GET_EMPLOYEES, variables: { filter, paging, sorting } }],
  });

  const createEmployee = useCallback(
    async (input: CreateEmployeeInput): Promise<Employee> => {
      const result = await createEmployeeMutation({ variables: { input } });
      return result.data.createEmployee;
    },
    [createEmployeeMutation]
  );

  const updateEmployee = useCallback(
    async (id: string, input: UpdateEmployeeInput): Promise<Employee> => {
      const result = await updateEmployeeMutation({ variables: { id, input } });
      return result.data.updateEmployee;
    },
    [updateEmployeeMutation]
  );

  const terminateEmployee = useCallback(
    async (id: string, input?: TerminateEmployeeInput): Promise<Employee> => {
      const result = await terminateEmployeeMutation({ variables: { id, input } });
      return result.data.terminateEmployee;
    },
    [terminateEmployeeMutation]
  );

  const unterminateEmployee = useCallback(
    async (id: string, date?: string): Promise<Employee> => {
      const result = await unterminateEmployeeMutation({ variables: { id, date } });
      return result.data.unterminateEmployee;
    },
    [unterminateEmployeeMutation]
  );

  return {
    employees: data?.employees.items ?? [],
    totalCount: data?.employees.totalCount ?? 0,
    hasNextPage: data?.employees.hasNextPage ?? false,
    loading,
    error,
    refetch,
    createEmployee,
    updateEmployee,
    terminateEmployee,
    unterminateEmployee,
    creating,
    updating,
    terminating,
    unterminating,
    lastEvent: subscriptionData?.employeeChanged,
  };
}
