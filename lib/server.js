var PORT = process.env.PORT || 5000;
var io = require("socket.io")(PORT);

var AccessStore = require('./accessstore.js');

var accessStore = new AccessStore();

io.on('connection', function(socket){
    console.log("A peer connected to the server");
    socket.on("disconnect", function(){

        // (TODO) improve complexity of this
        var found = false, i=0;
        while(!found && i<accessStore.access.arr.length){
            if (socket.id === accessStore.access.arr[i].origin.id){
                accessStore.unshare(accessStore.access.arr[i].uid);
                found=true;
            };
            ++i;
        };
        console.log("A peer disconnected from the server. Current number "+
                    "of sharers: "+ accessStore.access.arr.length);
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
            origin.emit("launchResponse", uid, message);
        } else {
            socket.disconnect();
        };
    });

    socket.on("answer", function(originUid, destUid, message){
        dest = accessStore.answer(originUid, destUid);
        if (dest !== null){
            dest.emit("answerResponse", message);
            accessStore.terminate(originUid, destUid);
        };
    });
});

console.log("Signaling server is running on port: "+PORT);
console.log("CTRL-c to stop the server");

