"use client"

import React from "react"

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-purple-600">À propos de SecretBallot</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">Notre mission</h2>
        <p className="text-gray-700 mb-6">
          SecretBallot a été créé avec une mission claire : rendre le processus démocratique plus accessible, 
          transparent et sécurisé pour tous. Nous croyons que la participation civique est la pierre angulaire 
          d'une société saine et que la technologie moderne peut renforcer considérablement la confiance dans 
          les processus électoraux.
        </p>
        
        <p className="text-gray-700 mb-6">
          Notre plateforme combine l'accessibilité du vote électronique avec la sécurité et la transparence 
          de la technologie blockchain, créant ainsi un système où chaque voix compte véritablement et où 
          l'intégrité du processus ne peut être remise en question.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Notre équipe</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full h-24 w-24 mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">MS</span>
            </div>
            <h3 className="font-semibold text-lg">khalid salhi</h3>
            <p className="text-gray-600">Directrice Générale</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 rounded-full h-24 w-24 mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">TL</span>
            </div>
            <h3 className="font-semibold text-lg">khadija </h3>
            <p className="text-gray-600">Directeur Technique</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 rounded-full h-24 w-24 mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">SB</span>
            </div>
            <h3 className="font-semibold text-lg">amlal </h3>
            <p className="text-gray-600">Responsable Sécurité</p>
          </div>
        </div>
        
        <p className="text-gray-700">
          Notre équipe diversifiée combine expertise technique, connaissance approfondie des systèmes électoraux 
          et engagement envers les principes démocratiques. Nous travaillons constamment à améliorer notre plateforme 
          pour répondre aux besoins évolutifs de nos utilisateurs et aux défis émergents en matière de sécurité.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">Nos valeurs</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-1 text-blue-600">Transparence</h3>
            <p className="text-gray-600">
              Nous croyons que chaque aspect du processus électoral devrait être transparent et vérifiable 
              par tous les participants.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-1 text-blue-600">Sécurité</h3>
            <p className="text-gray-600">
              Nous ne compromettons jamais la sécurité de notre plateforme, utilisant les technologies les 
              plus avancées pour protéger l'intégrité du vote.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-1 text-blue-600">Accessibilité</h3>
            <p className="text-gray-600">
              Nous nous engageons à rendre la participation démocratique accessible à tous, quelles que soient 
              les contraintes géographiques ou physiques.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-1 text-blue-600">Innovation</h3>
            <p className="text-gray-600">
              Nous explorons continuellement de nouvelles technologies et méthodes pour améliorer l'expérience 
              de vote et renforcer la sécurité de notre système.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage