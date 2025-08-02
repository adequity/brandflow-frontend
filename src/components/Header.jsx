import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut } from 'lucide-react';

const Header = ({ title, onLogout, user }) => {
    const [isProfileOpen, setProfileOpen] = useState(false);
    return (
        <div className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <div className="relative">
                <div onClick={() => setProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">{user?.name?.charAt(0)}</div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button className="text-gray-500 hover:text-gray-700"><ChevronDown size={20} /></button>
                </div>
                {isProfileOpen && (
                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                            <LogOut size={16} className="mr-2"/> 로그아웃
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
