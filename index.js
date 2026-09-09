const express = require('express');
const gplay = require('google-play-scraper');
const app = express();
const PORT = process.env.PORT || 3000;

// Permite accesos desde la app sin bloqueos CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Función para generar un enlace de descarga directa del APK optimizado para el DownloadManager
function getDirectApkUrl(appId) {
  // Enlace directo estructurado para descarga de binarios en segundo plano
  return `https://d.apkpure.com/b/APK/${appId}?version=latest`;
}

// Endpoint principal / para que la pantalla de inicio no se quede en blanco
app.get('/', async (req, res) => {
  try {
    const results = await gplay.list({
      category: gplay.category.APPLICATION,
      collection: gplay.collection.TOP_FREE,
      num: 20,
      lang: 'es',
      country: 'mx'
    });

    const formattedApps = results.map(app => ({
      title: app.title || "Sin título",
      developer: app.developer || "Desconocido",
      icon: app.icon || "",
      appId: app.appId || "",
      scoreText: app.scoreText || "4.5",
      downloadUrl: getDirectApkUrl(app.appId),
      img1: (app.screenshots && app.screenshots.length > 0) ? app.screenshots[0] : "",
      img2: (app.screenshots && app.screenshots.length > 1) ? app.screenshots[1] : ""
    }));

    res.json(formattedApps);
  } catch (error) {
    res.json({ status: "API de Google Play funcionando correctamente", error: error.message });
  }
});

// Endpoint para las pestañas (Today, Games, Apps)
app.get('/api/apps', async (req, res) => {
  try {
    const tab = req.query.tab || 'apps';
    let category = gplay.category.APPLICATION;
    let collection = gplay.collection.TOP_FREE;

    if (tab === 'games' || tab === 'arcade') {
      category = gplay.category.GAME;
    } else if (tab === 'today') {
      collection = gplay.collection.NEW_FREE;
    }

    const results = await gplay.list({
      category: category,
      collection: collection,
      num: 20,
      lang: 'es',
      country: 'mx'
    });

    const formattedApps = results.map(app => ({
      title: app.title || "Sin título",
      developer: app.developer || "Desconocido",
      icon: app.icon || "",
      appId: app.appId || "",
      scoreText: app.scoreText || "4.5",
      downloadUrl: getDirectApkUrl(app.appId),
      img1: (app.screenshots && app.screenshots.length > 0) ? app.screenshots[0] : "",
      img2: (app.screenshots && app.screenshots.length > 1) ? app.screenshots[1] : ""
    }));

    res.json(formattedApps);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener datos: " + error.message });
  }
});

// Endpoint de Búsqueda Real en tiempo real
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json([]);
    }

    const results = await gplay.search({
      term: query,
      num: 15,
      lang: 'es',
      country: 'mx'
    });

    const formattedApps = results.map(app => ({
      title: app.title || "Sin título",
      developer: app.developer || "Desconocido",
      icon: app.icon || "",
      appId: app.appId || "",
      scoreText: app.scoreText || "4.5",
      downloadUrl: getDirectApkUrl(app.appId),
      img1: (app.screenshots && app.screenshots.length > 0) ? app.screenshots[0] : "",
      img2: (app.screenshots && app.screenshots.length > 1) ? app.screenshots[1] : ""
    }));

    res.json(formattedApps);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar: " + error.message });
  }
});

// Endpoint para obtener detalles completos, link de descarga y capturas
app.get('/api/app', async (req, res) => {
  try {
    const appId = req.query.id;
    if (!appId) {
      return res.status(400).json({ error: "Falta el ID de la aplicación" });
    }

    const appDetails = await gplay.detail({ appId: appId, lang: 'es', country: 'mx' });

    res.json({
      title: appDetails.title || "Sin título",
      developer: appDetails.developer || "Desconocido",
      icon: appDetails.icon || "",
      summary: appDetails.summary || "",
      description: appDetails.description || "",
      scoreText: appDetails.scoreText || "4.5",
      installs: appDetails.installs || "Desconocido",
      size: appDetails.size || "Varía",
      screenshots: appDetails.screenshots || [],
      downloadUrl: getDirectApkUrl(appId)
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener detalles: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
