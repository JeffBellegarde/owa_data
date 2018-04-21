function playerReady() {
    //alert("ready");
}
function playerPlaying() {
    console.log(player.getCurrentTime());
    //alert("ready");
}

var options = {
		width: 600,
		height: 400,
 		video: "250164474",
    html5: true,
    /*volume: 0.0,*/
    muted: true,
    autoplay: false,
};

function secs_to_x(secs) {
    return secs * 2
}

function progress_to_y(percent) {
    return ((1 - percent) * 400);
}

function image_svg() {
    return $('#image_area').svg('get');
}

function draw_region(svg, group, left, top, right, bottom, class_) {
    svg.rect(group, secs_to_x(left), progress_to_y(top), secs_to_x(right)-secs_to_x(left), progress_to_y(bottom)-progress_to_y(top),
             {fill: 'yellow', stroke: 'navy', strokeWidth: 5, class_:class_});
}

function draw_fights(svg, fights) {
    var fights_g = svg.group('fights');
    for (fight_id in fights) {
        var fight = fights[fight_id];
        if (fight.push_end < fight.start_progress) {
            push_low = fight.push_end;
            push_hight = fight.start_progress;
        } else {
            progress_low = fight.start_progress;
            progress_high = fight.push_end;
        }
        draw_region(svg, fights_g, fight.fight_start, progress_high, fight.fight_end, progress_low, "fight_area");
    }
}

function draw_graph(data) {
    var svg = image_svg();
    svg.configure({height: '400px', width: secs_to_x(data.duration)}, true);
    svg.rect(0, 0, secs_to_x(data.duration), 400, {class_: "graph_border"});
    draw_fights(svg, data.fights);
    console.log('drew fights')

}

$( document ).ready(
    function() {
        // Handler for .ready() called.
        player = new Twitch.Player("player_div", options);
        /*player.setVolume(0);*/
        /*player.setMuted(true);*/
        //player.seek(60);
        //player.pause();
        player.addEventListener(Twitch.Player.READY, playerReady);
        player.addEventListener(Twitch.Player.PLAYING, playerPlaying);
        $( "#image_area" ).mousemove(function() {
            $("#scrubber").css("left", event.pageX);
            $("#scrubber").css("top", $("#image_area").position().top);
        });
        $('#image_area').svg();
        $.getJSON("1/1_3/2_3_3/4_1_summary.json", function(data) {
            draw_graph(data)
            $( "#scrubber" ).click(function(eventObject) {
                console.log('clicked');
                var mouseX = event.pageX;
                var posInImage = mouseX - $(this).offset().left
                var startTime = data.offset;
                var time = startTime + (mouseX / 2) //2 pixels per second
                console.log("pos "+time)
                player.seek(time);
                //player.play()
            });
        });

    });

