var SortedArray = require("sorted-cmp-array");
var JoiningArray = require("./joiningarray.js")

/*!
 * array containing all the sockets to peers sharing their network access
 */
function AccessStore(){
    this.access = new SortedArray(
        function(a,b){
            if (a.uid < b.uid){ return -1; };
            if (a.uid > b.uid){ return  1; };
            return 0;
        }
    );
};

/*!
 * \brief store the socket of the peer willing to share the access to its 
 * network
 * \param uid the unique site identifier of the peer that shares the access
 * \param socket the socket to access this peer
 */
AccessStore.prototype.share = function(uid, socket){
    if (this.access.indexOf({uid:uid})<0){
        this.access.insert({ uid: uid,
                             origin: socket,
                             joinings: new JoiningArray()
                           });
    };
};

/*!
 * \brief a sharer wants to unshare its access to the network
 * \param uid the unique site identifier of the sharer
 */
AccessStore.prototype.unshare = function(uid){
    var sharer, index = this.access.indexOf({uid:uid});
    // #1 get the sharer that wishes to stop to share its access
    if (index >= 0){
        sharer = this.access.arr[index];
        // #2 disconnect the sharer
        sharer.origin.disconnect();
        // #3 disconnect all the joining sockets, except if they are sharers
        for (var i=0; i<sharer.joinings.joinings.arr.length; ++i){
            console.log("uid =" + sharer.joinings.joinings.arr[i].uid);
            if (this.access.indexOf(sharer.joinings.joinings.arr[i])<0){
                console.log("disconnect joiner");
                sharer.joinings.joinings.arr[i].socket.disconnect();
            };
        };
        // #4 remove the entry
        this.access.remove({uid:uid});
    };
};

/*!
 * \brief a peer wants to join the network using the sharer identifier he 
 * received
 * \param originUid the unique site identifier of the sharer
 * \param uid the unique site identifier of the joiner
 * \param socket the socket from the joiner to this server
 * \returns the socket of the sharer ( null if does not exist)
 */
AccessStore.prototype.join = function(originUid, uid, socket){
    var sharer, index = this.access.indexOf({uid:originUid});
    // #1 get the sharer
    if (index >= 0){
        sharer = this.access.arr[index];
        sharer.joinings.add(uid, socket);        
    };
    // #2 return the socket of the sharer
    return (sharer && sharer.origin) || null;
};

/*!
 * \brief get the socket of the joiner in order to answer its request
 * \param originUid the unique site identifier of the sharer
 * \param joiningUid the unique site identifier of the joiner
 * \returns the socket of the joiner (or null if does not exist)
 */
AccessStore.prototype.answer = function(originUid, joiningUid){
    var sharer,  indexSharer = this.access.indexOf({uid:originUid}),
        joiner, indexJoiner;
    
    if (indexSharer >= 0){
        sharer = this.access.arr[indexSharer];
        indexJoiner = sharer.joinings.joinings.indexOf({uid:joiningUid});
        if (indexJoiner >= 0){
            joiner = sharer.joinings.joinings.arr[indexJoiner];
        };
    };
    return (joiner && joiner.socket) || null;
};

/*!
 * \brief terminate the joining protocol of a joining peer
 * \param originUid the unique site identifier of the sharer
 * \param joiningUid the unique site identifier of the joiner
 */
AccessStore.prototype.terminate = function(originUid, joiningUid){
    var sharer,  indexSharer = this.access.indexOf({uid:originUid}),
        indexJoinerSharer = this.access.indexOf({uid:joiningUid}),
        indexJoiner;
    
    if (indexSharer >= 0){
        sharer = this.access.arr[indexSharer];
        indexJoiner = sharer.joinings.joinings.indexOf({uid:joiningUid});
        if (indexJoiner >= 0){
            if (indexJoinerSharer < 0){ // joiner is not a sharer
                sharer.joinings.joinings.arr[indexJoiner].socket.disconnect();
            };
            sharer.joinings.del(joiningUid);
        };
    };
};

module.exports = AccessStore;
