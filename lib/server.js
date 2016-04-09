var PORT = process.env.PORT || 5000;
var io = require('socket.io')(PORT);

var AccessStore = require('./accessstore.js');
var GUID = require('./guid.js');
var SortedArray = require('sorted-cmp-array');

var assignedSharer = new SortedArray(
    function(a, b){
        var first = a.id || a;
        var second = b.id || b;
        if (first > second) { return 1;};
        if (first < second) { return -1;};
        return 0;
    });

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
            joiner && joiner.emit('answerResponse', message);
        });
                  
    });

    socket.on('launch', function(session, message){
        var index = assignedSharer.indexOf(id);
        if (index >= 0){
            sharer = assignedSharer.arr[index].sharer;
        } else {
            sharer = accessStore.join(session, socket, id);
            sharer && assignedSharer.insert({id: id, sharer: sharer });
        };
        if (sharer){
            sharer.emit('launchResponse', id, message);
        } else {
            socket.disconnect();
        };

        socket.on('disconnect', function(){
            accessStore.terminate(session, id);
            assignedSharer.remove(id);
        });
    });
});

console.log('Signaling server is running on port: '+PORT);
console.log('CTRL-c to stop the server');

