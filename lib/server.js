var PORT = process.env.PORT || 5000;
var io = require("socket.io")(PORT);

var AccessStore = require('./accessstore.js');

var accessStore = new AccessStore();

io.on('connection', function(socket){
    console.log("A peer connected to the server");
    socket.on("disconnect", function(){
        console.log("A peer disconnected from the server");
    });
    
    socket.on("share", function(uid){
        accessStore.share(uid, socket);
    });

    socket.on("unshare", function(uid){
        accessStore.unshare(uid);
    });
    
    socket.on("launch", function(originUid, uid, message){
        var origin = accessStore.join(originUid, uid, socket);
        if (origin !== null){
            origin.emit("launchResponse", message);
        } else {
            socket.disconnect();
        };
    });

    socket.on("answer", function(originUid, message){
        var uid = message.destUid, dest = accessStore.answer(originUid, uid);
        if (dest !== null){
            dest.emit("answerResponse", message);
            accessStore.terminate(originUid, uid);
        };
    });
});

console.log("Signaling server is running on port: "+PORT);
console.log("CTRL-c to stop the server");
