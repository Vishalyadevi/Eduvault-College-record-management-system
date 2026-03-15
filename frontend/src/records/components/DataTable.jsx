import React, { useState } from 'react';
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown } from 'lucide-react';

const DataTable = ({ 
  data, 
  columns, 
  onView, 
  onEdit, 
  onDelete,
  isLoading = false,
  itemsPerPage = 10
}) => {
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === bValue) return 0;
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : 1;
    } else {
      return aValue > bValue ? -1 : 1;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gradient-to-r from-indigo-200 to-indigo-200 rounded-lg mb-4"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg text-center p-8">
        <h3 className="text-base font-semibold text-gray-600 mb-2">No data available</h3>
        <p className="text-sm text-gray-500">Add new entries to see them here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4f46e5 #e5e7eb'
      }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          div::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%);
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          }
        `}</style>
        
        <table className="min-w-full table-auto">
          <thead className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">
                S.No
              </th>
              {columns.map((column) => (
                <th 
                  key={column.field} 
                  className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wide cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all duration-200 select-none"
                  onClick={() => handleSort(column.field)}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{column.header}</span>
                    <div className="flex flex-col">
                      {sortField === column.field ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp size={14} className="text-white" />
                        ) : (
                          <ChevronDown size={14} className="text-white" />
                        )
                      ) : (
                        <div className="flex flex-col opacity-50">
                          <ChevronUp size={12} className="text-white -mb-1" />
                          <ChevronDown size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, index) => (
              <tr key={row.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-50 transition-all duration-150">
                <td className="px-4 py-3 text-xs text-gray-700 font-medium">
                  {startIndex + index + 1}
                </td>
                {columns.map((column) => (
                  <td key={`${row.id}-${column.field}`} className="px-4 py-3 text-xs text-gray-700">
                    <div className="max-w-xs truncate" title={column.render ? '' : row[column.field]}>
                      {column.render ? column.render(row) : row[column.field]}
                    </div>
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-600">
          Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
          <span className="font-semibold">{Math.min(endIndex, sortedData.length)}</span> of{' '}
          <span className="font-semibold">{sortedData.length}</span> entries
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-500 text-white hover:from-indigo-600 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>
          
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-500 text-white hover:from-indigo-600 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-indigo-100 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="px-2 text-gray-500">...</span>;
              }
              return null;
            })}
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-500 text-white hover:from-indigo-600 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
          
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-500 text-white hover:from-indigo-600 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;