"use client"

import React from "react"

const HowItWorksPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-purple-600">Comment ça marche</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">Processus de vote sécurisé</h2>
        <p className="text-gray-700 mb-6">
          SecretBallot utilise une technologie de blockchain avancée pour garantir l'intégrité et la transparence 
          de chaque vote tout en préservant l'anonymat des électeurs.
        </p>
        
        <div className="space-y-8">
          <div className="flex items-start">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <span className="text-xl font-bold text-purple-600">1</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Inscription et vérification</h3>
              <p className="text-gray-600">
                Créez un compte avec votre adresse e-mail. Un code de vérification vous sera envoyé pour confirmer votre identité.
                Cela garantit que seules les personnes autorisées peuvent participer aux élections.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <span className="text-xl font-bold text-purple-600">2</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Participation aux élections</h3>
              <p className="text-gray-600">
                Parcourez la liste des élections actives auxquelles vous êtes éligible. Consultez les informations détaillées
                sur chaque candidat et les propositions avant de faire votre choix.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <span className="text-xl font-bold text-purple-600">3</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Vote sécurisé</h3>
              <p className="text-gray-600">
                Soumettez votre vote de manière anonyme. Votre vote est immédiatement chiffré et ajouté à la blockchain,
                ce qui garantit qu'il ne peut pas être modifié une fois enregistré.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <span className="text-xl font-bold text-purple-600">4</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Vérification transparente</h3>
              <p className="text-gray-600">
                Vous recevez une confirmation unique que votre vote a bien été comptabilisé. Vous pouvez vérifier à tout moment
                que votre vote est toujours présent dans la blockchain sans révéler votre choix.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <span className="text-xl font-bold text-purple-600">5</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Résultats transparents</h3>
              <p className="text-gray-600">
                À la fin de l'élection, les résultats sont automatiquement calculés et publiés. Chaque vote peut être vérifié
                indépendamment, garantissant ainsi une comptabilisation exacte et transparente.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Technologie blockchain</h2>
        <p className="text-gray-700 mb-4">
          Notre système utilise une blockchain privée et sécurisée qui offre plusieurs avantages clés par rapport aux
          systèmes de vote traditionnels :
        </p>
        
        <ul className="list-disc pl-5 space-y-2 text-gray-600 mb-6">
          <li><strong className="text-blue-600">Immuabilité</strong> : Une fois qu'un vote est enregistré, il ne peut pas être modifié ou supprimé.</li>
          <li><strong className="text-blue-600">Transparence</strong> : Tous les votes sont vérifiables publiquement, mais les choix individuels restent anonymes.</li>
          <li><strong className="text-blue-600">Décentralisation</strong> : Le système ne dépend pas d'une autorité centrale, ce qui réduit les risques de manipulation.</li>
          <li><strong className="text-blue-600">Sécurité</strong> : Le chiffrement avancé protège l'intégrité du processus de vote.</li>
        </ul>
        
        <p className="text-gray-700">
          Chaque transaction de vote est validée par un processus de consensus avant d'être ajoutée à la blockchain,
          garantissant ainsi que seuls les votes légitimes sont comptabilisés.
        </p>
      </div>
    </div>
  )
}

export default HowItWorksPage