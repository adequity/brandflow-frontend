import React, { useMemo, useCallback } from 'react';
import { Home, FileText, Users, DollarSign, Package, TrendingUp, Settings, Calculator, Send, Calendar } from 'lucide-react';
import LogoDisplay from './LogoDisplay';

const Sidebar = React.memo(({ activePage, setActivePage }) => {
    const menus = useMemo(() => [
        {id: 'dashboard', label: '대시보드', icon: <Home size={20}/>}, 
        {id: 'campaigns', label: '캠페인 관리', icon: <FileText size={20}/>}, 
        {id: 'purchase-requests', label: '구매요청 관리', icon: <DollarSign size={20}/>},
        {id: 'order-management', label: '발주 관리', icon: <Send size={20}/>},
        {id: 'products', label: '상품 관리', icon: <Package size={20}/>},
        {id: 'sales', label: '매출 관리', icon: <TrendingUp size={20}/>},
        {id: 'monthly-incentives', label: '월간 인센티브 관리', icon: <Calculator size={20}/>},
        {id: 'calendar', label: '일정 관리', icon: <Calendar size={20}/>},
        {id: 'users', label: '고객사/사용자 관리', icon: <Users size={20}/>},
        {id: 'system-settings', label: '시스템 설정', icon: <Settings size={20}/>}
    ], []);

    const handleMenuClick = useCallback((menuId) => {
        setActivePage(menuId);
    }, [setActivePage]);
    return (
        <div className="w-64 bg-white border-r p-4 shrink-0">
            <div className="mb-8 px-2">
                <LogoDisplay size="medium" className="justify-start" />
            </div>
            <ul>
                {menus.map(menu => (
                    <li key={menu.id} onClick={() => handleMenuClick(menu.id)}
                        className={`flex items-center p-2 rounded-md cursor-pointer ${activePage === menu.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                        {menu.icon}
                        <span className="ml-3">{menu.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
