'use strict';

const PORT = process.env.PORT || 5000;
const io = require('socket.io')(PORT);
const uuid = require('uuid/v4');

const AccessStore = require('./accessstore.js');

let accessStore = new AccessStore();
let assignedSharer = new Map();

io.on('connection', (socket) => {
    var id = uuid();
    
    console.log('Peer '+ id +' connected to the server');

    socket.on('disconnect', () =>
                console.log('Peer %s disconnected from the server', id));
    
    socket.on('share', (session) => {
        console.log('SHARE ' + id);
        // #1 register the socket as a sharer of the session in argument
        accessStore.share(session, socket, id);
        // #2 on disconnect, remove the socket from the list of sharers of
        // the session
        socket.on('disconnect', () => {
            accessStore.unshare(session, id);
        });

        socket.on('answer', (idJoiner, message) => {
            const joiner = accessStore.answer(session, idJoiner);
            console.log('answer %s -> %s', id, idJoiner);
            console.log(joiner);
            joiner && joiner.emit('answerResponse', message);
        });
                  
    });

    socket.on('launch', (session, message) => {
        let sharer = null;
        console.log('launch');
        if (assignedSharer.has(id) && assignedSharer.get(id).has(session)) {
            sharer = assignedSharer.get(id).get(session);
        } else {
            sharer = accessStore.join(session, socket, id);
            if (sharer) {
                if (!assignedSharer.has(id)) {
                    assignedSharer.set(id, new Map());
                };
                assignedSharer.get(id).set(session, sharer);
            };
        };
        
        console.log('sharer ' + sharer);
        if (sharer){
            console.log('RESP' + message);
            sharer.emit('launchResponse', id, message);
        } else {
            socket.disconnect();
        };

        socket.on('disconnect', function(){
            accessStore.terminate(session, id);
            if (assignedSharer.has(id)) {
                assignedSharer.delete(id);
            };
        });
    });
});

console.log('Signaling server is running on port: '+PORT);
console.log('CTRL-c to stop the server');

