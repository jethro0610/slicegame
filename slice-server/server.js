const express = require('express');
const { Http2ServerRequest } = require('http2');
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());

const http = require('http').createServer(app);
http.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});