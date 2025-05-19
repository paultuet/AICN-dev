import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageNumbers?: boolean;
  showFirstLast?: boolean;
  pageRangeDisplayed?: number; // Number of page buttons to display
}

/**
 * Pagination component for navigating through paginated content
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showPageNumbers = true,
  showFirstLast = true,
  pageRangeDisplayed = 5
}) => {
  // Don't show pagination if there's only one page
  if (totalPages <= 1) return null;

  // Calculate the range of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(pageRangeDisplayed / 2));
    const endPage = Math.min(totalPages, startPage + pageRangeDisplayed - 1);
    
    // Adjust startPage if endPage is maxed out
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - pageRangeDisplayed + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  const pageNumbers = showPageNumbers ? getPageNumbers() : [];
  
  return (
    <nav className={`flex justify-center items-center ${className}`}>
      <ul className="flex items-center -space-x-px h-8 text-sm">
        {/* First page button */}
        {showFirstLast && (
          <li>
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className={`
                flex h-8 items-center justify-center px-3 leading-tight
                ${currentPage === 1
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }
                ml-0 rounded-l-lg border border-gray-300 bg-white
              `}
              aria-label="First page"
            >
              <span className="sr-only">First page</span>
              <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5M9 9 5 5 1 9"/>
              </svg>
            </button>
          </li>
        )}
        
        {/* Previous page button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`
              flex h-8 items-center justify-center px-3 leading-tight
              ${currentPage === 1
                ? 'cursor-not-allowed text-gray-300'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }
              ${!showFirstLast ? 'rounded-l-lg' : ''}
              border border-gray-300 bg-white
            `}
            aria-label="Previous page"
          >
            <span className="sr-only">Previous</span>
            <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4"/>
            </svg>
          </button>
        </li>
        
        {/* Page numbers */}
        {showPageNumbers && pageNumbers.map(page => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              className={`
                flex h-8 items-center justify-center px-3 leading-tight
                ${page === currentPage
                  ? 'z-10 bg-indigo-50 border-indigo-300 text-indigo-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }
                border
              `}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          </li>
        ))}
        
        {/* Next page button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`
              flex h-8 items-center justify-center px-3 leading-tight
              ${currentPage === totalPages
                ? 'cursor-not-allowed text-gray-300'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }
              ${!showFirstLast ? 'rounded-r-lg' : ''}
              border border-gray-300 bg-white
            `}
            aria-label="Next page"
          >
            <span className="sr-only">Next</span>
            <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
            </svg>
          </button>
        </li>
        
        {/* Last page button */}
        {showFirstLast && (
          <li>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`
                flex h-8 items-center justify-center px-3 leading-tight
                ${currentPage === totalPages
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }
                rounded-r-lg border border-gray-300 bg-white
              `}
              aria-label="Last page"
            >
              <span className="sr-only">Last page</span>
              <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4-4 4m6-8 4 4-4 4"/>
              </svg>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default React.memo(Pagination);