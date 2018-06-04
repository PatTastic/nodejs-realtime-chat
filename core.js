var express = require('express');
var Core = express();
var HTTP = require('http').Server(Core);
var IO = require('socket.io')(HTTP);
var users = {};

Core.use(express.static('assets/'));
Core.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

IO.on('connection', function(socket){
    console.log('User connected: ' + socket.id);

    socket.on("room", function(room){
        socket.join(room);
    });

    socket.on('user joined', function(user){
        users[user.id] = user;
        user.flair = { colour: '', styles: '' };
        console.log('user ' + user.nickname + ' joined. ID: ' + user.id);
        IO.emit('user event', {user: user, message: 'joined'});
    });

    socket.on('chat message', function(msg){
        IO.sockets.in('test1').emit('chat message', msg);
        // IO.emit('chat message', msg);
    });

    socket.on('save options', function(user){
        if(doesExist(users[user.id])){
          users[user.id] = user;
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

        console.log('user ' + curUser.nickname + ' disconnected.');
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
