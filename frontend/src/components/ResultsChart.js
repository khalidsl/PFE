"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { electionsApi, votesApi } from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ResultsChart = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [electionResults, setElectionResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState('grouped'); // 'grouped' or 'stacked'
  
  // Données mensuelles pour le graphique à barres verticales
  const [monthlyData, setMonthlyData] = useState({
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov'],
    datasets: []
  });

  useEffect(() => {
    // Récupérer la liste des élections terminées
    const fetchElections = async () => {
      try {
        setLoading(true);
        const { data } = await electionsApi.getAll();
        
        // Filtrer uniquement les élections terminées
        const now = new Date();
        const finishedElections = data.filter(election => new Date(election.endDate) < now);
        
        setElections(finishedElections);
        
        if (finishedElections.length > 0) {
          // Sélectionner la première élection par défaut
          setSelectedElection(finishedElections[0]._id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des élections:", err);
        setError("Impossible de charger les élections");
        setLoading(false);
      }
    };
    
    fetchElections();
  }, []);

  useEffect(() => {
    // Récupérer les résultats de l'élection sélectionnée
    const fetchElectionResults = async () => {
      if (!selectedElection) return;
      
      try {
        setLoading(true);
        const { data } = await votesApi.getResults(selectedElection);
        setElectionResults(data);
        
        // Simuler les données mensuelles pour cette élection
        generateMonthlyVoteData(data);
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des résultats:", err);
        setError("Impossible de charger les résultats de l'élection");
        setLoading(false);
      }
    };
    
    fetchElectionResults();
  }, [selectedElection]);

  // Générer des données mensuelles basées sur les résultats
  const generateMonthlyVoteData = (data) => {
    if (!data || !data.results || data.results.length === 0) return;
    
    // Créer deux datasets pour les deux premiers candidats (ou un seul s'il n'y en a qu'un)
    const datasets = [];
    
    if (data.results.length > 0) {
      // Premier groupe - premier candidat
      datasets.push({
        label: `Votes pour ${data.results[0].name}`,
        data: generateRandomMonthlyData(data.results[0].voteCount),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
      });
    }
    
    if (data.results.length > 1) {
      // Deuxième groupe - deuxième candidat
      datasets.push({
        label: `Votes pour ${data.results[1].name}`,
        data: generateRandomMonthlyData(data.results[1].voteCount),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      });
    }
    
    setMonthlyData({
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov'],
      datasets
    });
  };

  // Fonction pour générer des données mensuelles aléatoires qui s'additionnent au total des votes
  const generateRandomMonthlyData = (totalVotes) => {
    const months = 11; // Nombre de mois à représenter
    let remaining = totalVotes;
    const data = [];
    
    for (let i = 0; i < months - 1; i++) {
      // Distribution aléatoire pour chaque mois, en gardant assez pour les mois restants
      const max = Math.floor(remaining / (months - i) * 2);
      const value = Math.max(100, Math.floor(Math.random() * max));
      data.push(value);
      remaining -= value;
    }
    
    // Assigner le reste au dernier mois
    data.push(Math.max(0, remaining));
    
    return data;
  };

  const handleElectionChange = (e) => {
    setSelectedElection(e.target.value);
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Statistiques de votes par mois',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: displayMode === 'stacked',
      },
      y: {
        stacked: displayMode === 'stacked',
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (value >= 1000) {
              return value / 1000 + ' k';
            }
            return value;
          }
        }
      }
    }
  };

  if (loading && !electionResults) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des résultats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              <span className="text-purple-600">Résultats</span> des Votes en Direct
            </h2>
            <p className="text-gray-600">
              Suivez en temps réel l'évolution des votes pour les projets en cours
            </p>
          </div>
          
          {/* Sélecteur d'élection */}
          {elections.length > 0 && (
            <div className="mb-6">
              <label htmlFor="election-select" className="block mb-2 text-sm font-medium text-gray-700">
                Sélectionner une élection:
              </label>
              <select
                id="election-select"
                value={selectedElection || ''}
                onChange={handleElectionChange}
                className="bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              >
                {elections.map(election => (
                  <option key={election._id} value={election._id}>
                    {election.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Graphique à barres horizontales des candidats */}
          {electionResults && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
              <h3 className="text-lg font-semibold mb-4">{electionResults.title} - Résultats</h3>
              <p className="text-sm text-gray-600 mb-6">Total des votes: {electionResults.totalVotes}</p>
              
              <div className="space-y-8">
                {electionResults.results.map((result, index) => {
                  const percentage = electionResults.totalVotes > 0 
                    ? Math.round((result.voteCount / electionResults.totalVotes) * 100) 
                    : 0;
                  
                  // Déterminer la couleur en fonction du candidat
                  let color;
                  switch(index % 3) {
                    case 0:
                      color = "from-purple-500 to-purple-600";
                      break;
                    case 1:
                      color = "from-blue-500 to-blue-600";
                      break;
                    case 2:
                      color = "from-red-500 to-red-600";
                      break;
                    default:
                      color = "from-green-500 to-green-600";
                  }
                  
                  return (
                    <div key={result.candidateId} className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 mr-2"></span>
                          <span className="text-gray-800 font-medium">{result.name}</span>
                          <span className="text-gray-500 ml-2">({result.party})</span>
                        </div>
                        <div>
                          <span className="text-gray-900 font-semibold">{result.voteCount} votes</span>
                          <span className="text-gray-500 ml-2">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${color}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      {index === 0 && result.voteCount > 0 && (
                        <div className="mt-2 text-green-600 font-semibold text-right">Gagnant</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Graphique à barres verticales */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Evolution des votes par mois</h3>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-l-lg ${
                    displayMode === 'grouped' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'
                  }`}
                  onClick={() => setDisplayMode('grouped')}
                >
                  Groupé
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-r-lg ${
                    displayMode === 'stacked' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'
                  }`}
                  onClick={() => setDisplayMode('stacked')}
                >
                  Empilé
                </button>
              </div>
            </div>
            <div style={{ height: '400px' }}>
              <Bar data={monthlyData} options={options} />
            </div>
          </div>
          
          {/* Lien vers toutes les élections */}
          <div className="mt-8 text-center">
            <Link 
              to="/elections" 
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Voir toutes les élections
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsChart