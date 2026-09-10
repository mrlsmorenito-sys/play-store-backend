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

// Función para generar un enlace de descarga directa del APK
function getDirectApkUrl(appId) {
  return `https://d.apkpure.com/b/APK/${appId}?version=latest`;
}

// Función auxiliar para asegurar que las URLs de imágenes sean válidas
function cleanImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  return url;
}

// Endpoint principal / 
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
      icon: cleanImageUrl(app.icon || ""),
      appId: app.appId || "",
      scoreText: app.scoreText || "4.5",
      score: app.score || 4.5,
      downloadUrl: getDirectApkUrl(app.appId),
      bannerAd: cleanImageUrl(app.headerImage || (app.screenshots && app.screenshots.length > 0 ? app.screenshots[0] : ""))
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
      icon: cleanImageUrl(app.icon || ""),
      appId: app.appId || "",
      scoreText: app.scoreText || "4.5",
      score: app.score || 4.5,
      downloadUrl: getDirectApkUrl(app.appId),
      bannerAd: cleanImageUrl(app.headerImage || (app.screenshots && app.screenshots.length > 0 ? app.screenshots[0] : ""))
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
      icon: cleanImageUrl(app.icon || ""),
      appId: app.appId || "",
      scoreText: app.scoreText || "4.5",
      score: app.score || 4.5,
      downloadUrl: getDirectApkUrl(app.appId),
      bannerAd: cleanImageUrl(app.headerImage || (app.screenshots && app.screenshots.length > 0 ? app.screenshots[0] : ""))
    }));

    res.json(formattedApps);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar: " + error.message });
  }
});

// Endpoint completo para la pantalla de Detalles (Incluye descripción, capturas y comentarios reales)
app.get('/api/app', async (req, res) => {
  try {
    const appId = req.query.id;
    if (!appId) {
      return res.status(400).json({ error: "Falta el ID de la aplicación" });
    }

    // Obtenemos los detalles completos de la app y las reseñas de usuarios en paralelo
    const [appDetails, reviewsData] = await Promise.all([
      gplay.detail({ appId: appId, lang: 'es', country: 'mx' }),
      gplay.reviews({ appId: appId, lang: 'es', country: 'mx', num: 10 }).catch(() => [])
    ]);

    // Formatear las reseñas para que sean fáciles de leer en tu app de Sketchware
    const formattedReviews = (Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || [])).map(r => ({
      userName: r.userName || "Usuario",
      score: r.score || 5,
      text: r.text || "",
      date: r.date || ""
    }));

    res.json({
      title: appDetails.title || "Sin título",
      developer: appDetails.developer || "Desconocido",
      icon: cleanImageUrl(appDetails.icon || ""),
      summary: appDetails.summary || "",
      description: appDetails.description || "",
      scoreText: appDetails.scoreText || "4.5",
      score: appDetails.score || 4.5,
      installs: appDetails.installs || "Más de 10,000",
      size: appDetails.size || "Varía según el dispositivo",
      androidVersion: appDetails.androidVersionText || "Varía",
      priceText: appDetails.priceText || "Gratis",
      bannerAd: cleanImageUrl(appDetails.headerImage || ""),
      // Lista completa de URLs de las capturas de pantalla oficiales
      screenshots: (appDetails.screenshots || []).map(img => cleanImageUrl(img)),
      // Comentarios / Reseñas reales de usuarios
      reviews: formattedReviews,
      // Enlace directo optimizado para descargar el APK
      downloadUrl: getDirectApkUrl(appId)
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener detalles: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
