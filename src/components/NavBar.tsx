import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dungeon', label: 'Dungeon', icon: '\uD83C\uDFF0' },
  { to: '/battle', label: 'Battle', icon: '\u2694\uFE0F' },
  { to: '/deck', label: 'Deck', icon: '\uD83C\uDCCF' },
  { to: '/ai', label: 'AI Rules', icon: '\uD83E\uDDE0' },
];

export function NavBar() {
  return (
    <nav className="bg-gray-950 border-b border-gray-800 px-6 py-0 flex items-center gap-1">
      <span className="text-sm font-bold text-gray-300 mr-4">CardForge</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              isActive
                ? 'text-white border-blue-500'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
            }`
          }
        >
          <span className="mr-1.5">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
