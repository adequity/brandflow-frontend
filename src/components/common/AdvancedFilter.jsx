import React, { useState, useCallback, useMemo } from 'react';
import { Filter, X } from 'lucide-react';

const AdvancedFilter = React.memo(({ onFilterChange, users = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    workType: 'all',
    status: 'all',
    manager: 'all',
    dateRange: 'all',
    stage: 'all'
  });

  const workTypes = [
    { value: 'all', label: '전체 업무' },
    { value: '블로그', label: '블로그' },
    { value: '인스타그램', label: '인스타그램' },
    { value: '페이스북', label: '페이스북' },
    { value: '유튜브', label: '유튜브' },
    { value: '디자인', label: '디자인' },
    { value: '마케팅', label: '마케팅' },
    { value: '영상 편집', label: '영상 편집' }
  ];

  const statusOptions = [
    { value: 'all', label: '전체 상태' },
    { value: '대기', label: '승인 대기' },
    { value: '승인', label: '승인됨' },
    { value: '거절', label: '거절됨' }
  ];

  const dateRanges = [
    { value: 'all', label: '전체 기간' },
    { value: '7days', label: '최근 7일' },
    { value: '30days', label: '최근 30일' },
    { value: '3months', label: '최근 3개월' }
  ];

  const stageOptions = [
    { value: 'all', label: '전체 단계' },
    { value: 'work_only', label: '업무만 등록' },
    { value: 'has_details', label: '세부사항 있음' },
    { value: 'has_result', label: '결과물 있음' }
  ];

  const managerOptions = [
    { value: 'all', label: '전체 담당자' },
    ...users.filter(u => u.role !== '클라이언트').map(u => ({
      value: u.id.toString(),
      label: u.name
    }))
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      workType: 'all',
      status: 'all',
      manager: 'all',
      dateRange: 'all',
      stage: 'all'
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
          getActiveFilterCount() > 0 
            ? 'bg-blue-50 border-blue-300 text-blue-700' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter size={16} />
        <span>필터</span>
        {getActiveFilterCount() > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
            {getActiveFilterCount()}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">상세 필터</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* 업무 타입 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">업무 타입</label>
              <select
                value={filters.workType}
                onChange={(e) => handleFilterChange('workType', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded"
              >
                {workTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">승인 상태</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 담당자 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">담당자</label>
              <select
                value={filters.manager}
                onChange={(e) => handleFilterChange('manager', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded"
              >
                {managerOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 날짜 범위 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">기간</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded"
              >
                {dateRanges.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 진행 단계 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">진행 단계</label>
              <select
                value={filters.stage}
                onChange={(e) => handleFilterChange('stage', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded"
              >
                {stageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 초기화 버튼 */}
            <div className="pt-2 border-t">
              <button
                onClick={resetFilters}
                className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AdvancedFilter.displayName = 'AdvancedFilter';

export default AdvancedFilter;