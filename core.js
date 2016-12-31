var Core = require("express")();
var HTTP = require("http").Server(Core);
var IO = require("socket.io")(HTTP);

Core.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
});

IO.on("connection", function(socket){
    console.log("a user connected");
    
    socket.on("chat message", function(msg){
        IO.emit("chat message", msg);
    });
    
    socket.on("disconnect", function(){
        console.log("user disconnected.");
    });
});

HTTP.listen(3000, function(){
    console.log("listening on *:3000");
});
