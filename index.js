const WebTorrent = require('webtorrent');
const fs = require('fs');
const http = require('http');
const mime = require('mime');

const client = new WebTorrent();
const torrentFile = './testing.torrent';  // Change to match your torrent file

client.add(torrentFile, torrent => {
    const file = torrent.files.find(file => file.name.endsWith('.mp4') || file.name.endsWith('.mkv'));  // Supports both MP4 and MKV

    if (!file) {
        console.error('No video file found in torrent');
        return;
    }

    console.log('Streaming:', file.name);

    const server = http.createServer((req, res) => {
        const range = req.headers.range;

        if (!range) {
            res.writeHead(400, {'Content-Type': 'text/plain'});
            return res.end('Requires Range header');
        }

        const videoSize = file.length;
        const CHUNK_SIZE = 10 ** 6; // 1MB chunks

        const [start, end] = range.replace(/bytes=/, '').split('-');
        const startByte = parseInt(start, 10);
        const endByte = end ? parseInt(end, 10) : Math.min(startByte + CHUNK_SIZE, videoSize - 1);

        const contentLength = endByte - startByte + 1;
        const headers = {
            'Content-Range': `bytes ${startByte}-${endByte}/${videoSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': mime.getType(file.name)
        };

        res.writeHead(206, headers);

        const stream = file.createReadStream({ start: startByte, end: endByte });
        stream.pipe(res);
    });

    server.listen(3000, () => {
        console.log('Server running at http://localhost:3000');
    });
});
