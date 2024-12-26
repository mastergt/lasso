$('#startButton').hide()


$('#stopButton').click(function () {
    $('#stopButton').hide()
    $('#startButton').show()
    stopReceiveLog()
})


$('#startButton').click(function () {
    $('#startButton').hide()
    $('#stopButton').show()
    startReceiveLog()
})
var socket;
function startReceiveLog() {
    socket = io();
    let number = $('#numberId').val();
    if (!number) number = getUrlParameter('number');
    socket.emit('stream', { number: number });
    socket.on('log', function (data) {
        let len = $('#logs').children().length
        if (len > 100) $("#logs").find("p:last").remove();
        $('#logs').prepend('<p>' + data + '</p>')
        socket.emit('streamKeepalive', { number: number });
    });
    socket.on('error', console.error.bind(console));
    socket.on('message', console.log.bind(console));
    const beforeUnloadListener = (event) => {
        console.warn(`LEAVE PAGE`)
        if (socket) socket.disconnect()
    };
    window.addEventListener("beforeunload", beforeUnloadListener);
}
function stopReceiveLog() {
    if (socket) socket.disconnect();
}
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
};
startReceiveLog();