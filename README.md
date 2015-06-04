#simple-signaling-server

This project aims to provide a very simple Nodejs server to ease the very first
signaling part of the WebRTC protocol. It is worth noting that none of the
STUN, ICE, TURN calls are done at the server side. Thus, the server is only a
bridge between two peers which are not connected through WebRTC. Furthermore,
it is called only once, when a user joins the network. The rest of the
membership must be handled by the network itself.

Note that one share opens the access to anyone with the link during the allowed
interval of time. Thus, many users can join using only one link.

## Installation

```
$ git clone https://github.com/Chat-Wane/simple-signaling-server.git
$ cd simple-signaling-server
$ node ./lib/server.js
```

## Client example

In the following example, we have a <i>membership</i> protocol which follows
the specification of the [p2pnetwork](https://github.com/justayak/network.git).
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
var name; // the shared link's identifier
var socketDuration // time before the socket closes automatically (in ms)

var socket = io(signalingAddress, socketIOConfig);
if (initialize){
  // #1A @peer1: share an access to the network
  socket.emit("share", name);
} else {
  // #1B @peer2: send the WebRTC offer in a message to peer1
  membership.launch(
    function(message){
      socket.emit("launch", originName, ourUID, message);
    }
  );
};

// #2A @peer1: receive the initial offer of peer2, sends the according answer
socket.on("launchResponse", function(joinerUID, message){
  membership.answer(message,
    function(answerMessage){
      socket.emit("answer", name, joinerUID, answerMessage);
  });
});

// #2B @peer2: receive the answer of peer1, finalize the handshake protocol
socket.on("answerResponse", function(message){
  membership.handshake(message);
  socket.disconnect();
});

// #3 close the connection after a while
setTimeout(
  function(){
    socket.emit("unshare");
    socket.disconnect();
  }, socketDuration);
```