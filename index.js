const express = require('express');
const gplay = require('google-play-scraper');
const app = express();
const PORT = process.env.PORT || 3000;

// Permite accesos desde la app en Sketchware sin bloqueos CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Endpoint de prueba para verificar que el servidor está activo en JSON y no HTML
app.get('/', (req, res) => {
  res.json({ status: "API de Google Play funcionando correctamente" });
});

// Endpoint dinámico para las pestañas (Today, Games, Apps)
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
      title: app.title,
      developer: app.developer,
      icon: app.icon,
      appId: app.appId,
      scoreText: app.scoreText || "4.5"
    }));

    res.json(formattedApps);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener datos de Google Play: " + error.message });
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
      title: app.title,
      developer: app.developer,
      icon: app.icon,
      appId: app.appId,
      scoreText: app.scoreText || "4.5"
    }));

    res.json(formattedApps);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar en Google Play: " + error.message });
  }
});

// Endpoint para obtener detalles completos, link de descarga (Play Store/APK oficial) y capturas
app.get('/api/app', async (req, res) => {
  try {
    const appId = req.query.id;
    if (!appId) {
      return res.status(400).json({ error: "Falta el ID de la aplicación" });
    }

    const appDetails = await gplay.detail({ appId: appId, lang: 'es', country: 'mx' });
    let reviewsData = [];
    
    try {
      const reviews = await gplay.reviews({ appId: appId, page: 1, lang: 'es', country: 'mx' });
      reviewsData = reviews.data ? reviews.data.map(r => ({ userName: r.userName, text: r.text, score: r.score })) : [];
    } catch (revError) {
      reviewsData = []; // Si las reseñas fallan por restricciones geográficas, evitamos que rompa toda la petición
    }

    res.json({
      title: appDetails.title,
      developer: appDetails.developer,
      icon: appDetails.icon,
      summary: appDetails.summary || "",
      description: appDetails.description || "",
      scoreText: appDetails.scoreText || "4.5",
      installs: appDetails.installs || "Desconocido",
      size: appDetails.size || "Varía según dispositivo",
      screenshots: appDetails.screenshots || [],
      downloadUrl: appDetails.url || `https://play.google.com/store/apps/details?id=${appId}`,
      reviews: reviewsData
    });
  } catch (error) {
    res.status(500).json({ error: "No se pudieron obtener los detalles de la app: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
