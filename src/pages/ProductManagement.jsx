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
          // 실제 API 호출 (JWT 인증)
          const response = await api.get('/api/products');
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
        console.warn('ProductManagement: 인증 토큰이 없습니다. 빈 상품 목록으로 설정합니다.');
        setProducts([]);
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
          // 실제 API에서 업무타입 목록을 가져와서 카테고리로 사용 (JWT 인증)
          const response = await api.get('/api/work-types');
          const workTypes = response.data;
          const categories = Array.isArray(workTypes) ? workTypes.map(wt => wt.name) : [];
          
          setCategories(categories);
          console.log('ProductManagement: 실제 업무타입 기반 카테고리 로드:', categories.length, '개');
        } catch (apiError) {
          console.error('ProductManagement: 업무타입 API 호출 실패:', apiError.message);
          // API 실패시 빈 카테고리 사용
          setCategories([]);
        }
      } else {
        console.warn('ProductManagement: 인증 토큰이 없습니다. 빈 카테고리 목록으로 설정합니다.');
        setCategories([]);
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
      // 실제 API 호출 (JWT 인증)
      const response = await api.post('/api/products', {
        ...productData
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
      // 데이터 형식 변환 및 정리
      const formattedData = {
        name: productData.name || null,
        description: productData.description || null,
        sku: productData.sku || null,
        category: productData.category || null,
        costPrice: productData.costPrice ? parseFloat(productData.costPrice) : null,
        sellingPrice: productData.sellingPrice ? parseFloat(productData.sellingPrice) : null,
        unit: productData.unit || null,
        minQuantity: productData.minQuantity ? parseInt(productData.minQuantity) : null,
        maxQuantity: productData.maxQuantity ? parseInt(productData.maxQuantity) : null,
        tags: productData.tags || null
        // isActive는 PUT 요청에서 제외 (백엔드 스키마에 없음)
      };

      // 실제 API 호출 (JWT 인증)
      const response = await api.put(`/api/products/${productId}`, formattedData);
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
      // 실제 API 호출 (JWT 인증)
      const response = await api.delete(`/api/products/${productId}`);
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

  const canManageProducts = ['SUPER_ADMIN', 'AGENCY_ADMIN'].includes(loggedInUser?.role);

  if (isLoading) {
    return <div className="p-8 text-center">상품 목록을 불러오는 중...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-lg md:text-2xl font-bold text-gray-800">상품 및 업무타입 관리</h1>
        {canManageProducts && activeTab === 'products' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 text-white px-3 md:px-4 py-2 md:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1 md:gap-2 min-h-[44px] text-sm md:text-base touch-manipulation"
          >
            <Plus size={16} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">상품 등록</span>
            <span className="sm:hidden">등록</span>
          </button>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-4 md:mb-6">
        <nav className="-mb-px flex space-x-4 md:space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm min-h-[44px] touch-manipulation ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package size={14} className="inline mr-1 md:mr-2 md:w-4 md:h-4" />
            상품 관리
          </button>
          {canManageProducts && (
            <button
              onClick={() => setActiveTab('workTypes')}
              className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm min-h-[44px] touch-manipulation ${
                activeTab === 'workTypes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings size={14} className="inline mr-1 md:mr-2 md:w-4 md:h-4" />
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
      <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base touch-manipulation"
          >
            <option value="">전체 카테고리</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={filters.isActive}
            onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base touch-manipulation"
          >
            <option value="true">활성 상품</option>
            <option value="false">비활성 상품</option>
            <option value="">전체</option>
          </select>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">카테고리</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">SKU</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">원가</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">판매가</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">마진율</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">상태</th>
                {canManageProducts && (
                  <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                      <div>
                        <div className="text-xs md:text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 hidden lg:table-cell">
                    {product.sku || '-'}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                    {product.costPrice?.toLocaleString()}원
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900 hidden md:table-cell">
                    {product.sellingPrice ? `${product.sellingPrice.toLocaleString()}원` : '협의가'}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden lg:table-cell">
                    {product.sellingPrice ? (
                      <span className="text-xs md:text-sm font-medium text-green-600">
                        {product.marginRate}%
                      </span>
                    ) : (
                      <span className="text-xs md:text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden sm:table-cell">
                    {getStatusBadge(product.isActive)}
                  </td>
                  {canManageProducts && (
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
                        >
                          <Edit size={14} className="md:w-4 md:h-4" />
                        </button>
                        {loggedInUser?.role === 'SUPER_ADMIN' && (
                          <button
                            onClick={() => confirmDeleteProduct(product)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
                          >
                            <Trash2 size={14} className="md:w-4 md:h-4" />
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">상품명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base"
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
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">상품 설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[88px] text-base"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">상품 코드 (SKU)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">원가 *</label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">권장 판매가</label>
              <input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base"
                min="0"
                step="0.01"
                placeholder="협의가"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">단위</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">최소 수량</label>
              <input
                type="number"
                value={formData.minQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">최대 수량</label>
              <input
                type="number"
                value={formData.maxQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, maxQuantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">태그 (쉼표로 구분)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-base"
              placeholder="예: 프리미엄, 인기, 신상품"
            />
          </div>

          {product && (
            <div className="flex items-center min-h-[44px]">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2 w-5 h-5"
              />
              <label htmlFor="isActive" className="text-xs md:text-sm font-medium text-gray-700">활성 상품</label>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-3 md:pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 md:py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 min-h-[44px] touch-manipulation text-sm md:text-base"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] touch-manipulation text-sm md:text-base"
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