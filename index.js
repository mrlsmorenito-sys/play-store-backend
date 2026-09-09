const express = require('express');
const gplay = require('google-play-scraper');
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
  res.json({ status: "API de Google Play funcionando correctamente" });
});

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
    res.status(500).json({ error: "Error al buscar: " + error.message });
  }
});

app.get('/api/app', async (req, res) => {
  try {
    const appId = req.query.id;
    if (!appId) {
      return res.status(400).json({ error: "Falta el ID" });
    }

    const appDetails = await gplay.detail({ appId: appId, lang: 'es', country: 'mx' });

    res.json({
      title: appDetails.title,
      developer: appDetails.developer,
      icon: appDetails.icon,
      summary: appDetails.summary || "",
      description: appDetails.description || "",
      scoreText: appDetails.scoreText || "4.5",
      installs: appDetails.installs || "Desconocido",
      size: appDetails.size || "Varía",
      screenshots: appDetails.screenshots || [],
      downloadUrl: appDetails.url || `https://play.google.com/store/apps/details?id=${appId}`
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener detalles: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
