var SortedArray = require("sorted-cmp-array");

/*!
 * array containing the peers wanting to join the network using a particular
 * link. Socket are sorted by uid and uid cannot be found twice.
 */
function JoiningArray(){
    this.joinings = new SortedArray(
        function(a,b){
            if (a.uid < b.uid){ return -1; };
            if (a.uid > b.uid){ return  1; };
            return 0;
        }
    );
};

/*!
 * \brief add the socket to the list of joining peer
 * \param uid the unique site identifier which wants to join the network
 * \param socket the socket between the peer and the signaling server
 */
JoiningArray.prototype.add = function(uid, socket){
    if (this.joinings.indexOf({uid:uid}) < 0){
        this.joinings.insert({uid:uid, socket:socket});
    };
};

/*!
 * \brief remove the uid and its socket from the list of joining peer, either
 * because it has successfully joined the network, in which case it does not 
 * need the server anymore, or because the joining failed, or timeout.
 * \param uid the unique site identiier of the joining peer to remove
 */
JoiningArray.prototype.del = function(uid){
    this.joinings.remove({uid:uid});
};

module.exports = JoiningArray;
