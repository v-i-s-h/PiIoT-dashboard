var http  = require("http"),
    url   = require("url"),
    path  = require("path"),
    fs    = require("fs"),
    mime  = require("mime")
    port  = process.argv[2] || 8080;

http.createServer( function( request, response) {
    if (path.normalize(decodeURI(request.url)) !== decodeURI(request.url)) {
        response.statusCode = 403;
        response.end();
        return;
    }

    var uri = url.parse( request.url ).pathname;
    var filename = path.join( process.cwd()+"/www/freeboard", uri );

    console.log( new Date() + ": " + uri + "\n" +
                 "        Endpoint: " + filename );

    fs.exists( filename, function(exists) {
        if( !exists ) {
            response.writeHead( 404, {"Content-Type": "text/plain"} );
            response.write( "404 Not Found\n" );
            response.end();
            return;
        }
        if ( fs.statSync(filename).isDirectory() ) {
            filename += '/index.html';
        }
        fs.readFile( filename, "binary", function(err, file ) {
            if(err) {
                response.writeHead( 500, {"Content-Type": "text/plain"} );
                response.write( err + "\n" );
                response.end();
                return;
            }
            response.writeHead( 200, {"Content-Type": mime.lookup(filename)} );
            response.write( file, "binary" );
            response.end();
        });
    });
}).listen( parseInt(port,10) );

console.log( "Dashboard Server running as PORT " + port + "\nPress CTRL + C to stop" );
