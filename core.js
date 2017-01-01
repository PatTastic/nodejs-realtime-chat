var Core = require("express")();
var HTTP = require("http").Server(Core);
var IO = require("socket.io")(HTTP);
var users = [];

Core.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
});

IO.on("connection", function(socket){
    console.log("a user connected");
    
    socket.on("user joined", function(user){
        users.push(user);
        console.log("user " + user.nickname + " joined. ID: " + user.id);
        IO.emit("user event", user.nickname + " joined");
    });
    
    socket.on("chat message", function(msg){
        IO.emit("chat message", msg);
    });
    
    socket.on("disconnect", function(){
        var curUser = {};
        for(var i=0; i<users.length; i++){
            if(users[i].id == this.client.id){
                curUser = users[i];
                users.splice(i, 1);
                break;
            }
        }
        
        console.log("user " + curUser.nickname + " disconnected.");
        IO.emit("user event", curUser.nickname + " disconnected");
    });
});

HTTP.listen(3000, function(){
    console.log("listening on *:3000");
});
