const http = require('http');
const url = require('url');
const readline = require('readline');
const fs = require('fs');
const os = require('os');
const dataFile = './arrows_trusses.json';

let sketches = [];

// This will create the readStream, readLine interface, and readLine event handlers for the given fileName
// Returns the readLine object
function processFile(fileName) {
    const readStream = fs.createReadStream(fileName);
    const rl = readline.createInterface({
        input: readStream
    });

    let line_ct = 0;
    rl.on('line', line => {
        line_ct++;
        let sketch = JSON.parse(line);
        let points = arrToObj(sketch.points);
        let strokes = [];
        for (let i = 0; i < sketch.strokes.length; i++) {
            strokes.push(populateStrokePoints(sketch.strokes[i], points));
        }
        sketch.strokes = strokes;
        let substrokes = [];
        for (let i = 0; i < sketch.substrokes.length; i++) {
            let sub = populateStrokePoints(sketch.substrokes[i], points);
            if (sub.points.length > 0) {
                substrokes.push(sub);
            }
        }
        sketch.substrokes = substrokes;
        sketches.push(sketch);
    });

    rl.on('close', () => {
        console.log('Sketch count: ' + line_ct);
        createServer();
    });

    return rl;
}

// Turns an array of points w/ an id property into an object where the key is the id and value is the remaining point properties
function arrToObj(points) {
    const pointObj = {};
    points.forEach(point => {
        let id = point.id;
        delete point.id;
        pointObj[id] = point;
    });
    return pointObj;
}

// Takes a stroke with points that are just IDs and a points object w/ keys that are point IDs. Returns the stroke with the points as x, y, time instead of an ID.
function populateStrokePoints(stroke, points) {
    let pts = [];
    for (let i = 0; i < stroke.points.length; i++) {
        if (points[stroke.points[i]]) {
            pts.push(points[stroke.points[i]]);
        }
    }
    stroke.points = pts;
    return stroke;
}

function handleRequest(req, res) {
    const q = url.parse(req.url, true);
    switch(q.pathname) {
        case '/':
            res.writeHead(200, {"Content-Type": "text/html"});
            let page = fs.readFileSync('index.html');
            res.write(page);
            res.end();
        case '/getSketches':
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(sketches));
        case '/segment.mjs':
            res.writeHead(200, {"Content-Type": "text/javascript"});
            let data = fs.readFileSync('segment.mjs');
            res.end(data);
    }
}

function createServer() {
    http.createServer(handleRequest).listen(3000, () => {
        console.log("Server started at localhost:3000");
        console.log("Terminate server with ctrl+c");
        console.log();
        console.log("No need to restart the server if you change your segmentation algorithm");
        console.log("Simply reload the webpage instead");
    });
}

console.log('Loading sketches')
processFile(dataFile);
