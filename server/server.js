const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

require("dotenv").config();
const API_KEY = process.env.API_KEY;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/app', express.static(path.join(__dirname, 'app')));


app.get("/api/stations_list", async (req, res) => 
{  
    try 
    {
        const response = await fetch(`https://api.rasp.yandex.net/v3.0/stations_list/?apikey=${API_KEY}&lang=ru_RU`);
        const data = await response.json();
        res.json(data);
    } 
    catch (error) 
    {
        console.error("Ошибка запроса к API (список всех станций):", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


app.get("/api/nearest_stations", async (req, res) => 
{  
    const { lat, lng, transport_types, distance } = req.query;

    try 
    {                                                        
        const response = await fetch(`https://api.rasp.yandex.net/v3.0/nearest_stations/?apikey=${API_KEY}&format=json&lat=${lat}&lng=${lng}&distance=${distance}&lang=ru_RU&transport_types=${transport_types}`);
        const data = await response.json();
        res.json(data);
    } 
    catch (error) 
    {
        console.error("Ошибка запроса к API (ближайшие станции):", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


app.get("/api/search", async (req, res) => 
{  
    const { from, to, date } = req.query;

    try 
    {
        const response = await fetch(`https://api.rasp.yandex.net/v3.0/search/?apikey=${API_KEY}&format=json&from=${from}&to=${to}&lang=ru_RU&page=1&date=${date}`);
        const data = await response.json();
        res.json(data);
    } 
    catch (error) 
    {
        console.error("Ошибка запроса к API (расписание между станциями):", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


app.get("/api/schedule", async (req, res) => 
{  
    const { station, date, event } = req.query;

    try 
    {
        const response = await fetch(`https://api.rasp.yandex.net/v3.0/schedule/?apikey=${API_KEY}&station=${station}&date=${date}&event=${event}`);
        const data = await response.json();
        res.json(data);
    } 
    catch (error) 
    {
        console.error("Ошибка запроса к API (расписание по станции):", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


app.listen(PORT, () => 
{
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
