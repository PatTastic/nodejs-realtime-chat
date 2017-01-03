var user = {nickname: "", id: "", flair: {colour: "black", styles: "", marquee: false}};
var socket = io();

/* Forms */
// Beginning Form
$("form#begin").submit(function(){
    if($("#nickname").val() != ""){
        if($(".set-colour[name=initial]").val() == null
        || $(".set-colour[name=initial]").val() == "")
            user.flair.colour = "black";
        else
            user.flair.colour = $(".set-colour[name=initial]").val();
        user.nickname = $("#nickname").val();
        user.id = socket.id;
        socket.emit("user joined", user);
        $("form#begin").hide();
        $("#m").focus();
    }
    return false;
});

// Chat Form
$("form#chat").submit(function(){
    if($("#m").val() != ""){
        var chat = {user: user, message: $("#m").val()};
        socket.emit("chat message", chat);
        $("#m").val("");
    }
    
    $("#m").focus();
    return false;
});

// Options Form
$("form#options").submit(function(){
    var colour = $(".set-colour[name=change]").val();
    user.flair.colour = colour;
    user.flair.styles = styleBuilder();
    if($("input[value=marquee]").is(":checked"))
        user.flair.marquee = true;
    else
        user.flair.marquee = false;
    
    socket.emit("save options", user);
    toggleFlyouts("options");
    $("#m").focus();
    return false;
});

/* Helper Functions */
// Toggle Flyouts
function toggleFlyouts(elem){
    if(!($("#fo-" + elem).is(":visible")))
        $("#fo-" + elem).css("display", "inline-block");
    else
        $("#fo-" + elem).removeAttr("style");
    
    if($("#fo-users").is(":visible")){
        socket.emit("get users");
    }
    
    if($("#fo-users").is(":visible") && $("#fo-options").is(":visible")){
        $("#fo-users").addClass("both-users");
        $("#fo-options").addClass("both-options");
    }
    else
        $("#fo-users, #fo-options").removeAttr("class");
}

// Style Builder
// returns a string with all selected styles from Options flyout
function styleBuilder(){
    var style = "";
    
    if($("input[value=bold]").is(":checked"))
        style = "font-weight:bold;";
    if($("input[value=italic]").is(":checked"))
        style += "font-style:italic;";
    if($("input[value=strikethrough]").is(":checked"))
        style += "text-decoration:line-through;";
    
    return style;
}

// Nickname Builder
// returns a <p> with all styles and and possible marquee
function nicknameBuilder(curUser){
    var styling = "";
    
    styling += "<p style='color:" + curUser.flair.colour + ";";
    styling += curUser.flair.styles + "'>";
    if(curUser.flair.marquee)
        styling += "<marquee>" + curUser.nickname + "</marquee></p>";
    else
        styling += curUser.nickname + "</p>";
    
    return styling;
}

// Style Selection
// click label to select checkbox
$("label").click(function(){
    var elem = "input[value=" + this.htmlFor + "]";
    if($(elem).prop("checked") == true)
        $(elem).prop("checked", false);
    else
        $(elem).prop("checked", true);
});

/* Socket Events */
// User Event, either user join or user disconnect
socket.on("user event", function(user){
    var message = "<span class='sys'>" + nicknameBuilder(user.user);
    message += " " + user.message + ".</span>";
    
    $("#messages").append(message);
    $("#messages").scrollTop($("#messages")[0].scrollHeight);
});

// Prints Chat Message
socket.on("chat message", function(chat){
    chat.message = chat.message.replace(/</g, "&lt;");
    chat.message = chat.message.replace(/>/g, "&gt;");
    
    var message = "<span><dt>" + nicknameBuilder(chat.user) + "</dt>";
    message += "<dd>" + chat.message + "</dd></span>";
    
    $("#messages").append(message);
    $("#messages").scrollTop($("#messages")[0].scrollHeight);
});

// Lists Users in the List Users Flyout
socket.on("list users", function(users){
    $("#fo-users").html("<p id='connUsers'>Connected Users: " + users.length + "</p>");
    var name = "<div id='you'>" + nicknameBuilder(user) + ", that's you!</div>";
    $("#fo-users").append(name);
    
    for(var i=0; i<users.length; i++){
        if(users[i].nickname != user.nickname)
            $("#fo-users").append(nicknameBuilder(users[i]));
    }
});
