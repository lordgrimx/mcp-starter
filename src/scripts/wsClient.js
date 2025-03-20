const http = require('http');
const { createParser } = require('eventsource-parser');

const args = process.argv.slice(2);
const baseUrl = args[0] || 'http://localhost:3000';
console.log('Connecting to SSE server at:', baseUrl);

function connect() {
    const req = http.get(baseUrl, (res) => {
        if (res.statusCode === 200) {
            console.log('Connected to SSE server');
            
            const parser = createParser((event) => {
                if (event.type === 'event') {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Received:', JSON.stringify(data, null, 2));
                    } catch (err) {
                        console.log('Received raw data:', event.data);
                    }
                }
            });

            res.on('data', (chunk) => {
                parser.feed(chunk.toString());
            });

            res.on('end', () => {
                console.log('Connection closed by server');
                setTimeout(connect, 1000); // Reconnect after 1 second
            });
        } else {
            console.error('Unexpected status code:', res.statusCode);
            setTimeout(connect, 1000);
        }
    });

    req.on('error', (error) => {
        console.error('Connection error:', error.message);
        setTimeout(connect, 1000); // Retry connection after 1 second
    });

    // Handle process termination
    process.on('SIGINT', () => {
        req.destroy();
        console.log('Connection closed');
        process.exit();
    });
}

connect();