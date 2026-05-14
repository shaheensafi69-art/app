import { Home, CreditCard, ArrowRightLeft, UserCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Navigation() {
  const tabs = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Cards', path: '/cards', icon: CreditCard },
    { name: 'Transfer', path: '/transfer', icon: ArrowRightLeft },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  return (
    <div className="absolute bottom-0 left-0 w-full flex justify-center z-50">
      <div className="w-full glass-card border-t border-slate-700/50 rounded-t-3xl px-6 py-4 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl bg-slate-900/80 pb-safe">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1.5 transition-all duration-200",
                isActive ? "text-emerald-500 scale-110" : "text-slate-400 hover:text-slate-200 hover:scale-105"
              )
            }
          >
            <tab.icon className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-[10px] font-medium tracking-wide uppercase">{tab.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
