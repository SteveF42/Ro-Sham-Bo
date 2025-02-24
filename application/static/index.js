const socket = io('http://127.0.0.1:5000/')
const private_socket = io('http://127.0.0.1:5000/private')

var playerNum = undefined
var in_game = false
const arr = [
    '/static/images/player-icon1.png',
    '/static/images/player-icon2.png',
    '/static/images/player-icon3.png',
]

function HTML(msg, type) {
    let alert =
        `<p class="alert alert-${type} alert-dismissible", style="margin: 10px 25% 0 25%;", id="flashed-message",value="true">
        ${msg}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
        </button>
        </p>`
    return alert
}
//socket events
socket.on('connect', function () {
    console.log('connected')

})

function printWinnerInChat(winner){

    let msg = currentPlayers[winner-1] !== undefined ? `${currentPlayers[winner-1].toUpperCase()} WINS!` : "ITS A TIE!"
    let tag = `<li>${msg}</li>`
    let reset = `<li>Reseting game... </li>`
    $('#game-messages').append(tag)
    $('#game-messages').append(reset)
}

function startNextRound(){
    console.log("reseting...")
    //resets profile image background 
    document.getElementById('player1_avatar').style.backgroundColor = 'rgb(0, 0, 0, 0)'
    document.getElementById('player2_avatar').style.backgroundColor = 'rgb(0, 0, 0, 0)'
    //changes the current choice back to nothing
    document.getElementById('rock').style.backgroundColor = 'rgb(0,0,0,0)'
    document.getElementById('paper').style.backgroundColor = 'rgb(0,0,0,0)'
    document.getElementById('scissors').style.backgroundColor = 'rgb(0,0,0,0)'
    //enables the submit button
    document.getElementById('lock-in-choice').removeAttribute('disabled')
    document.getElementById('lock-in-choice').innerHTML = "submit"

    //resets all variables
    player_move = {1:undefined,2:undefined}
    locked_in = false
    current_choice = 0
}

//after the other client disconnects, resets the server info and client info
socket.on('force-end-game', function (name) {
    console.log('other client disconnected')
    in_game = false

    let tag = `<li style="margin-top:0; list-style: none" id="client-message">${name} has disconected... </li>`
    $('#game-messages').append(tag)

    socket.emit('pop-gamekey')
    let item = document.getElementById('hidden-message')
    item.style.display = "flex"

})


//sets up client to play game
let currentPlayers = []
socket.on('client-game-setup', async function (playerNames) {

    $('#flash-message').append(HTML('Game Found!', 'danger'))
    let item = document.getElementById('hidden-message')
    item.style.display = "none"
    in_game = true

    $('#game-messages').append('Game Found! Say Hello!')

    $('#flashed-message').remove()
    $('#flashed-message').remove()
    $('#findGame').text('Find Game')

    currentPlayers = playerNames
    let p1_name = playerNames[0]
    let p2_name = playerNames[1]

    document.getElementById('player1').innerHTML = p1_name
    document.getElementById('player2').innerHTML = p2_name

    socket.emit('get_player_num', response=> playerNum = response)
})


//gets called after one player makes a move checks if theres a win or not too 
let player_move = {1:undefined,2:undefined}
const choice_arr = {
    'rock' : '/static/images/rock.png',
    'paper' : '/static/images/paper.png',
    'scissors' : '/static/images/scissors.png'
}

