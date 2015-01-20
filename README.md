#simple-signaling-server

This project aims to provide a very simple Nodejs server to ease the very first
signaling part of the WebRTC protocol. It is worth noting that none of the
STUN, ICE, TURN calls are done at the server side. Thus, the server is only
a bridge between two peers which are not connected through WebRTC.

## Installation

```
$ git clone https://github.com/Chat-Wane/simple-signaling-server.git
$ cd simple-signaling-server
$ node server.js
```

## Client example

In the following example, we have a membership protocol which follows the
specification of the [p2pnetwork](https://github.com/justayak/network.git).
Also, we use [socket.io](http://socket.io) to dialog with the server:

```html
<script src="./pathToSocketIO/socket.io.js"></script>
```

```js
var signalingAddress; // the address of the signalling server
var socketIOConfig; // options to create a socket.io object
var initialize; // true if you want to share an access to your network
                // false if you want to join a network
var ourUID; // our unique local identifier to give to the other peer
var itsUID; // the unique identifier of the peer which open the network access

var socket = io(signalingAddresses, socketIOConfig);
if (initialize){
  // #1A @peer1: share an access to the network
  socket.emit("launch", ourUID);
} else {
  // #1B @peer2: send the WebRTC offer in a message to peer1
  membership.launch(
    function(message){
      setTimeout(function(){
        socket.emit("launch", itsUID, message);
      }, 1500);
    }
  );
};

// #2A @peer1: receive the initial offer of peer2, sends the according answer
socket.on("launchResponse", function(message){
  membership.answer(message);
  membership.on("answer", function(message){
    socket.emit("answer", UID, message);
  });
  socket.disconnect();
});

// #2B @peer2: receive the answer of peer1, finalize the handshake protocol
socket.on("answerResponse", function(message){
  membership.handshake(message);
  socket.disconnect();
});
```