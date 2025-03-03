/*************************** Global Var ***************************/
// Comic Info
var $isComicComment = $("input[type=hidden][name=isComicComment]").val()
var $isComicReply = $("input[type=hidden][name=isComicReply]").val()
var isComicDetailPage = ($isComicComment === "true") ? true : false
var $title = $("input[type=hidden][name=title]").val()
var $comicSlug = $("input[type=hidden][name=comicSlug]").val()
var $comicId = $("input[type=hidden][name=comicId]").val()
// Chapter Info
var $chapter = $("input[type=hidden][name=chapter]").val() || null
var $isChapterComment = $("input[type=hidden][name=isChapterComment]").val() || null
var $isChapterReply = $("input[type=hidden][name=isChapterReply]").val() || null
// Others
var formData
var $pathname = window.location.pathname;
var $search = window.location.search
var $commentBox = $('#commentbox')
var flag = 0;
// Users
var $userAvatarSrc
/*  
**   If ComicDetailPage then fetch using 
**   add route null Else add nothing 
*/
var fetchParams = (isComicDetailPage) ? '/null' : ''
/*************************** Global Var ***************************/

/*************** Fetch bottom Comments when into view ***************/
$.fn.isVisible = function () {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight() + 10;

    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height() + 10;

    return elementBottom > viewportTop && elementTop < viewportBottom;
}

$(window).scroll(function () {
    if ($commentBox.isVisible()) {
        if (flag == 0) {
            // do something
            flag = 1
            $.ajax({
                type: 'GET',
                url:`/fetch${$pathname}${fetchParams}/comments${$search}`,
                contentType: "application/json; charset=utf-8",
                success: function(result) {
                    $commentBox.append(result)
                    $userAvatarSrc = $commentBox.find("#my-avatar img").attr('src')
                },
                error: function(result) {
                    console.log(result)
                },
            });
        }
    }
})
/*************** Fetch bottom Comments when into view ***************/

/*************** handle fetch more comments button ***************/
window.fetchMoreComments = function (form) {
    formData = {
        page: $(form).data('page'),
        comicSlug: $comicSlug,
    }
    if (!isComicDetailPage) {
        Object.assign(formData, {
            chapter: $chapter,
            isChapterComment: $isChapterComment,
        })
    }

    $.ajax({
        type: "POST",
        url:`/fetch${$pathname}${fetchParams}/comments${$search}`,
        data: JSON.stringify(formData),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            if (response) {
                $(form).data().page++
                $('#commentcontainer').append(response)
            } else {
                $('.tfooter__btn').fadeOut("slow", () => { $(this).remove();});
            }
        }
    })
    return false;
}

/*************** handle fetch more comments button ***************/



/*************** Function ***************/
window.showInput = function (e) {
    $thisbtnbox = $(e).parents('.form-group').siblings('#buttonbox')
    $thisbtnbox.addClass('buttonbox--flex');
};

window.resetInput = function (e) {
    $thisbtnbox = $(e).parents('.buttonbox')
    $thisbtnbox.removeClass('buttonbox--flex');
    $thisbtnbox.parents(".replydialog").toggleClass('d-none')
    $(e).parents('form').trigger("reset");
};

window.hideReplydialog = function (e) {
    $thisreplydialog = $(e).parents('.replydialog')
    $thisreplydialog.toggleClass('d-none');
};

window.showReplyBox = function (e) {
    $thisreplybox = $(e).parents('.toolbar').siblings('#replydialog')
    
    $thisBoxThumbnail = $thisreplybox.find('#author-thumbnail img');
    $thisBoxThumbnail.attr('src', $userAvatarSrc);
    $thisreplybox.toggleClass('d-none');
};