socket.on('player-choice', function (ID,winner,move) {
    let otherPlayerID = ID === 1 ? 'player1_avatar' : 'player2_avatar'
    document.getElementById(otherPlayerID).style.backgroundColor = 'rgb(71, 241, 65)'
    player_move[ID] = move
    
    if(winner){
        console.log("winner",winner,'move',move,'ID',ID,player_move)

        for(let i = 1; i <= 2;i++){
            if(i===1){
                document.getElementById('player1Choice').src = choice_arr[player_move[i]]
            }else{
                document.getElementById('player2Choice').src = choice_arr[player_move[i]]
            }
        }

        let ss = 0
        switch(winner){
            case 1:
                console.log('PLAYER 1 WINS')
                ss = document.getElementById('player1Score').innerHTML
                ss = parseInt(ss,10)
                ss++;
                document.getElementById('player1Score').innerHTML = ss;
                break;
            case 2:
                console.log('PLAYER 2 WINS')
                ss = document.getElementById('player1Score').innerHTML
                ss = parseInt(ss,10)
                ss++;
                document.getElementById('player2Score').innerHTML = ss;
                break;
            case 3:
                console.log('ITS A TIE')
                break;  
        }
        printWinnerInChat(winner)
        setTimeout(()=>startNextRound(),5000)
    }
})

//chat window stuff
socket.on('received-message', msg => {
    let tag = `<li style="margin-top:0; list-style: none" id="client-message">${msg['name']}: ${msg['message']}</li>`
    $('#game-messages').append(tag)
})

// window.onload = function(){
//     socket.emit('stop-processes',function(){
//     })
// }


//HTML events
//searches for game
$('#findGame').on('click', function () {
    socket.emit('searching', function (url, boolValue) {
        if (url != undefined)
            window.location = url
        else {
            if (boolValue) {
                $('#findGame').text('Stop Searching')
                $('#flash-message').append(HTML('Searching for game!', 'success'))
                searching = false
            } else {
                $('#flashed-message').remove()
                $('#findGame').text('Find Game')
                searching = true
            }
        }
    })
})

//send message event
$('#send-friendly-message').on('click', function () {
    if (in_game === false) {
        console.log('NOPE')
        return
    }

    let msg = $('#friendly-message').val()
    $('#friendly-message').val('')
    if (msg.length < 1 || msg == undefined) {
        console.log("NOPE")
        return
    }
    socket.emit('room-message', msg)
})

//randomly selects a profile picture for each user
window.onload = async function () {

    let num = Math.floor(Math.random() * arr.length)
    document.getElementById('player1_avatar').src = arr[num]

    num = Math.floor(Math.random() * arr.length)
    document.getElementById('player2_avatar').src = arr[num]
}

//the three main buttons for rock, paper, scissors
let current_choice = 0
let locked_in = false
$('#rock').on('click', function () {
    if (locked_in)
        return

    document.getElementById('rock').style.backgroundColor = 'rgb(71, 241, 65)'
    document.getElementById('paper').style.backgroundColor = 'rgb(0,0,0,0)'
    document.getElementById('scissors').style.backgroundColor = 'rgb(0,0,0,0)'
    current_choice = 'rock'
})

$('#paper').on('click', function () {
    if (locked_in)
        return

    document.getElementById('rock').style.backgroundColor = 'rgb(0,0,0,0)'
    document.getElementById('paper').style.backgroundColor = 'rgb(71, 241, 65)'
    document.getElementById('scissors').style.backgroundColor = 'rgb(0,0,0,0)'
    current_choice = 'paper'
})

$('#scissors').on('click', function () {
    if (locked_in)
        return

    document.getElementById('rock').style.backgroundColor = 'rgb(0,0,0,0)'
    document.getElementById('paper').style.backgroundColor = 'rgb(0,0,0,0)'
    document.getElementById('scissors').style.backgroundColor = 'rgb(71, 241, 65)'
    current_choice = 'scissors'
})

//lock in answer with big green button
$('#lock-in-choice').on('click', function () {
    if (current_choice === 0) {
        $('#flashed-message').remove()
        let s = HTML('select a choice', 'danger')
        $('#error').append(s)
    }else{

        $('#flashed-message').remove()
        
        document.getElementById('lock-in-choice').setAttribute('disabled', 'disabled')
        document.getElementById('lock-in-choice').innerHTML = "WAITING FOR OPPONENT"
        locked_in = true
        
        socket.emit('play-game', current_choice)
    }
})
