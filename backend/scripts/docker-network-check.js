const http = require("http")
const dns = require("dns")
const os = require("os")

// Fonction pour vérifier la résolution DNS
const checkDns = (hostname) => {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      if (err) {
        console.log(`❌ Échec de la résolution DNS pour ${hostname}: ${err.message}`)
        resolve({ success: false, error: err.message })
      } else {
        console.log(`✅ Résolution DNS réussie pour ${hostname}: ${address}`)
        resolve({ success: true, address })
      }
    })
  })
}

// Fonction pour vérifier la connectivité HTTP
const checkHttp = (host, port, path = "/") => {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host,
        port,
        path,
        method: "GET",
        timeout: 5000,
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => {
          console.log(`✅ Connexion HTTP réussie à ${host}:${port}${path} - Statut: ${res.statusCode}`)
          try {
            const jsonData = JSON.parse(data)
            resolve({ success: true, status: res.statusCode, data: jsonData })
          } catch (e) {
            resolve({ success: true, status: res.statusCode, data })
          }
        })
      },
    )

    req.on("error", (err) => {
      console.log(`❌ Échec de la connexion HTTP à ${host}:${port}${path}: ${err.message}`)
      resolve({ success: false, error: err.message })
    })

    req.on("timeout", () => {
      console.log(`❌ Timeout lors de la connexion à ${host}:${port}${path}`)
      req.destroy()
      resolve({ success: false, error: "Timeout" })
    })

    req.end()
  })
}

// Fonction principale
const runNetworkChecks = async () => {
  console.log("=== VÉRIFICATION DE LA CONNECTIVITÉ RÉSEAU DOCKER ===")
  console.log(`Date et heure: ${new Date().toISOString()}`)
  console.log(`Hostname: ${os.hostname()}`)
  console.log(`Interfaces réseau:`)

  const networkInterfaces = os.networkInterfaces()
  Object.keys(networkInterfaces).forEach((ifName) => {
    networkInterfaces[ifName].forEach((iface) => {
      if (iface.family === "IPv4") {
        console.log(`  ${ifName}: ${iface.address}`)
      }
    })
  })

  console.log("\n=== VÉRIFICATION DNS ===")
  await checkDns("mongodb")
  await checkDns("backend")
  await checkDns("frontend")
  await checkDns("localhost")

  console.log("\n=== VÉRIFICATION HTTP ===")
  // Vérifier la connectivité au backend depuis ce conteneur
  await checkHttp("backend", 5000, "/api/health")
  await checkHttp("localhost", 5000, "/api/health")

  // Vérifier la connectivité à MongoDB
  await checkHttp("mongodb", 27017)

  console.log("\n=== VÉRIFICATION TERMINÉE ===")
}

// Exécuter les vérifications
runNetworkChecks().catch(console.error)
