// src/components/common/SearchComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, User, Briefcase, FileText, DollarSign } from 'lucide-react';
import { apiEndpoints } from '../../api/client';

const SearchComponent = ({ onSearchResults }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // 외부 클릭 시 검색창 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 실행
  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Global search API 호출
      const response = await apiEndpoints.globalSearch(searchQuery);
      const searchResults = response.data || [];
      
      // 결과를 타입별로 분류
      const categorizedResults = {
        users: searchResults.filter(item => item.type === 'user') || [],
        campaigns: searchResults.filter(item => item.type === 'campaign') || [],
        posts: searchResults.filter(item => item.type === 'post') || [],
        purchases: searchResults.filter(item => item.type === 'purchase') || []
      };

      setResults(categorizedResults);
      
      if (onSearchResults) {
        onSearchResults(categorizedResults);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      // Mock 데이터를 이용한 fallback 검색
      performLocalSearch(searchQuery);
    } finally {
      setIsLoading(false);
    }
  };

  // Local mock 데이터를 이용한 검색
  const performLocalSearch = (searchQuery) => {
    // 이것은 mock 데이터를 이용한 간단한 검색입니다
    const mockResults = {
      users: [
        {
          id: 1,
          type: 'user',
          title: '관리자',
          description: 'admin@brandflow.com - 슈퍼 어드민',
          url: '/users/1'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      campaigns: [
        {
          id: 1,
          type: 'campaign',
          title: '브랜드 인지도 향상 캠페인',
          description: '박클라이언트 - 진행중',
          url: '/campaigns/1'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      posts: [],
      purchases: []
    };

    setResults(mockResults);
  };

  // 검색어 변경 처리
  const handleQueryChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // 디바운싱 (300ms 후 검색)
    setTimeout(() => {
      if (newQuery === query) {
        handleSearch(newQuery);
      }
    }, 300);
  };

  // 검색 아이템 클릭 처리
  const handleItemClick = (item) => {
    console.log('검색 결과 클릭:', item);
    setIsOpen(false);
    setQuery('');
    setResults([]);
    
    // 페이지 이동 또는 모달 열기 등의 처리
    if (item.url) {
      // 실제로는 React Router를 사용하여 페이지 이동
      console.log('이동할 URL:', item.url);
    }
  };

  // 검색 결과 렌더링을 위한 아이콘 선택
  const getIcon = (type) => {
    switch (type) {
      case 'user': return <User size={16} />;
      case 'campaign': return <Briefcase size={16} />;
      case 'post': return <FileText size={16} />;
      case 'purchase': return <DollarSign size={16} />;
      default: return <Search size={16} />;
    }
  };

  // 검색 결과 타입별 색상
  const getTypeColor = (type) => {
    switch (type) {
      case 'user': return 'text-blue-600';
      case 'campaign': return 'text-green-600';
      case 'post': return 'text-purple-600';
      case 'purchase': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const allResults = [
    ...results.users || [],
    ...results.campaigns || [],
    ...results.posts || [],
    ...results.purchases || []
  ];

  return (
    <div className="relative" ref={searchRef}>
      {/* 검색 입력창 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setIsOpen(true)}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="사용자, 캠페인, 업무 검색..."
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && (query.trim() || isLoading) && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="animate-spin inline-block h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="ml-2">검색 중...</span>
            </div>
          ) : allResults.length > 0 ? (
            <div className="py-2">
              {allResults.map((item, index) => (
                <button
                  key={`${item.type}-${item.id}-${index}`}
                  onClick={() => handleItemClick(item)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3"
                >
                  <div className={`mt-1 ${getTypeColor(item.type)}`}>
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </div>
                    <div className={`text-xs mt-1 font-medium ${getTypeColor(item.type)}`}>
                      {item.type === 'user' && '사용자'}
                      {item.type === 'campaign' && '캠페인'}
                      {item.type === 'post' && '업무'}
                      {item.type === 'purchase' && '구매요청'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="px-4 py-6 text-center text-gray-500">
              <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">'{query}'에 대한 검색 결과가 없습니다.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;