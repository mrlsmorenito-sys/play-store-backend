// Endpoint para obtener los detalles completos de una app por su ID (ej. com.dts.freefireth)
app.get('/api/app', async (req, res) => {
  try {
    const appId = req.query.id;
    if (!appId) {
      return res.status(400).json({ error: "Falta el ID de la aplicación" });
    }

    // Usamos gplay.detail para obtener descripción, capturas, comentarios, etc.
    const appDetails = await gplay.detail({ appId: appId, lang: 'es', country: 'mx' });
    
    // Obtenemos reseñas/comentarios de la app
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
      downloadUrl: appDetails.url, // Enlace oficial o de descarga de la Play Store
      reviews: reviews.data ? reviews.data.map(r => ({ userName: r.userName, text: r.text, score: r.score })) : []
    });
  } catch (error) {
    res.status(500).json({ error: "No se pudieron obtener los detalles de la app" });
  }
});
