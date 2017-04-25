'use strict';

/**   
 * Table containing the sessions, with, for each, a range of sharers and
 * joiners. {idSession => {idSession, sharers, joiners} }
 */
class AccessStore extends Map {
    constructor () {
        super();
    };

    /**
     * Stores the sharer that is willing to give an access to its session. If
     * the session already exists, it is added to the range of sharers.
     * @param {string} session The identifier of the session.
     * @param {object} socket The socket of the new sharer.
     * @param {string} id A unique identifier associated with the socket.     
     */
    share (session, socket, id) {
        if (!this.has(session)) {
            this.set(session, { id: session,
                                sharers: new Map(),
                                joiners: new Map() });
        };
        this.get(session).sharers.set(id, socket);
    };

    /**
     * Remove the sharer socket, the session will not be accessible through it
     * any longer. If the session is empty, it is removed.
     * @param {string} session The session identifier from which the sharer
     * withdraws.
     * @param {string} id The unique identifier of the leaving socket
     */
    unshare (session, id) {
        if (this.has(session)) {
            if (this.get(session).sharers.has(id)) {
                this.get(session).sharers.get(id).disconnect();
                this.get(session).sharers.delete(id);
            };
            if (this.get(session).sharers.size <= 0) {
                this.get(session).joiners.forEach( (socket, identifier) => {
                    socket.disconnect();
                    this.get(session).joiners.delete(identifier);
                });
                this.delete(session);
            };
        };      
    };
    
    /**
     * A joiner wants to enter the session.
     * @param {string} session The unique identifier of the session.
     * @param {object} socket The socket from the joiner to this server.
     * @param {string} id The unique identifier of the joiner's socket.
     * @returns {object} The socket of the sharer (null if does not exist).
     */
    join (session, socket, id) {
        let result = null;
        if (this.has(session)) {
            if (this.get(session).sharers.size > 0) {
                let rn = Math.floor(
                    Math.random()*this.get(session).sharers.size);
                let iter = this.get(session).sharers.keys();                
                result = this.get(session).sharers.get(iter.next().value);
                for (let i = 0; i < rn ; ++i){
                    result = this.get(session).sharers.get(iter.next().value);
                };
                this.get(session).joiners.set(id, socket);
            };            
        };
        console.log("@join : sharer " +  result);
        return result;
    };

    /**
     * Get the socket of the joiner in order to answer its request.
     * @param {string} session The unique identifier of the session.
     * @param {string} idJoiner The unique identifier of the joiner requesting
     * access to the session.
     * @returns {object} The socket of the joiner (or null if does not exist).
     */
    answer (session, idJoiner) {
        let result = null;
        if (this.has(session)) {
            if (this.get(session).joiners.has(idJoiner)) {
                result = this.get(session).joiners.get(idJoiner);
            }
        };
        return result;
};

    /**
     * Terminate the joining protocol of a joining peer (TODO).
     * @param {string} originUid The unique site identifier of the sharer.
     * @param {string} joiningUid the unique site identifier of the joiner.
     */
    terminate (session, idJoiner) {
        if (this.has(session)) {
            if (this.get(session).joiners.has(idJoiner)) {
                this.get(session).joiners.delete(idJoiner);
            };
        };
    };
    
};

module.exports = AccessStore;
