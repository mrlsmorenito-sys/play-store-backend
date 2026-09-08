const express = require('express');
const gplay = require('google-play-scraper');
const app = express();
const PORT = process.env.PORT || 3000;

// Permite accesos desde la app en Sketchware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// Endpoint para obtener aplicaciones populares
app.get('/api/apps', async (req, res) => {
  try {
    const results = await gplay.list({
      category: gplay.category.GAME,
      collection: gplay.collection.TOP_FREE,
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

// Endpoint de Búsqueda Real (¡Este era el que faltaba en tu index.js!)
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
