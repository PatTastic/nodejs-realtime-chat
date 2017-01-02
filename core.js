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
        user.flair = { colour: "", styles: "" };
        console.log("user " + user.nickname + " joined. ID: " + user.id);
        IO.emit("user event", {user: user, message: "joined"});
    });
    
    socket.on("chat message", function(msg){
        IO.emit("chat message", msg);
    });
    
    socket.on("save options", function(user){
        for(var i=0; i<users.length; i++){
            if(users[i].id == this.client.id){
                users[i] = user;
            }
        }
    });
    
    socket.on("get users", function(){
        IO.emit("list users", users);
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
        IO.emit("user event", {user: curUser, message:"disconnected"});
    });
});

HTTP.listen(3000, function(){
    console.log("listening on *:3000");
});
