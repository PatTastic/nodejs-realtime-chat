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
var allRooms = {};
var socket = io();

/* Initial Load */
// (function(){
//     var room = window.location.search.match(/(room=)\w+/g);
//     if(room != null && room.length > 0){
//         room = room[0];
//         room = room.substr(room.indexOf('=') + 1);
//         joinRoom(room);
//     }
// })();

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
    joinRoom(e.target.dataset.roomId);
});
$('#create-room').click(function(){
    var newRoom = $('#create-room-name').val();
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
            joinRoom(newRoom);
        }
    }
});
function joinRoom(roomId){
    if($('#nickname').val() != ''){
        var selectedColour = $('.set-colour[name=initial]').val();

        user.flair.colour = (typeof select === 'undefined' || select == null || selectedColour == '') ? 'black' : selectedColour;
        user.nickname = $('#nickname').val();
        user.id = socket.id;
        user.inRoom = roomId;
        socket.emit('room', roomId);
        socket.emit('user joined', user);

        $('form#begin').hide();
        $('#m').focus();
    }
}

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
    var styling = '<p style="color:' + curUser.flair.colour + ';' + curUser.flair.styles + '">';

    if(curUser.flair.marquee){
        styling += '<marquee>' + curUser.nickname + '</marquee>';
    }
    else{
        styling += curUser.nickname;
    }

    styling += '</p>';

    return styling;
}

// Style Selection
// click label to select checkbox
$('label').click(function(){
    var elem = 'input[value=' + this.htmlFor + ']';
    var isChecked = $(elem).prop('checked') == true;

    $(elem).prop('checked', isChecked);
});

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
                    + '<p class="room-occupancy">' + rooms[room].length + '</p>'
                    + '</button>';
            }
        }
    }

    $("#availableRooms").html(roomsHTML);
})

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
