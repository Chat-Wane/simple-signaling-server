var SortedArray = require("sorted-cmp-array");

function comparator(a,b){
    var first = a.id || a;
    var second = b.id || b;
    if (first < second){ return -1; };
    if (first > second){ return  1; };
    return 0;
};

/*!
 * \brief array containing the sessions, with, for each, a range of sharers and
 * joiners.
 */
function AccessStore(){
    this.access = new SortedArray(comparator);
};

/*!
 * \brief stores the sharer that is willing to give an access to its session. If
 * the session already exists, it is added to the range of sharers.
 * \param session the identifier of the session
 * \param socket the socket of the new sharer
 * \param id a unique identifier associated with the socket
 */
AccessStore.prototype.share = function(session, socket, id){
    var index = this.access.indexOf(session);
    // #1 check if the session identifier exists, and add the entry if not
    if (index<0){
        this.access.insert({ id: session,
                             sharers: new SortedArray(comparator),
                             joiners: new SortedArray(comparator) });
        index = this.access.indexOf(session);
    };
    // #2 add the sharer to the list of potential access
    this.access.arr[index].sharers.insert({id: id, socket: socket});
};

/*!
 * \brief remove the sharer socket, the session will not be accessible through
 * it any longer. If the session is empty, it is removed.
 * \param session the session identifier from which the sharer withdraws
 * \param id the unique identifier of the leaving socket
 */
AccessStore.prototype.unshare = function(session, id){
    var index = this.access.indexOf(session);
    if (index >= 0){
        // #1 search inside the sharers list for the leaving one
        var entryIndex = this.access.arr[index].sharers.indexOf(id);
        // #2 remove the entry from the list
        if (entryIndex >= 0){
            var entry = this.access.arr[index];
            entry.sharers.arr[entryIndex].socket.disconnect();
            entry.sharers.remove(id);
            // #3 remove the joiners if there are no joiners anymore
            if (entry.sharers.arr.length === 0){                
                for (var i=0; i<entry.joiners.arr.length; ++i){
                    entry.joiners.arr[i].socket.disconnect();
                };
                // #4 remove the entry
                this.access.remove(session);
            };
        };
    };
};

/*!
 * \brief A joiner wants to enter the session
 * \param session the unique identifier of the session
 * \param socket the socket from the joiner to this server
 * \param id the unique identifier of the joiner's socket
 * \returns the socket of the sharer (null if does not exist)
 */
AccessStore.prototype.join = function(session, socket, id){
    var sharer, index = this.access.indexOf(session),
        entry;
    // #1 get a sharer of the targeted session
    if (index >= 0){
        entry = this.access.arr[index];
        sharer = entry.sharers.arr[
            Math.floor(Math.random()*entry.sharers.arr.length)];
        entry.joiners.insert({id:id, socket:socket});
    };
    // #2 return the socket of the sharer
    return (sharer && sharer.socket) || null;
};

/*!
 * \brief get the socket of the joiner in order to answer its request
 * \param session the unique identifier of the session
 * \param idJoiner the unique identifier of the joiner requesting access to the
 * session
 * \returns the socket of the joiner (or null if does not exist)
 */
AccessStore.prototype.answer = function(session, idJoiner){
    var indexSession = this.access.indexOf(session),
        joiner, indexJoiner,
        entry;
    
    if (indexSession >= 0){
        entry = this.access.arr[indexSession];
        indexJoiner = entry.joiners.indexOf(idJoiner);
        if (indexJoiner >= 0){
            joiner = entry.joiners.arr[indexJoiner];
        };
    };
    return (joiner && joiner.socket) || null;
};

/*!
 * \brief terminate the joining protocol of a joining peer (TODO)
 * \param originUid the unique site identifier of the sharer
 * \param joiningUid the unique site identifier of the joiner
 */
AccessStore.prototype.terminate = function(session, idJoiner){
    var index = this.access.indexOf(session),
        joiner,
        entry;
    if (index>=0){
        entry = this.access.arr[index];
        entry.joiners.remove(idJoiner);
    };
};

module.exports = AccessStore;
