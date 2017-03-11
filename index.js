var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var messageHistory = [];
var users = [];
var takenNames = [];
var num = 0;

http.listen( port, function () {
    console.log('listening on port', port);
});

app.use(express.static(__dirname + '/public'));

function nicknameUnique(nickname){
    for(i in takenNames){
        if(takenNames[i] == nickname)
            return false;
    }
    return true;
}

function pushMessageHistory(type, msg, timestamp, user){
    if(type == "chat"){
        let copyUser = {
            nickname: user.nickname,
            color: user.color,
        }

        let messageObj = {
            type: type,
            msg: msg,
            user: copyUser,
            timestamp: timestamp
        };
        messageHistory.push(messageObj);
    }
    else{
        let messageObj = {
            type: type,
            msg: msg,
            timestamp: timestamp
        };
        messageHistory.push(messageObj);
    }
}

function getTime(){
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let seconds = date.getSeconds();
    return month + '/' + day + '/' + year + ' ' + hour + ':' + minute + ':' + seconds;
}

io.on("connection", function(socket){
    let user = {};
    socket.on("init", function(userName, nickColor){
        let newUser = false;
        if(userName === null){
        		while(!nicknameUnique("user" + num)){
        			num ++;
        		}
            user = {
                nickname: "user" + num,
                color: "#000000"
            };
            socket.emit("setNickColor", "#000000");
            newUser = true;
        }
        else{
            user = {
                nickname: userName,
                color: nickColor,
            };
        }
        console.log(num);

        users.push(user);
        takenNames.push(user.nickname);
        socket.emit("setUserName" , user.nickname);
        socket.emit("init", messageHistory, users);
        let time = getTime();
        socket.broadcast.emit("sysMessage", user.nickname + " joined the chat", time);
        socket.broadcast.emit("updateOnlineUsers", users);
        pushMessageHistory("sysMessage", user.nickname + " joined the chat", time);
        if(newUser) {
            socket.emit("sysMessage", "hello, you are " + user.nickname, time);
        }
        else{
            socket.emit("sysMessage", "Welcome back " + user.nickname, time);
        }

    });


    socket.on("chat", function(msg){
        let time = getTime();
	    io.emit("chat", user, msg, time);
        pushMessageHistory("chat", msg, time,  user);
    });

    socket.on("setNickColor", function(color){
        user.color = color;
        socket.emit("sysMessage", "you changed the color of your nickname to " + color, getTime());
        socket.emit("setNickColor", color);
        io.emit("updateOnlineUsers", users);
    });

    socket.on("setUserName", function(newNickname){
        if(nicknameUnique(newNickname)) {
            for(i in takenNames){
                if(takenNames[i] === user.nickname){
                    takenNames[i] = newNickname;
                }
            }
            let time = getTime();
            io.emit('sysMessage', user.nickname + " changed his nickname to " + newNickname, time);
            pushMessageHistory("sysMessage", user.nickname + " changed his nickname to " + newNickname, time);
            socket.emit("setUserName", newNickname);
            user.nickname = newNickname;
            io.emit("updateOnlineUsers", users);
        }
        else {
            let time = getTime();
            socket.emit("sysMessage", "sorry the nickname " + newNickname + " is already taken.", time);
        }
    });

    socket.on("disconnect", function () {
        let time = getTime();
        io.emit("sysMessage", user.nickname + " left the chat", time);
        pushMessageHistory("sysMessage", user.nickname + " left the chat", time);
        for(i in users){
            if(users[i].nickname === user.nickname) {
                users.splice(i, 1);
                break;
            }
        }
        socket.broadcast.emit("updateOnlineUsers", users);
    });
});
