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
        <div className="w-72 bg-gradient-to-b from-white to-neutral-50 border-r border-neutral-200 shrink-0 h-full">
            <div className="p-6">
                <div className="mb-12">
                    <LogoDisplay size="medium" className="justify-start" />
                </div>
                <nav className="space-y-2">
                    {menus.map(menu => (
                        <li key={menu.id} onClick={() => handleMenuClick(menu.id)}
                            className={`
                                group flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ease-in-out
                                ${activePage === menu.id
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-elegant transform scale-[1.02]'
                                    : 'text-neutral-700 hover:bg-white hover:shadow-card hover:text-primary-600 hover:scale-[1.01]'
                                }
                            `}>
                            <div className={`transition-transform duration-200 ${activePage === menu.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                                {menu.icon}
                            </div>
                            <span className={`ml-4 font-medium ${activePage === menu.id ? 'font-semibold' : ''}`}>
                                {menu.label}
                            </span>
                            {activePage === menu.id && (
                                <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75"></div>
                            )}
                        </li>
                    ))}
                </nav>
            </div>
        </div>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
