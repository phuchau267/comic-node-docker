var socket = io();
var $userIdRoom = $("input[type=hidden][name=userIdRoom]").val()
if($userIdRoom){
    socket.emit('join_notifi_room', $userIdRoom)
}
socket.on('send_notifi',function (notifiInfo) {
    console.log(notifiInfo.userId +' nhan dc thong bao cua' +notifiInfo.notifi)
    
})