window.expander = function (e) {
    $thisExpander = $(e)
    var $thisExpanderReplies = $(e).parents('.comment').siblings('.expander__content')
    var $thisLessRepliesbtn = $(e).children('.expander__less')
    var $thisMoreRepliesbtn = $(e).children('.expander__more')

    if ($thisExpander.attr("data-expander") == 'hide') {
        $thisExpander.attr("data-expander", "show")

        $thisExpanderReplies.addClass('expander__content--show')
        $thisLessRepliesbtn.toggleClass('d-none')
        $thisMoreRepliesbtn.toggleClass('d-none')
        return
    }
    if ($thisExpander.attr("data-expander") == 'show') {
        $thisExpander.attr("data-expander", "hide")

        $thisExpanderReplies.removeClass('expander__content--show')
        $thisLessRepliesbtn.toggleClass('d-none')
        $thisMoreRepliesbtn.toggleClass('d-none')
        return
    }
};

window.editableContent = function (e) {
    $thisContentBox = $(e).parents('action-menu-renderer').siblings('.content')
    $thisContentBox.siblings('.header').hide()
    $thisContentBox.siblings('.toolbar').hide()
    $thisContentBox.find('.content__text').val("1").trigger('change');
    $thisContentBox.children('.content__text').attr('contenteditable','true');
    $thisContentBox.find('.buttonbox').toggleClass('buttonbox--flex')
    // $thisContentBox.addEventListener('keydown', event => {
    //     if (event.key === 'Enter') {
    //       document.execCommand('insertLineBreak')
    //       event.preventDefault()
    //     }
    //   })
};

window.normalState = function (e) {
    
    $thisContentBox = $(e).parents('comment')
    $thisContentBox.siblings('.header').show()
    $thisContentBox.siblings('.toolbar').show()
    $thisContentBox.children('.content__text').trigger("reset");
    $thisContentBox.children('.content__text').attr('contenteditable','false');
    $thisContentBox.find('.buttonbox').toggleClass('buttonbox--flex')
};

/*************** Function ***************/



/*************** Form ***************/

//  Start POST comment
window.postComment = function (form) {
    appendCloneMsg()
    toggleLoading()
    formData = {
        text: form.text.value,
        title: $title,
        
        
        comicSlug: $comicSlug,
        updatedAt: new Date().toISOString(),
        isComicDetailPage: isComicDetailPage,
    }
    if (!isComicDetailPage) {
        Object.assign(formData, {
            isComicDetailPage: false,
            chapter: $chapter,
        })
    }
    
    $.ajax({
        type: "POST",
        url: `/comic/comment`,
        data: JSON.stringify(formData),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            handleSuccessMsg(response)
            socket.emit('new_comment', response)
        },
        error: function (response) {
            handleErrorMsg(response)
        }
    })
    return false;
}; 

//  Start POST reply
window.postReply = function (form) {
    appendCloneMsg()
    toggleLoading()
    formData = {
        comment_id: form.comment_id.value,
        text: form.text.value,
        title: $title,
        
        
        comicSlug: $comicSlug,
        updatedAt:  new Date().toISOString(),
        isComicDetailPage: true,
    }
    if (!isComicDetailPage) {
        Object.assign(formData, {
            chapter: $chapter,
            isComicDetailPage: false,
        })
    }
    $.ajax({
        type: "POST",
        url: `/comic/reply`,
        data: JSON.stringify(formData),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            hideReplydialog(form)
            handleSuccessMsg(response)
            socket.emit('new_reply', {html: response, comment_id: formData.comment_id}) 
        },
        error: function (response) {
            handleErrorMsg(response)
        }
    })
    return false;
}; 

//  Start destroy comment 
window.destroyComment = function (form) {
    
    formData = {
        comment_id: form.comment_id.value,
        comicSlug: $comicSlug,
        isComicDetailPage: true,
    }
    if (!isComicDetailPage) {
        Object.assign(formData, {
            chapter: $chapter,
            isComicDetailPage: false,
        })
    }
    
    if (confirm("Delete this Comment ? ?")) {
        appendCloneMsg()
        toggleLoading()
        $.ajax({
            type: "POST",
            url: `/comic/comment/destroyComment?_method=DELETE`,
            data: JSON.stringify(formData),
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                handleSuccessMsg(response)
                socket.emit('delete_comment', formData)
            },
            error: function (response) {
                handleErrorMsg(response)
            }
        })
    }
    return false;
}; 

