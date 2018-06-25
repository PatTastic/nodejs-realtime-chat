var express = require('express');
var Core = express();
var HTTP = require('http').Server(Core);
var IO = require('socket.io')(HTTP);
var users = {};
var rooms = {};
var debug = true;

Core.use(express.static('assets/'));
Core.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

IO.on('connection', function(socket){
    log('User connected: ' + socket.id);

    socket.on('get rooms', function(){
        var publicRooms = rooms;
        for(var room in publicRooms){
            if(publicRooms.hasOwnProperty(room)){
                if(publicRooms[room].options.private == true){
                    delete publicRooms[room];
                }
            }
        }

        IO.emit('display rooms', publicRooms);
    })

    socket.on('room', function(room, isPrivate){
        socket.join(room);

        if(doesExist(rooms[room])){
            rooms[room].users.push(this.client.id);
        }
        else{
            rooms[room] = {
                options: {
                    private: isPrivate
                },
                users: [
                    this.client.id
                ]
            };
        }
    });

    socket.on('user joined', function(user){
        users[user.id] = user;
        user.flair = { colour: '', styles: '' };
        log('user ' + user.nickname + ' joined. ID: ' + user.id);
        IO.emit('user event', {user: user, message: 'joined'});
    });

    socket.on('chat message', function(chat){
        IO.sockets.in(chat.user.inRoom).emit('chat message', chat);
        //IO.emit('chat message', msg);
    });

    socket.on('save options', function(user){
        if(doesExist(users[user.id])){
          users[user.id] = user;
          log(user.name + ' updated their options');
        }
    });

    socket.on('get users', function(){
        IO.emit('list users', users);
    });

    socket.on('disconnect', function(){
        var curUser = {};

        if(doesExist(users[this.client.id])){
            curUser = users[this.client.id];
            delete users[this.client.id];
        }
        if(doesExist(rooms[curUser.inRoom])){
            if(rooms[curUser.inRoom].users.length <= 1){
                delete rooms[curUser.inRoom];
            }
            else{
                for(var i=0; i<rooms[curUser.inRoom].users.length; i++){
                    if(rooms[curUser.inRoom].users[i] == curUser.id){
                        rooms[curUser.inRoom].users.splice(i, 1);
                    }
                }
            }
        }

        log('user ' + curUser.nickname + ' disconnected.');
        IO.emit('user event', {user: curUser, message:'disconnected'});
    });
});

HTTP.listen(3000, function(){
    console.log('listening on *:3000');
});

// Helper Functions //
function doesExist(elem){
    return !(typeof elem === 'undefined' || elem == null);
}

function log(msg){
    if(debug){
        console.log(msg);
    }
}
