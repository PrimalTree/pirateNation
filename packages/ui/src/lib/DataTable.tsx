import * as React from 'react';
import { Table, type Column } from './Table';

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

export function DataTable<T extends Record<string, any>>(props: DataTableProps<T>) {
  return <Table {...props} />;
}

