"use client"

import { Link } from "react-router-dom"
import ResultsChart from "../components/ResultsChart"

const HomePage = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between py-16 lg:py-20">
            {/* Contenu texte */}
            <div className="lg:w-1/2 lg:pr-12 mb-12 lg:mb-0">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                <span className="text-purple-600">SecretBallot:</span>{" "}
                La Voix des Citoyens
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                SecretBallot est une plateforme innovante qui permet aux citoyens de participer 
                activement aux décisions qui façonnent leur ville. Votez, proposez et suivez les 
                initiatives locales en toute transparence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Rejoindre la Communauté
                </Link>
                <Link
                  to="/about"
                  className="text-blue-600 px-8 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors font-medium"
                >
                  En savoir plus →
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className="lg:w-1/2">
              <img
                src="/4448[1].jpg"
                alt="Illustration vote électronique"
                className="w-full h-auto max-w-lg mx-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Pourquoi nous choisir */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-purple-600 mb-4">
            Pourquoi Choisir SecretBallot?
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto text-center">
            Notre plateforme offre des outils innovants pour renforcer la démocratie participative.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-900 mb-4">
                Sécurité & Transparence
              </h3>
              <p className="text-gray-600 text-center">
                Vos votes sont sécurisés par une technologie blockchain avancée et vérifiables 
                en temps réel, offrant une totale transparence.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-900 mb-4">
                Participation Inclusive
              </h3>
              <p className="text-gray-600 text-center">
                Notre plateforme est accessible à tous les citoyens d'Agadir sans distinction d'âge, 
                d'aptitude ou lieu d'habitation.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-900 mb-4">
                Impact Mesurable
              </h3>
              <p className="text-gray-600 text-center">
                Suivez l'évolution des projets votés et leur impact réel sur la vie.
                Vos votes comptent et nous vous montrons comment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Chart Section */}
      <ResultsChart />
    </div>
  )
}

export default HomePage

