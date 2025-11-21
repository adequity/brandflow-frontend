import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut, Search, Menu } from 'lucide-react';
import NotificationBell from './common/NotificationBell';

const Header = ({ title, onLogout, user, onMenuClick }) => {
    const [isProfileOpen, setProfileOpen] = useState(false);
    return (
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-neutral-200 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-40">
            <div className="flex items-center space-x-3 md:space-x-6">
                {/* 모바일 햄버거 메뉴 */}
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 hover:bg-neutral-100 rounded-lg transition-colors touch-manipulation"
                        aria-label="메뉴 열기"
                    >
                        <Menu size={24} className="text-neutral-700" />
                    </button>
                )}
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-none">
                    {title}
                </h1>
            </div>

            <div className="flex items-center space-x-3 md:space-x-6">
                {/* 검색 기능 */}
                <div className="hidden md:flex items-center bg-neutral-100 hover:bg-neutral-200 rounded-full px-4 py-2 transition-colors cursor-pointer group">
                    <Search className="text-neutral-500 group-hover:text-primary-600 transition-colors" size={18} />
                    <span className="ml-2 text-sm text-neutral-600 group-hover:text-primary-600">검색</span>
                </div>

                {/* 알림 */}
                <NotificationBell />

                {/* 프로필 영역 */}
                <div className="relative">
                    <div
                        onClick={() => setProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-2 md:space-x-3 cursor-pointer p-2 rounded-xl hover:bg-neutral-100 transition-colors group touch-manipulation min-h-[44px]"
                    >
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center font-bold text-white shadow-elegant text-sm md:text-base">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-neutral-800">{user?.name}</p>
                            <p className="text-xs text-neutral-500">{user?.role}</p>
                        </div>
                        <ChevronDown
                            className={`hidden sm:block text-neutral-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''} group-hover:text-primary-600`}
                            size={18}
                        />
                    </div>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-elegant border border-neutral-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-neutral-100">
                                <p className="text-sm font-semibold text-neutral-800">{user?.name}</p>
                                <p className="text-xs text-neutral-500">{user?.email}</p>
                                <span className="inline-block mt-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-md font-medium">
                                    {user?.role}
                                </span>
                            </div>
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-red-50 hover:text-red-600 flex items-center transition-colors group"
                            >
                                <LogOut size={16} className="mr-3 group-hover:scale-110 transition-transform"/>
                                로그아웃
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
