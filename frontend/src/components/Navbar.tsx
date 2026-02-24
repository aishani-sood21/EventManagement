import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  user: any;
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Helper function to check if route is active
  const isActive = (path: string) => location.pathname === path;

  // Get display name
  const getDisplayName = () => {
    if (user.profile?.firstName) {
      return `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'User';
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => navigate('/dashboard')}>
              🎉 Felicity
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {user.role === 'participant' && (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className={`font-medium transition pb-1 ${
                    isActive('/dashboard') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  🏠 Dashboard
                </button>
                <button 
                  onClick={() => navigate('/browse-events')}
                  className={`font-medium transition pb-1 ${
                    isActive('/browse-events') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  🎫 Browse Events
                </button>
                <button 
                  onClick={() => navigate('/clubs')}
                  className={`font-medium transition pb-1 ${
                    isActive('/clubs') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  🏢 Clubs/Organizers
                </button>
                <button 
                  onClick={() => navigate('/my-events')}
                  className={`font-medium transition pb-1 ${
                    isActive('/my-events') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  📋 My Events
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className={`font-medium transition pb-1 ${
                    isActive('/profile') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  👤 Profile
                </button>
              </>
            )}

            {user.role === 'organizer' && (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className={`font-medium transition pb-1 ${
                    isActive('/dashboard') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  🏠 Dashboard
                </button>
                <button 
                  onClick={() => navigate('/organizer-events')}
                  className={`font-medium transition pb-1 ${
                    isActive('/organizer-events') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  📋 My Events
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className={`font-medium transition pb-1 ${
                    isActive('/profile') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  👤 Profile
                </button>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className={`font-medium transition pb-1 ${
                    isActive('/dashboard') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  🏠 Dashboard
                </button>
                <button 
                  onClick={() => navigate('/admin')}
                  className={`font-medium transition pb-1 ${
                    isActive('/admin') 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  ⚙️ Admin Panel
                </button>
              </>
            )}

            {/* User Badge */}
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-700">{getDisplayName()}</span>
              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {user.role}
              </span>
            </div>

            {/* Logout */}
            <button 
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}