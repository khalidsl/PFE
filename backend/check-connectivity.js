const http = require("http")
const os = require("os")

// Obtenir les interfaces réseau
const networkInterfaces = os.networkInterfaces()
console.log("Interfaces réseau disponibles:")

// Afficher toutes les interfaces réseau et leurs adresses IP
Object.keys(networkInterfaces).forEach((interfaceName) => {
  const interfaces = networkInterfaces[interfaceName]

  interfaces.forEach((iface) => {
    // Ignorer les adresses IPv6 et les interfaces loopback non-locales
    if (iface.family === "IPv4" && !iface.internal) {
      console.log(`  ${interfaceName}: ${iface.address}`)
    }
  })
})

// Vérifier si le serveur est accessible
const checkServer = (host, port) => {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host,
        port,
        path: "/api/health",
        method: "GET",
        timeout: 3000,
      },
      (res) => {
        console.log(`Serveur accessible à http://${host}:${port} - Statut: ${res.statusCode}`)
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => {
          try {
            const response = JSON.parse(data)
            console.log("Réponse:", response)
            resolve(true)
          } catch (e) {
            console.log("Réponse non-JSON:", data)
            resolve(true)
          }
        })
      },
    )

    req.on("error", (err) => {
      console.log(`Erreur lors de la connexion à http://${host}:${port}: ${err.message}`)
      resolve(false)
    })

    req.on("timeout", () => {
      console.log(`Timeout lors de la connexion à http://${host}:${port}`)
      req.destroy()
      resolve(false)
    })

    req.end()
  })
}

// Vérifier les connexions
const checkConnections = async () => {
  console.log("\nVérification de la connectivité du serveur...")

  // Vérifier localhost
  await checkServer("localhost", 5000)

  // Vérifier 127.0.0.1
  await checkServer("127.0.0.1", 5000)

  // Vérifier 0.0.0.0
  await checkServer("0.0.0.0", 5000)

  // Vérifier les adresses IP locales
  Object.keys(networkInterfaces).forEach(async (interfaceName) => {
    const interfaces = networkInterfaces[interfaceName]

    for (const iface of interfaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        await checkServer(iface.address, 5000)
      }
    }
  })

  console.log("\nVérification terminée.")
}

checkConnections()
