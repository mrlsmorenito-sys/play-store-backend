const express = require("express");
const gplay = require("google-play-scraper");

const app = express();

const PORT = process.env.PORT || 3000;


// ==============================
// CORS
// ==============================

app.use(function (req, res, next) {

    res.header(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );

    next();
});


// ==============================
// UTILIDADES
// ==============================

function cleanImageUrl(url) {

    if (!url) {
        return "";
    }

    url = String(url).trim();

    if (url.startsWith("//")) {
        return "https:" + url;
    }

    return url;
}


function getDirectApkUrl(appId) {

    if (!appId) {
        return "";
    }

    return "https://d.apkpure.com/b/APK/"
        + encodeURIComponent(appId)
        + "?version=latest";
}


function formatApp(app) {

    return {

        title: app.title || "Sin título",

        developer:
            app.developer ||
            "Desconocido",

        icon:
            cleanImageUrl(
                app.icon || ""
            ),

        appId:
            app.appId || "",

        scoreText:
            app.scoreText || "4.5",

        score:
            app.score || 4.5,

        downloadUrl:
            getDirectApkUrl(
                app.appId
            ),

        bannerAd:
            cleanImageUrl(
                app.headerImage ||
                (
                    app.screenshots &&
                    app.screenshots.length > 0
                )
                    ? app.screenshots[0]
                    : ""
            )
    };
}


// ==============================
// INICIO
// ==============================

app.get("/", async function (req, res) {

    try {

        const results =
            await gplay.list({

                category:
                    gplay.category.APPLICATION,

                collection:
                    gplay.collection.TOP_FREE,

                num: 20,

                lang: "es",

                country: "mx"
            });


        const formattedApps =
            results.map(formatApp);


        res.json(formattedApps);

    } catch (error) {

        res.status(500).json({

            status:
                "Error al obtener aplicaciones",

            error:
                error.message
        });
    }
});


// ==============================
// APPS / GAMES / TODAY
// ==============================

app.get(
    "/api/apps",
    async function (req, res) {

        try {

            const tab =
                req.query.tab || "apps";


            let category =
                gplay.category.APPLICATION;


            let collection =
                gplay.collection.TOP_FREE;


            if (
                tab === "games" ||
                tab === "arcade"
            ) {

                category =
                    gplay.category.GAME;
            }


            if (tab === "today") {

                collection =
                    gplay.collection.NEW_FREE;
            }


            const results =
                await gplay.list({

                    category: category,

                    collection: collection,

                    num: 20,

                    lang: "es",

                    country: "mx"
                });


            const formattedApps =
                results.map(formatApp);


            res.json(formattedApps);

        } catch (error) {

            res.status(500).json({

                error:
                    "Error al obtener datos: "
                    + error.message
            });
        }
    }
);


// ==============================
// BUSCAR
// ==============================

app.get(
    "/api/search",
    async function (req, res) {

        try {

            const query =
                req.query.q;


            if (
                !query ||
                String(query).trim().length === 0
            ) {

                return res.json([]);
            }


            const results =
                await gplay.search({

                    term:
                        String(query).trim(),

                    num: 15,

                    lang: "es",

                    country: "mx"
                });


            const formattedApps =
                results.map(formatApp);


            res.json(formattedApps);

        } catch (error) {

            res.status(500).json({

                error:
                    "Error al buscar: "
                    + error.message
            });
        }
    }
);


// ==============================
// DETALLES
// ==============================

app.get(
    "/api/app",
    async function (req, res) {

        try {

            const appId =
                req.query.id;


            if (!appId) {

                return res.status(400).json({

                    error:
                        "Falta el ID de la aplicación"
                });
            }


            const details =
                await gplay.detail({

                    appId: appId,

                    lang: "es",

                    country: "mx"
                });


            let reviewsData = [];


            try {

                reviewsData =
                    await gplay.reviews({

                        appId: appId,

                        lang: "es",

                        country: "mx",

                        num: 10
                    });

            } catch (reviewError) {

                reviewsData = [];
            }


            const reviews =
                Array.isArray(reviewsData)
                    ? reviewsData
                    : (
                        reviewsData &&
                        Array.isArray(reviewsData.data)
                            ? reviewsData.data
                            : []
                    );


            const formattedReviews =
                reviews.map(function (r) {

                    return {

                        userName:
                            r.userName ||
                            "Usuario",

                        score:
                            r.score || 5,

                        text:
                            r.text || "",

                        date:
                            r.date || ""
                    };
                });


            res.json({

                title:
                    details.title ||
                    "Sin título",

                developer:
                    details.developer ||
                    "Desconocido",

                icon:
                    cleanImageUrl(
                        details.icon || ""
                    ),

                summary:
                    details.summary || "",

                description:
                    details.description || "",

                scoreText:
                    details.scoreText ||
                    "4.5",

                score:
                    details.score ||
                    4.5,

                installs:
                    details.installs ||
                    "Más de 10,000",

                size:
                    details.size ||
                    "Varía según el dispositivo",

                androidVersion:
                    details.androidVersionText ||
                    "Varía",

                priceText:
                    details.priceText ||
                    "Gratis",

                bannerAd:
                    cleanImageUrl(
                        details.headerImage || ""
                    ),

                screenshots:
                    (
                        details.screenshots || []
                    ).map(function (img) {

                        return cleanImageUrl(img);
                    }),

                reviews:
                    formattedReviews,

                downloadUrl:
                    getDirectApkUrl(appId)
            });

        } catch (error) {

            res.status(500).json({

                error:
                    "Error al obtener detalles: "
                    + error.message
            });
        }
    }
);


// ==============================
// SERVIDOR
// ==============================

app.listen(
    PORT,
    function () {

        console.log(
            "Servidor corriendo en el puerto "
            + PORT
        );
    }
);
