// src/pages/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, DollarSign, Tag, TrendingUp, Eye, EyeOff, Settings } from 'lucide-react';
import api from '../api/client';
import WorkTypeManagement from '../components/WorkTypeManagement';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import { getCurrentUser } from '../utils/permissions';

const ProductManagement = ({ loggedInUser }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    isActive: 'true'
  });
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'workTypes'
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, product: null });

  const fetchProducts = async () => {
    if (!loggedInUser?.id) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log('ProductManagement: 토큰 상태:', token ? '존재' : '없음');
      
      if (token) {
        try {
          // 실제 API 호출
          const currentUser = getCurrentUser();
          const params = currentUser?.id ? {
            viewerId: currentUser.id,
            viewerRole: currentUser.role
          } : {};

          const response = await api.get('/api/products', { params });
          let allProducts = response.data.products || response.data;
          
          console.log('ProductManagement: 실제 API 데이터 로드 성공', allProducts.length, '개');
          
          // 필터 적용
          let filteredProducts = allProducts;
          
          if (filters.category && filters.category !== '') {
            filteredProducts = filteredProducts.filter(product => product.category === filters.category);
          }
          
          if (filters.isActive === 'true') {
            filteredProducts = filteredProducts.filter(product => product.isActive === true);
          } else if (filters.isActive === 'false') {
            filteredProducts = filteredProducts.filter(product => product.isActive === false);
          }
          
          setProducts(filteredProducts);
          console.log('ProductManagement: 필터링된 상품:', filteredProducts.length, '개');
          
        } catch (apiError) {
          console.error('ProductManagement: API 호출 실패:', apiError.message);
          // API 실패시 빈 상태로 설정
          setProducts([]);
        }
      } else {
        console.warn('ProductManagement: 인증 토큰이 없어 실제 데이터 직접 로드 시도');
        // 토큰 없이도 실제 상품 데이터 로드 시도
        try {
          const apiUrl = 'https://brandflow-backend-production-99ae.up.railway.app/api/products/?viewerId=1&viewerRole=super_admin';
          const response = await fetch(apiUrl);
          
          if (response.ok) {
            const productData = await response.json();
            const realProducts = productData.data || productData.results || productData;
            
            if (realProducts && Array.isArray(realProducts)) {
              // 필터 적용
              let filteredProducts = realProducts;
              
              if (filters.category && filters.category !== '') {
                filteredProducts = filteredProducts.filter(product => product.category === filters.category);
              }
              
              if (filters.isActive === 'true') {
                filteredProducts = filteredProducts.filter(product => product.isActive === true);
              } else if (filters.isActive === 'false') {
                filteredProducts = filteredProducts.filter(product => product.isActive === false);
              }
              
              setProducts(filteredProducts);
              console.log('ProductManagement: 토큰 없이 실제 상품 데이터 로드 성공:', filteredProducts.length, '개');
            } else {
              setProducts([]);
              console.log('ProductManagement: 상품 데이터가 비어있음');
            }
          } else {
            setProducts([]);
            console.warn('ProductManagement: 상품 API 호출 실패:', response.status);
          }
        } catch (error) {
          console.error('ProductManagement: 토큰 없이 상품 로드 실패:', error);
          setProducts([]);
        }
      }
    } catch (error) {
      console.error('상품 목록 로딩 실패:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          // 실제 API에서 업무타입 목록을 가져와서 카테고리로 사용 (1:1 매핑)
          const currentUser = getCurrentUser();
          const params = currentUser?.id ? {
            viewerId: currentUser.id,
            viewerRole: currentUser.role
          } : {};

          const response = await api.get('/api/work-types', { params });
          const workTypes = response.data;
          const categories = workTypes.map(wt => wt.name);
          
          setCategories(categories);
          console.log('ProductManagement: 실제 업무타입 기반 카테고리 로드:', categories.length, '개');
        } catch (apiError) {
          console.error('ProductManagement: 업무타입 API 호출 실패:', apiError.message);
          // API 실패시 빈 카테고리 사용
          setCategories([]);
        }
      } else {
        console.warn('ProductManagement: 토큰 없이 실제 업무타입 로드 시도');
        // 토큰 없이도 실제 업무타입 로드 시도
        try {
          const response = await fetch('https://brandflow-backend-production-99ae.up.railway.app/api/work-types?viewerId=1&viewerRole=super_admin');
          if (response.ok) {
            const workTypesData = await response.json();
            const workTypes = workTypesData.data || workTypesData.results || workTypesData;
            const categories = Array.isArray(workTypes) ? workTypes.map(wt => wt.name || wt) : [];
            setCategories(categories);
            console.log('ProductManagement: 토큰 없이 실제 업무타입 로드 성공:', categories.length, '개');
          } else {
            setCategories([]);
          }
        } catch (error) {
          console.error('ProductManagement: 토큰 없이 업무타입 로드 실패:', error);
          setCategories([]);
        }
      }
    } catch (error) {
      console.error('ProductManagement: 카테고리 목록 로딩 실패:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [loggedInUser, filters]);

  const handleCreateProduct = async (productData) => {
    try {
      // 실제 API 호출
      const response = await api.post('/api/products', {
        ...productData
      }, {
        params: {
          viewerId: loggedInUser?.id,
          viewerRole: loggedInUser?.role
        }
      });
      showSuccess('상품이 생성되었습니다!');
      fetchProducts();
      setCreateModalOpen(false);
    } catch (error) {
      console.error('상품 생성 실패:', error);
      showError(error.response?.data?.message || '상품 생성에 실패했습니다.');
    }
  };

  const handleUpdateProduct = async (productId, productData) => {
    try {
      // 실제 API 호출
      const response = await api.put(`/api/products/${productId}`, {
        ...productData
      }, {
        params: {
          viewerId: loggedInUser?.id,
          viewerRole: loggedInUser?.role
        }
      });
      showSuccess('상품이 수정되었습니다!');
      fetchProducts();
      setEditModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('상품 수정 실패:', error);
      showError(error.response?.data?.message || '상품 수정에 실패했습니다.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      // 실제 API 호출
      const response = await api.delete(`/api/products/${productId}`, {
        params: {
          viewerId: loggedInUser?.id,
          viewerRole: loggedInUser?.role
        }
      });
      showSuccess('상품이 비활성화되었습니다!');
      fetchProducts();
    } catch (error) {
      console.error('상품 삭제 실패:', error);
      showError(error.response?.data?.message || '상품 삭제에 실패했습니다.');
    }
  };

  const confirmDeleteProduct = (product) => {
    setDeleteConfirm({ isOpen: true, product });
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">활성</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">비활성</span>;
  };

  const canManageProducts = ['슈퍼 어드민', '대행사 어드민'].includes(loggedInUser?.role);

  if (isLoading) {
    return <div className="p-8 text-center">상품 목록을 불러오는 중...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">상품 및 업무타입 관리</h1>
        {canManageProducts && activeTab === 'products' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            상품 등록
          </button>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package size={16} className="inline mr-2" />
            상품 관리
          </button>
          {canManageProducts && (
            <button
              onClick={() => setActiveTab('workTypes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workTypes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings size={16} className="inline mr-2" />
              업무타입 관리
            </button>
          )}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'workTypes' ? (
        <WorkTypeManagement loggedInUser={loggedInUser} />
      ) : (
        <div>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">전체 카테고리</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={filters.isActive}
            onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="true">활성 상품</option>
            <option value="false">비활성 상품</option>
            <option value="">전체</option>
          </select>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">원가</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">권장 판매가</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마진율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                {canManageProducts && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.costPrice?.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sellingPrice ? `${product.sellingPrice.toLocaleString()}원` : '협의가'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.sellingPrice ? (
                      <span className="text-sm font-medium text-green-600">
                        {product.marginRate}%
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(product.isActive)}
                  </td>
                  {canManageProducts && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={16} />
                        </button>
                        {loggedInUser?.role === '슈퍼 어드민' && (
                          <button
                            onClick={() => confirmDeleteProduct(product)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            등록된 상품이 없습니다.
          </div>
        )}
      </div>

      {/* 상품 생성 모달 */}
      {isCreateModalOpen && (
        <ProductModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateProduct}
          categories={categories}
          title="새 상품 등록"
        />
      )}

      {/* 상품 수정 모달 */}
      {isEditModalOpen && selectedProduct && (
        <ProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedProduct(null);
          }}
          onSubmit={(data) => handleUpdateProduct(selectedProduct.id, data)}
          categories={categories}
          product={selectedProduct}
          title="상품 수정"
        />
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, product: null })}
        onConfirm={() => {
          handleDeleteProduct(deleteConfirm.product.id);
          setDeleteConfirm({ isOpen: false, product: null });
        }}
        title="상품 비활성화 확인"
        message={`정말로 '${deleteConfirm.product?.name}' 상품을 비활성화하시겠습니까?`}
        type="warning"
        confirmText="비활성화"
        cancelText="취소"
      />
    </div>
      )}
    </div>
  );
};

// 상품 모달 컴포넌트
const ProductModal = ({ isOpen, onClose, onSubmit, categories, product = null, title }) => {
  const { showWarning } = useToast();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    category: product?.category || '',
    costPrice: product?.costPrice || '',
    sellingPrice: product?.sellingPrice || '',
    unit: product?.unit || '건',
    minQuantity: product?.minQuantity || 1,
    maxQuantity: product?.maxQuantity || '',
    tags: product?.tags || '',
    isActive: product?.isActive !== undefined ? product.isActive : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.costPrice) {
      showWarning('필수 필드를 모두 입력해주세요.');
      return;
    }

    if (formData.sellingPrice && parseFloat(formData.sellingPrice) <= parseFloat(formData.costPrice)) {
      showWarning('판매가는 원가보다 높아야 합니다.');
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품 코드 (SKU)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">원가 *</label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">권장 판매가 (옵셔널)</label>
              <input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="0"
                step="0.01"
                placeholder="비워두면 협의가"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최소 수량</label>
              <input
                type="number"
                value={formData.minQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최대 수량</label>
              <input
                type="number"
                value={formData.maxQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, maxQuantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">태그 (쉼표로 구분)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="예: 프리미엄, 인기, 신상품"
            />
          </div>

          {product && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">활성 상품</label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {product ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductManagement;