var socket = io();
var $userIdRoom = $("input[type=hidden][name=userIdRoom]").val();
var notificationBox = $('#notification-box');
var notificationContainer = $('#notification-container');

$(document).ready(function () {

    $('#notification-container').click(function () {

        if ($(this).hasClass('show')) {
            $(this).removeClass('show')
            $('#notification-container > #dropdownMenuButton').attr("aria-expanded", "false");
            $('#notification-box').removeClass('show')
        } else {
            $(this).addClass('show')
                $('#notification-container > #dropdownMenuButton').attr("aria-expanded", "true");
                $('#notification-box').addClass('show')
            if($('.notification-items').length && parseInt($('#seenNotification').text()) == 0){
                console.log('already fetched')
               
            }else{
                
                
                setTimeout(function () {
                    


                        console.log('this function iz notifi')

                        $.ajax({

                            type: "GET",
                            url: '/fetch/getNotification',
                            // data: JSON.stringify(formData),
                            contentType: "application/json; charset=utf-8",
                            success: function (response) {
                                $('#notification-box').html(response)
                                
                            },
                            error: function (response) {
                                
                            }
                        })
                        $('#seenNotification').html(0);
                    

                }, 1);
            }
            
            
        }


        return false
    });
    $('body').click(function (e) {
        if (e.target.id != 'notification-container') {
            $('#notification-container').removeClass('show')
            $('#notification-container > #dropdownMenuButton').attr("aria-expanded", "false");
            $('#notification-box').removeClass('show')
        }
    })
})

if ($userIdRoom) {
    socket.emit('join_notifi_room', $userIdRoom)
}
socket.on('send_notifi', function (notifiInfo) {
    // make css html for thiz box show up when get notifi on live
    console.log(notifiInfo.userId + ' nhan dc thong bao cua' + notifiInfo.comicTitle + notifiInfo.notifiText)
    var el = parseInt($('#seenNotification').text());
    $('#seenNotification').text(el + 1);
})