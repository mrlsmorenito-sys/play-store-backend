// Endpoint dinámico para las pestañas de la barra inferior
app.get('/api/apps', async (req, res) => {
  try {
    const tab = req.query.tab || 'apps';
    let category = gplay.category.APPLICATION;
    let collection = gplay.collection.TOP_FREE;

    // Configuramos los filtros según la pestaña seleccionada
    if (tab === 'games' || tab === 'arcade') {
      category = gplay.category.GAME;
    } else if (tab === 'today') {
      collection = gplay.collection.NEW_FREE; // O editor choice simulado
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
