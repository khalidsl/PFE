"use client"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"

// Composants
import Header from "./components/Header"
import ProtectedRoute from "./components/ProtectedRoute"
import AdminRoute from "./components/AdminRoute"

// Pages
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ElectionsPage from "./pages/ElectionsPage"
import ElectionDetailsPage from "./pages/ElectionDetailsPage"
import VotePage from "./pages/VotePage"
import ResultsPage from "./pages/ResultsPage"
import ProfilePage from "./pages/ProfilePage"
import AdminDashboardPage from "./pages/AdminDashboardPage"
import CreateElectionPage from "./pages/CreateElectionPage"
import EditElectionPage from "./pages/EditElectionPage"
import BlockchainStatusPage from "./pages/BlockchainStatusPage"

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/elections" element={<ElectionsPage />} />
          <Route path="/elections/:id" element={<ElectionDetailsPage />} />

          <Route
            path="/vote/:id"
            element={
              <ProtectedRoute>
                <VotePage />
              </ProtectedRoute>
            }
          />

          <Route path="/results/:id" element={<ResultsPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/elections/create"
            element={
              <AdminRoute>
                <CreateElectionPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/elections/:id/edit"
            element={
              <AdminRoute>
                <EditElectionPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/blockchain"
            element={
              <AdminRoute>
                <BlockchainStatusPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

