var user = {
    nickname: '',
    id: '',
    inRoom: '',
    flair: {
        colour: 'black',
        styles: '',
        marquee: false
    }
};
var linkedRoom = null;
var allRooms = {};
var socket = io();

/* Initial Load */
(function(){
    // check if user is using a share link
    if(window.location.search.match(/^(\?room=)\w+(\&key=).*$/gi)){
        // get room
        var room = window.location.search.match(/(room=)\w+/g);
        room = room[0];
        room = room.substr(room.indexOf('=') + 1);
        $('#join-room-name').val(room);

        // get key
        var key = window.location.search.match(/(key=).*/g);
        key = key[0];
        key = key.substr(key.indexOf('=') + 1);


        linkedRoom = {
            name: room,
            key: key
        };
    }
})();

/* Forms */
// Begin Form
$('form#begin').submit(function(){
    return false;
});

// Chat Form
$('form#chat').submit(function(){
    var msgElem = $('#m');

    if(msgElem.val() != ''){
        var chat = {user: user, message: msgElem.val()};
        socket.emit('chat message', chat);
        msgElem.val('');
    }

    msgElem.focus();
    return false;
});

// Options Form
$('form#options').submit(function(){
    user.flair.colour = $('.set-colour[name=change]').val();
    user.flair.styles = styleBuilder();
    user.flair.marquee = $('input[value=marquee]').is(':checked');

    socket.emit('save options', user);
    toggleFlyouts('options');
    $('#m').focus();

    return false;
});

// Room Selection
$('body').on('click', '.room', function(e){
    joinRoom(e.target.dataset.roomId, false);
});
$('#create-room').click(function(){
    var newRoom = $('#create-room-name').val();
    var isPrivate = $('#create-private').is(':checked');

    if(newRoom == '' || newRoom.length < 2){
        alert('Name must be at least 3 characters long');
    }
    else{
        var alreadyExists = false;
        for(var room in allRooms){
            if(room == newRoom){
                alreadyExists = true;
                break;
            }
        }

        if(alreadyExists){
            alert('A room with this name already exists!');
        }
        else{
            joinRoom(newRoom, isPrivate);
        }
    }
});
$('#join-room').click(function(){
    var name = $('#join-room-name').val();
    if(name == ''){
        alert('Name required');
    }
    else{
        joinRoom(name, false);
    }
});
function joinRoom(roomId, isPrivate){
    if($('#nickname').val() != ''){
        var selectedColour = $('.set-colour[name=initial]').val();
        socket.emit('room', roomId, isPrivate, linkedRoom);
    }
}

$('#room-copy').click(function(){
    var link = document.getElementById('room-link-copy');
    link.select();
    document.execCommand("copy");
});

/* Helper Functions */
// Toggle Flyouts
function toggleFlyouts(elem){
    if(!($('#fo-' + elem).is(':visible'))){
        $('#fo-' + elem).css('display', 'inline-block');
    }
    else{
        $('#fo-' + elem).removeAttr('style');
    }

    if($('#fo-users').is(':visible')){
        socket.emit('get users');
    }

    if($('#fo-users').is(':visible') && $('#fo-options').is(':visible')){
        $('#fo-users').addClass('both-users');
        $('#fo-options').addClass('both-options');
    }
    else{
        $('#fo-users, #fo-options').removeAttr('class');
    }
}

// Style Builder
// returns a string with all selected styles from Options flyout
function styleBuilder(){
    var style = '';

    if($('input[value=bold]').is(':checked'))
        style = 'font-weight:bold;';
    if($('input[value=italic]').is(':checked'))
        style += 'font-style:italic;';
    if($('input[value=strikethrough]').is(':checked'))
        style += 'text-decoration:line-through;';

    return style;
}

// Nickname Builder
// returns a <p> with all styles and and possible marquee
function nicknameBuilder(curUser){
    var styling = '';

    if(doesExist(curUser.flair)){
        styling = '<p style="color:' + curUser.flair.colour + ';' + curUser.flair.styles + '">';
    }

    if(curUser.flair.marquee){
        styling += '<marquee>' + curUser.nickname + '</marquee></p>';
    }
    else{
        styling += curUser.nickname + '</p>';
    }

    return styling;
}

// Style Selection
// check if an element exists
function doesExist(elem){
    return !(typeof elem === 'undefined' || elem == null);
}

/* Socket Events */
// Connect to a room
socket.on('connect', function(){
    socket.emit('get rooms');
});

socket.on('display rooms', function(rooms){
    allRooms = rooms;
    var roomsHTML = '';

    if(Object.keys(rooms).length === 0){
        roomsHTML = '<p class="no-rooms">No rooms available.</p>'
            + '<p class="no-rooms">Create one now!</p>';
    }
    else{
        for(var room in rooms){
            if(rooms.hasOwnProperty(room)){
                roomsHTML += '<button class="room" data-room-id="' + room + '">'
                    + '<p class="room-name">' + room + '</p>'
                    + '<p class="room-occupancy">' + rooms[room].users.length + '</p>'
                    + '</button>';
            }
        }
    }

    $("#availableRooms").html(roomsHTML);
});

socket.on('room confirmed', function(room, wasConfirmed, key){
    if(wasConfirmed == true){
        var link = window.location.origin + '/?room=' + room + '&key=' + key;

        user.flair.colour = (typeof select === 'undefined' || select == null || selectedColour == '') ? 'black' : selectedColour;
        user.nickname = $('#nickname').val();
        user.id = socket.id;
        user.inRoom = room;
        socket.emit('user joined', user);

        $('#room-name').html(room);
        $('#room-link-copy').val(link);
        $('form#begin').hide();
        $('#m').focus();
    }
    else{
        alert('Secret Key incorrect');
        linkedRoom = null;
    }
});

// User Event, either user join or user disconnect
socket.on('user event', function(user){
    var message = '<span class="sys">' + nicknameBuilder(user.user)
        + ' ' + user.message + '.</span>';

    $('#messages').append(message);
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
});

// Prints Chat Message
socket.on('chat message', function(chat){
    chat.message = chat.message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    var linkRegex =/((https?)(:\/\/)\S+\.[a-zA-Z]+(\S*))|(\S+\.\S+)/gi;
    var links = chat.message.match(linkRegex);
    if(links != null && links.length > 0){
        for(var i=0; i<links.length; i++){
            var protocol = (links[i].indexOf('http') === -1) ? 'http://' : '';
            var a = '<a target="_blank" href="' + protocol + links [i] + '">' + links[i] + '</a>';
            chat.message = chat.message.replace(links[i], a);
        }
    }

    var message = '<span><dt>' + nicknameBuilder(chat.user) + '</dt>'
        + '<dd>' + chat.message + '</dd></span>';

    $('#messages').append(message);
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
});

// Lists Users in the List Users Flyout
socket.on('list users', function(users){
    $('#fo-users').html('<p id="connUsers">Connected Users: ' + Object.keys(users).length + '</p>');

    var name = '<div id="you">' + nicknameBuilder(user) + ', that\'s you!</div>';
    $('#fo-users').append(name);

    for(var id in users){
        if(users[id].nickname != user.nickname){
            $('#fo-users').append(nicknameBuilder(users[id]));
        }
    }
});
