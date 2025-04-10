"use client"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            E-Voting System
          </Link>

          <nav className="flex items-center space-x-4">
            <Link to="/elections" className="hover:text-blue-200">
              Élections
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/profile" className="hover:text-blue-200">
                  Profil
                </Link>

                {isAdmin && (
                  <Link to="/admin" className="hover:text-blue-200">
                    Admin
                  </Link>
                )}

                <button onClick={handleLogout} className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">
                  Connexion
                </Link>
                <Link to="/register" className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded">
                  Inscription
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

