var PORT = 5000;
var io = require("socket.io")(PORT);
var LRU = require('lru-cache');

/*!
 * \brief a peer is connected to the server. The protocol will allow to 
 * retrieve the offer and create a network. Important notice: this server
 * does not hold the data forever, it must delete over time 
 */
var socketStore = LRU(500);
var socketNumber = 0;

io.on('connection', function(socket){
    socketNumber+=1;
    process.stdout.write("C");
    socket.on("disconnect", function(){
        socketNumber-=1;
        process.stdout.write("D");
    });

    socket.on("launch", function(uid, message){
        if (message===undefined || message===null){
            socketStore.set(JSON.stringify(uid),socket)
        } else {
            if (socketStore.has(uid)){
                var targetSocket = socketStore.get(uid);
                targetSocket.emit("launchResponse", message);
                socketStore.set(uid, socket);
            } else {
                socket.disconnect();
            };
        };
    });
    
    socket.on("answer", function(uid, message){
        var key = JSON.stringify(uid);
        if (socketStore.has(key)){
            var targetSocket = socketStore.get(key);
            targetSocket.emit("answerResponse", message);
        } else {
            socket.disconnect();
        };
    });

});

console.log("Signaling server is running on port: "+PORT);
console.log("CTRL-c to stop the server");

