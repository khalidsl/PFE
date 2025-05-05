"use client"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  
  const handleLogout = () => {
    logout()
    navigate("/login")
  }
  
  return (
    <header className="bg-white py-4 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold">
              <span className="text-purple-600">Secret</span>
              <span className="text-red-500">Ballot</span>
            </span>
          </Link>

          <nav className="flex items-center space-x-4 lg:space-x-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Accueil
            </Link>
            
            {isAuthenticated && (
              <Link to="/elections" className="text-gray-600 hover:text-gray-900">
                Élections
              </Link>
            )}
            
            <Link to="/how-it-works" className="text-gray-600 hover:text-gray-900">
              Comment ça marche
            </Link>
            
            <Link to="/about" className="text-gray-600 hover:text-gray-900">
              À propos
            </Link>
            
            <Link to="/contact" className="text-gray-600 hover:text-gray-900">
              Contact
            </Link>

            {isAdmin && (
              <Link 
                to="/admin" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Dashboard Admin
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header