//  Start destroy reply 
window.destroyReply = function (form) {
    
    formData = {
        reply_id: form.reply_id.value,
        comment_id: form.comment_id.value,
        comicSlug: $comicSlug,
        isComicDetailPage: true,
    }
    if (!isComicDetailPage) {
        Object.assign(formData, {
            chapter: $chapter,
            isComicDetailPage: false,
        })
    }
    if (confirm("Delete this Reply ?")) {
        appendCloneMsg()
        toggleLoading()
        $.ajax({
            type: "POST",
            url: `/comic/comment/destroyReply?_method=DELETE`,
            data: JSON.stringify(formData),
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                handleSuccessMsg(response)
                socket.emit('delete_reply', formData)
            },
            error: function (response) {
                handleErrorMsg(response)
            }
        })
    }
    return false;
}; 

// Start edit Comment 
window.editCommentForm = function (form) {
    appendCloneMsg()
    toggleLoading()
    $thisVal = $(form).parent().find('.content__text').html()
    form.text.value = $thisVal
    formData = {
        comment_id: form.comment_id.value,
        text: form.text.value,
        title: $title,
        
        
        comicSlug: $comicSlug,
        updatedAt: new Date().toISOString(),
        isComicDetailPage: true,
        isComment: true,
    }
    if (!isComicDetailPage) {
        Object.assign(formData, {
            isComicDetailPage: false,
        })
    }
    
    $.ajax({
        type: "POST",
        url: '/comic/comment/edit?_method=PUT',
        data: JSON.stringify(formData),
        contentType: "application/json; charset=utf-8",
        success: function (response) {
            handleSuccessMsg(response)
            normalState(form)
            socket.emit('edited_comment', response)
        },
        error: function (response) {
            handleErrorMsg(response)
        }
    })
    return false;
};
// Start edit reply
window.editReplyForm = function (form) {
    appendCloneMsg()
    toggleLoading()
    $thisVal = $(form).parent().find('.content__text').html()
    form.text.value = $thisVal
    formData = {
        comment_id: form.comment_id.value,
        reply_id: form.reply_id.value,
        text: form.text.value,
        title: $title,
        
        
        comicSlug: $comicSlug,
        updatedAt: new Date().toISOString(),
        isComicDetailPage: true,
        isReply: true,
    }
    if (!isComicDetailPage) {
        delete formData.isComicReply
        Object.assign(formData, {
            chapter: $chapter,
            isComicDetailPage: false,
        })
    }
    
    $.ajax({
        type: "POST",
        url: '/comic/comment/edit?_method=PUT',
        data: JSON.stringify(formData),
        contentType: "application/json; charset=utf-8",
        success: function (response) {

            handleSuccessMsg(response)
            normalState(form)
            socket.emit('edited_reply', response)
        },
        error: function (response) {
            handleErrorMsg(response)
        }
    })
    return false;
};
/***************  Form ***************/



/*************** Socket IO ***************/
var socket = io()
socket.emit('join', $comicSlug);

socket.on('new_comment', response => {
    $('#commentcontainer').prepend(response)
    $('#commentcontainer > :nth-child(1)').css('display','block').hide().show("slow")
});

socket.on('new_reply', response => {
    $(`#comment-${response.comment_id}`).append(response.html)
    $(`#comment-${response.comment_id} > :last-child`).css('display','block').hide().show("slow")
});

socket.on('delete_comment', formData => {
    $(`#comment-${formData.comment_id}`).css('display','block').slideUp("slow", function() { $(this).remove();});
})

socket.on('delete_reply', formData => {
    $(`#reply-${formData.reply_id}`).css('display','block').slideUp("slow", function() { $(this).remove();});
})

socket.on('edited_comment', formData => {
    $(`#comment-${formData.comment_id}`).find('.content__text').html(formData.text).hide().show("slow");
})
socket.on('edited_reply', formData => {
    $(`#reply-${formData.reply_id}`).find('.content__text').html(formData.text).hide().show("slow");
})
/*************** Socket IO ***************/



