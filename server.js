const express = require('express');
require('dotenv').config();
// const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;
const router = require('./routes/index');
app.use(express.json({limit: '10mb'}));
app.use('/', router);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

export default app;