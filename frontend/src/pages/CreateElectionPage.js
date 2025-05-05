"use client"

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { electionsApi } from "../services/api"
import { toast } from "react-toastify"

const CreateElectionPage = () => {
  const navigate = useNavigate()
  const fileInputRefs = useRef([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    isActive: false,
    candidates: [{ name: "", party: "", bio: "", imageUrl: "", imageFile: null, imagePreview: null }],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  const handleImageChange = (index, e) => {
    const file = e.target.files[0]
    if (!file) return;
    
    // Vérifications sur le type et la taille du fichier
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    const maxSizeInMB = 5;
    
    if (!validImageTypes.includes(file.type)) {
      toast.error("Format d'image non supporté. Utilisez JPEG, PNG ou GIF.");
      return;
    }
    
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`L'image est trop volumineuse. Taille maximale: ${maxSizeInMB}MB`);
      return;
    }
    
    const updatedCandidates = [...formData.candidates]
    updatedCandidates[index] = {
      ...updatedCandidates[index],
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }

    setFormData({
      ...formData,
      candidates: updatedCandidates,
    })
  }

  const addCandidate = () => {
    setFormData({
      ...formData,
      candidates: [...formData.candidates, { name: "", party: "", bio: "", imageUrl: "", imageFile: null, imagePreview: null }],
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
    setLoading(true)
    setError(null)

    try {
      // Préparation des données pour l'API
      let apiData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      }
      
      // Traitement des images de candidats (si présentes)
      const candidatesWithImages = await Promise.all(
        formData.candidates.map(async (candidate) => {
          // Si l'utilisateur a téléchargé une image
          if (candidate.imageFile) {
            try {
              // Créer un FormData pour l'upload
              const imageFormData = new FormData();
              imageFormData.append('image', candidate.imageFile);
              
              // Appel API pour télécharger l'image (à adapter selon votre API)
              const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: imageFormData,
              });
              
              if (!response.ok) throw new Error('Échec du téléchargement de l\'image');
              
              const data = await response.json();
              // Retourner le candidat avec l'URL de l'image mise à jour
              return {
                ...candidate,
                imageUrl: data.imageUrl || candidate.imageUrl,
                // Suppression des propriétés temporaires
                imageFile: undefined,
                imagePreview: undefined,
              };
            } catch (error) {
              console.error("Erreur lors du téléchargement de l'image:", error);
              // En cas d'erreur, on garde l'URL existante si disponible
              return {
                ...candidate,
                imageFile: undefined,
                imagePreview: undefined,
              };
            }
          }
          
          // Si pas d'image téléchargée, on retourne le candidat tel quel sans les props temporaires
          return {
            ...candidate,
            imageFile: undefined,
            imagePreview: undefined,
          };
        })
      );
      
      // Mise à jour des données avec les nouvelles URLs d'images
      apiData = {
        ...apiData,
        candidates: candidatesWithImages,
      };

      await electionsApi.create(apiData)
      toast.success("Élection créée avec succès")
      navigate("/admin")
    } catch (error) {
      console.error("Erreur de création de l'élection:", error)
      setError(error.response?.data?.message || "Erreur de création de l'élection")
      toast.error("Erreur de création de l'élection")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Créer une nouvelle élection</h1>

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
              <span className="text-gray-700">Activer l'élection immédiatement</span>
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
                    value={candidate.bio}
                    onChange={(e) => handleCandidateChange(index, e)}
                    rows="2"
                    className="form-input"
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="block text-gray-700 text-sm font-medium mb-1">URL de l'image</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={candidate.imageUrl}
                    onChange={(e) => handleCandidateChange(index, e)}
                    className="form-input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-gray-700 text-sm font-medium mb-1">Importer une photo</label>
                  <input
                    type="file"
                    ref={(el) => (fileInputRefs.current[index] = el)}
                    onChange={(e) => handleImageChange(index, e)}
                    className="form-input"
                  />
                  {candidate.imagePreview && (
                    <img
                      src={candidate.imagePreview}
                      alt={`Preview ${index + 1}`}
                      className="mt-2 max-h-32"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button type="button" onClick={() => navigate("/admin")} className="btn btn-secondary mr-2">
            Annuler
          </button>

          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? "Création..." : "Créer l'élection"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateElectionPage

