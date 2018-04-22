function playerReady() {
    //alert("ready");
}

timerId = false;


function playerPaused() {
    if (timerId) {
        clearInterval(timerId);
    }
}

function update_player_indicator(offset) {
    var svg = image_svg();
    var new_x = (player.getCurrentTime() - offset) * 2;
    var element = svg.getElementById('indicator');
    element.setAttribute('x1', new_x);
    element.setAttribute('x2', new_x);
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
             {class_:class_});
}

function draw_timeline(svg, group, points, y_func, class_) {
    svg.polyline(group, points.map(function(point) { return [secs_to_x(point[0]), y_func(point[1])]}), {class_:class_});
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

function draw_payload_progress(svg, payload_progress) {
    var g = svg.group('payload_progress');
    for (i in payload_progress) {
        var line = payload_progress[i];
        draw_timeline(svg, g, line, progress_to_y, "progress");
    }
}

function draw_graph(data) {
    var svg = image_svg();
    svg.configure({height: '500px', width: secs_to_x(data.duration)}, true);
    var graph_right = secs_to_x(data.duration);
    svg.rect(0, 0, graph_right, 400, {class_: "graph_border"});
    var g = svg.group('minute_ref');
    for (pixels = 2*60; pixels < graph_right; pixels+=2*60) {
        var line_x = pixels;
        svg.line(g, line_x, 0, line_x, 400, {class:'minute_ref_line'});
        svg.text(g, line_x, 400+20, (pixels/(2 * 60)+':00'));
    }
    draw_fights(svg, data.fights);
    draw_payload_progress(svg, data.payload_progress);
    svg.line(0,0,0, 400, {id:'indicator'});

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
        player.addEventListener(Twitch.Player.PAUSE, playerPaused);
        $( "#image_area" ).mousemove(function() {
            $("#scrubber").css("left", event.pageX);
            $("#scrubber").css("top", $("#image_area").position().top);
        });
        $('#image_area').svg();
        $.getJSON("1/1_3/2_3_3/4_1_summary.json", function(data) {
            player.addEventListener(Twitch.Player.PLAYING,
                                    function playerPlaying() {
                                        timerId = setInterval(function () {update_player_indicator(data.offset)}, 100)
                                    });
            draw_graph(data)
            $( "#scrubber" ).click(function(eventObject) {
                var mouseX = event.pageX;
                var posInImage = mouseX - $(this).offset().left
                var startTime = data.offset;
                var time = startTime + (mouseX / 2) //2 pixels per second
                player.seek(time);
                //player.play()
            });
        });

    });

