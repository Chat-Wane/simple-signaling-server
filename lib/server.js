var PORT = process.env.PORT || 5000;
var io = require('socket.io')(PORT);

var AccessStore = require('./accessstore.js');
var GUID = require('./guid.js');

var accessStore = new AccessStore();

io.on('connection', function(socket){
    var id = GUID();
    
    console.log('Peer '+ id +' connected to the server');

    socket.on('disconnect', function(){
        console.log('Peer '+ id +' disconnected from the server');
    });
    
    socket.on('share', function(session){
        // #1 register the socket as a sharer of the session in argument
        accessStore.share(session, socket, id);
        // #2 on disconnect, remove the socket from the list of sharers of
        // the session
        socket.on('disconnect', function(){
            accessStore.unshare(session, id);
        });

        socket.on('answer', function(idJoiner, message){
            joiner = accessStore.answer(session, idJoiner);
            if (joiner) {
                joiner.emit('answerResponse', message);
                accessStore.terminate(session, idJoiner);
            };
        });
                  
    });

    socket.on('launch', function(session, message){
        var sharer = accessStore.join(session, socket, id);
        if (sharer){ sharer.emit('launchResponse', id, message);
        } else {
            socket.disconnect();
        };

        socket.on('disconnect', function(){
            accessStore.terminate(session, id);
        });
    });
});

console.log('Signaling server is running on port: '+PORT);
console.log('CTRL-c to stop the server');

