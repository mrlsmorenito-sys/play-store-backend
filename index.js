const express = require('express');
const gplay = require('google-play-scraper');
const app = express();
const PORT = process.env.PORT || 3000;

// Permite accesos desde la app en Sketchware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// Endpoint dinámico para las pestañas de la barra inferior (Today, Games, Apps, Arcade)
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
    res.status(500).json({ error: "Error al obtener datos de Google Play" });
  }
});

// Endpoint de Búsqueda Real
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
    res.status(500).json({ error: "Error al buscar en Google Play" });
  }
});

// Endpoint para obtener detalles completos, comentarios y link de descarga de una app
app.get('/api/app', async (req, res) => {
  try {
    const appId = req.query.id;
    if (!appId) {
      return res.status(400).json({ error: "Falta el ID de la aplicación" });
    }

    const appDetails = await gplay.detail({ appId: appId, lang: 'es', country: 'mx' });
    const reviews = await gplay.reviews({ appId: appId, page: 1, lang: 'es', country: 'mx' });

    res.json({
      title: appDetails.title,
      developer: appDetails.developer,
      icon: appDetails.icon,
      summary: appDetails.summary,
      description: appDetails.description,
      scoreText: appDetails.scoreText,
      installs: appDetails.installs,
      size: appDetails.size,
      screenshots: appDetails.screenshots,
      downloadUrl: appDetails.url,
      reviews: reviews.data ? reviews.data.map(r => ({ userName: r.userName, text: r.text, score: r.score })) : []
    });
  } catch (error) {
    res.status(500).json({ error: "No se pudieron obtener los detalles de la app" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
