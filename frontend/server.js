const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors()); // Разрешаем запросы с фронта

// Принимаем ответы пользователей и сохраняем их
app.post('/submit', (req, res) => {
    const newResponse = req.body;

    fs.readFile('responses.json', (err, data) => {
        let responses = [];
        if (!err) {
            responses = JSON.parse(data);
        }
        responses.push(newResponse);

        fs.writeFile('responses.json', JSON.stringify(responses, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Ошибка сохранения' });
            }
            res.status(200).json({ message: 'Данные сохранены!' });
        });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
