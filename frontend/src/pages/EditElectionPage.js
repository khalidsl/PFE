"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { electionsApi } from "../services/api"
import { toast } from "react-toastify"

const EditElectionPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    isActive: false,
    candidates: [],
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const { data } = await electionsApi.getById(id)

        // Formater les dates pour les entrées du formulaire
        const startDate = new Date(data.startDate)
        const endDate = new Date(data.endDate)

        setFormData({
          ...data,
          startDate: formatDateForInput(startDate),
          endDate: formatDateForInput(endDate),
        })

        setLoading(false)
      } catch (error) {
        console.error("Erreur de récupération de l'élection:", error)
        setError("Impossible de charger les détails de l'élection")
        setLoading(false)
      }
    }

    fetchElection()
  }, [id])

  // Fonction utilitaire pour formater la date pour l'entrée datetime-local
  const formatDateForInput = (date) => {
    return date.toISOString().slice(0, 16)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleCandidateChange = (index, e) => {
    const { name, value } = e.target
    const updatedCandidates = [...formData.candidates]
    updatedCandidates[index] = { ...updatedCandidates[index], [name]: value }

    setFormData({
      ...formData,
      candidates: updatedCandidates,
    })
  }

  const addCandidate = () => {
    setFormData({
      ...formData,
      candidates: [...formData.candidates, { name: "", party: "", bio: "", imageUrl: "" }],
    })
  }

  const removeCandidate = (index) => {
    if (formData.candidates.length > 1) {
      const updatedCandidates = formData.candidates.filter((_, i) => i !== index)
      setFormData({
        ...formData,
        candidates: updatedCandidates,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Formater les dates pour l'API
      const apiData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      }

      await electionsApi.update(id, apiData)
      toast.success("Élection mise à jour avec succès")
      navigate("/admin")
    } catch (error) {
      console.error("Erreur de mise à jour de l'élection:", error)
      setError(error.response?.data?.message || "Erreur de mise à jour de l'élection")
      toast.error("Erreur de mise à jour de l'élection")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Vérifier si l'élection est terminée
  const now = new Date()
  const endDate = new Date(formData.endDate)
  const hasEnded = now > endDate

  if (hasEnded) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4">
          Cette élection est terminée et ne peut pas être modifiée.
        </div>
        <button onClick={() => navigate("/admin")} className="btn btn-primary">
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Modifier l'élection</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <label htmlFor="title" className="form-label">
              Titre de l'élection
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="form-input"
              required
            ></textarea>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="startDate" className="form-label">
                Date de début
              </label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="form-label">
                Date de fin
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700">L'élection est active</span>
            </label>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Candidats</h2>
              <button
                type="button"
                onClick={addCandidate}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Ajouter un candidat
              </button>
            </div>

            {formData.candidates.map((candidate, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Candidat {index + 1}</h3>
                  {formData.candidates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCandidate(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Nom</label>
                    <input
                      type="text"
                      name="name"
                      value={candidate.name}
                      onChange={(e) => handleCandidateChange(index, e)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Parti/Affiliation</label>
                    <input
                      type="text"
                      name="party"
                      value={candidate.party}
                      onChange={(e) => handleCandidateChange(index, e)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-gray-700 text-sm font-medium mb-1">Biographie</label>
                  <textarea
                    name="bio"
                    value={candidate.bio || ""}
                    onChange={(e) => handleCandidateChange(index, e)}
                    rows="2"
                    className="form-input"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">URL de l'image</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={candidate.imageUrl || ""}
                    onChange={(e) => handleCandidateChange(index, e)}
                    className="form-input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button type="button" onClick={() => navigate("/admin")} className="btn btn-secondary mr-2">
            Annuler
          </button>

          <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">
            {submitting ? "Mise à jour..." : "Mettre à jour l'élection"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditElectionPage

