import React from 'react';
import { Home, FileText, Users } from 'lucide-react';

const Sidebar = ({ activePage, setActivePage }) => {
    const menus = [
        {id: 'dashboard', label: '대시보드', icon: <Home size={20}/>}, 
        {id: 'campaigns', label: '캠페인 관리', icon: <FileText size={20}/>}, 
        {id: 'users', label: '고객사/사용자 관리', icon: <Users size={20}/>}
    ];
    return (
        <div className="w-64 bg-white border-r p-4 shrink-0">
            <h1 className="text-xl font-bold text-blue-600 mb-8 px-2">BrandFlow</h1>
            <ul>
                {menus.map(menu => (
                    <li key={menu.id} onClick={() => setActivePage(menu.id)}
                        className={`flex items-center p-2 rounded-md cursor-pointer ${activePage === menu.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                        {menu.icon}
                        <span className="ml-3">{menu.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
