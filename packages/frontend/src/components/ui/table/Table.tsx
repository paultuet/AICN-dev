import React from 'react';

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
  showHeader?: boolean;
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  emptyState?: React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
}

/**
 * Table component for displaying tabular data
 */
function Table<T>({
  data,
  columns,
  className = '',
  showHeader = true,
  bordered = false,
  striped = false,
  hoverable = true,
  compact = false,
  emptyState,
  keyExtractor = (_, index) => index.toString()
}: TableProps<T>) {
  const alignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };
  
  return (
    <div className={`overflow-hidden rounded-lg bg-white shadow ${className}`}>
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${bordered ? 'border border-gray-200' : ''}`}>
          {showHeader && (
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={`header-${column.key}`}
                    scope="col"
                    className={`
                      ${index === 0 ? 'pl-4 pr-3 sm:pl-6' : 'px-3'}
                      ${index === columns.length - 1 ? 'pr-4 sm:pr-6' : ''}
                      ${compact ? 'py-2 text-xs' : 'py-3.5 text-sm'}
                      font-medium text-gray-900 ${alignmentClass(column.align)}
                      ${column.width ? `w-${column.width}` : ''}
                    `}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.length > 0 ? (
              data.map((item, rowIndex) => (
                <tr 
                  key={keyExtractor(item, rowIndex)} 
                  className={`
                    ${hoverable ? 'hover:bg-gray-50' : ''}
                    ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''}
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={`cell-${rowIndex}-${column.key}`}
                      className={`
                        ${colIndex === 0 ? 'pl-4 pr-3 sm:pl-6' : 'px-3'}
                        ${colIndex === columns.length - 1 ? 'pr-4 sm:pr-6' : ''}
                        ${compact ? 'py-2 text-xs' : 'py-4 text-sm'}
                        text-gray-900 ${alignmentClass(column.align)}
                      `}
                    >
                      {column.render 
                        ? column.render(item, rowIndex)
                        // @ts-ignore - We're assuming the key exists on the item
                        : item[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  {emptyState || 'Aucune donnée disponible'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default React.memo(Table) as typeof Table;