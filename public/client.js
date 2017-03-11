function getCookie(cookieKey){
    let regex = new RegExp("(?:(?:^|.*;\\s*)" + cookieKey +  "\\s*\\=\\s*([^;]*).*$)|^.*$")
    let cookieVal =  document.cookie.replace(regex, "$1");
    return cookieVal;
}

function addMessageToChat(message, bold){
	if(bold){
		/*$('#messages').append($('<li>').append($('<b>')
      	.text(message.timestamp + " " + message.user.nickname + ": " + message.msg)
         .css("color",message.user.color)));*/
       $('#messages').append($('<li>')
       .append($('<b>')
      		.append($('<p>')
      			.attr("class", "chatMsg")
      			.text(message.timestamp + " " )
      			)
      		.append($('<p>')
      			.attr("class", "chatMsg")
      			.text(message.user.nickname  + ": " )
      			.css("color",message.user.color)
      			)
      		.append($('<p>')
      			.attr("class", "chatMsg")
      			.text(message.msg)
      			)
			));
	}
	else{
		$('#messages').append($('<li>')
      		.append($('<p>')
      			.attr("class", "chatMsg")
      			.text(message.timestamp + " " )
      			)
      		.append($('<p>')
      			.attr("class", "chatMsg")
      			.text(message.user.nickname  + ": " )
      			.css("color",message.user.color)
      			)
      		.append($('<p>')
      			.attr("class", "chatMsg")
      			.text(message.msg)
      			)
      		);	
	}
}

// shorthand for $(document).ready(...)
$(function() {
    var socket = io();
    let userName  = "";
    let uN = getCookie("userName");
    console.log(document.cookie);
    console.log("uN: " + uN);
    console.log("color: " + getCookie("nickColor"));
    if(uN === ""){
        socket.emit("init", null, null);
    }
    else{
       socket.emit("init", uN, getCookie("nickColor"));
    }
    $('form').submit(function(){
        let textFieldTxt = $('#m').val();
        if(textFieldTxt.startsWith("/nickcolor")){
            let splitText = textFieldTxt.split(/\s+/);
            let color = '#' + splitText[1];
            socket.emit("setNickColor", color);
        }
        else if(textFieldTxt.startsWith("/nick")){
            let splitText = textFieldTxt.split(/\s+/);
            socket.emit("setUserName", splitText[1]);
        }

        else {
            socket.emit('chat', textFieldTxt);
        }
        $('#m').val('');
        return false;
    });

    socket.on("init", function(messageHistory, currentUsers){
        for(i in messageHistory){
            if(messageHistory[i].type === "chat"){
            	 let message = messageHistory[i]; 
                if(messageHistory[i].user.nickname === userName){
                    /*$('#messages').append($('<li>').append($('<b>')
                        .text(messageHistory[i].timestamp + " " + messageHistory[i].user.nickname + ": " + messageHistory[i].msg)
                        .css("color",messageHistory[i].user.color)));*/
                   addMessageToChat(message, true);
                    
                }
                else {
                		
                    /*$('#messages').append($('<li>')
                        .text(messageHistory[i].timestamp + " " + messageHistory[i].user.nickname + ": " + messageHistory[i].msg)
                        .css("color", messageHistory[i].user.color));*/
                    addMessageToChat(message, false);
                }
            }
            else{
                $('#messages').append($('<li>').append($('<i>').text(messageHistory[i].timestamp + " " + messageHistory[i].msg)));
            }
        }

        for(i in currentUsers){
            $('#usersOnline').append($('<li>').text(currentUsers[i].nickname).css("color", currentUsers[i].color));
        }
    });

    socket.on("updateOnlineUsers", function(onlineUsers){
        $('#usersOnline').empty();
        for(i in onlineUsers){
            $('#usersOnline').append($('<li>').text(onlineUsers[i].nickname).css("color", onlineUsers[i].color));
        }
    });

    socket.on('chat', function(user, msg, timestamp){
    	  let message = {
    	  		user: user,
    	  		msg: msg,
    	  		timestamp: timestamp
    	  };
        if(user.nickname == userName)
                addMessageToChat(message, true);
        else
                addMessageToChat(message, false);

    });

    socket.on("sysMessage", function(msg, timestamp){
        $('#messages').append($('<li>').append($('<i>').text(timestamp + " " +  msg)));
    });

    socket.on('setUserName', function(userN){
       userName = userN;
        $('#user').text("Hello " + userName);
        document.cookie = "userName=" + userName;
    });

    socket.on('setNickColor', function(color){
       document.cookie = "nickColor=" + color;
    });
});