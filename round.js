function playerReady() {
    //alert("ready");
}

timerId = false;
GRAPH_HEIGHT = 400;
PIXELS_PER_SEC = 1;

function secs_to_timestamp(secs) {
    var round_secs = Math.round(secs);
    var minutes = Math.floor(round_secs / 60);
    return minutes+':'+(round_secs-(minutes*60)+"").padStart(2,'0');
}

function playerPaused() {
    if (timerId) {
        clearInterval(timerId);
    }
}

function move_scrubber(new_x) {
    var element = image_svg().getElementById('scrubber');
    if (element) {
        element.setAttribute('x1', new_x);
        element.setAttribute('x2', new_x);
    }
    var element = image_svg().getElementById('scrubber_text');
    if (element) {
        element.setAttribute('x', new_x);
        $('#scrubber_text').text(secs_to_timestamp(new_x));
    }
}

function move_indicator(new_x) {
    var element = image_svg().getElementById('indicator');
    if (element) {
        element.setAttribute('x1', new_x);
        element.setAttribute('x2', new_x);
    }
    var element = image_svg().getElementById('indicator_text');
    if (element) {
        element.setAttribute('x', new_x);
        $('#indicator_text').text(secs_to_timestamp(new_x));
    }
}

function update_player_indicator(offset) {
    var svg = image_svg();
    var new_x = (player.getCurrentTime() - offset) * PIXELS_PER_SEC;
    move_indicator(new_x);
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
    return secs * PIXELS_PER_SEC;
}

function progress_to_y(percent) {
    return ((1 - percent) * GRAPH_HEIGHT);
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

function draw_fights(svg, group, fights) {
    var fights_g = svg.group(group, 'fights');
    for (fight_id in fights) {
        var fight = fights[fight_id];
        if (fight.push_end < fight.start_progress) {
            progress_low = fight.push_end;
            progress_high = fight.start_progress;
        } else {
            progress_low = fight.start_progress;
            progress_high = fight.push_end;
        }
        if (progress_low == progress_high) {
            progress_low-=.01;
            progress_high+=.01;
        }
        draw_region(svg, fights_g, fight.fight_start, progress_high, fight.fight_end, progress_low, "fight_area");
    }
}

function draw_completion_lines(svg, group, cleared_checkpoints) {
    var g = svg.group(group, 'completion_lines');
    for (i in cleared_checkpoints) {
        var cp = cleared_checkpoints[i];
        if (i > 0) {
            var left = cleared_checkpoints[i-1][0];
        } else {
            var left = 0;
        }
        svg.line(g, secs_to_x(cp[0]), progress_to_y(1.0), secs_to_x(cp[0]), progress_to_y(cp[1]), {class_: 'progress_target_line'});
        svg.line(g, secs_to_x(left), progress_to_y(cp[1]), secs_to_x(cp[0]), progress_to_y(cp[1]), {class_: 'progress_completion_line'});
        svg.text(g, secs_to_x(cp[0]), -5, secs_to_timestamp(cp[0]));
        //chart.text(time, (time, -5), (chart.time_to_graph_x, None), group='completion')
    }
}

function draw_payload_progress(svg, group, payload_progress) {
    var g = svg.group(group, 'payload_progress');
    for (i in payload_progress) {
        var line = payload_progress[i];
        draw_timeline(svg, g, line, progress_to_y, "progress");
    }
}

function draw_graph(data) {
    var svg = image_svg();
    svg.configure({height: '500px', width: secs_to_x(data.duration)+10+10}, true);
    var graph_right = secs_to_x(data.duration);
    var g = svg.group('graph', {transform:'translate(10, 45)'});
    svg.rect(g, 0, 0, graph_right, GRAPH_HEIGHT, {class_: "graph_border"});
    var minute_g = svg.group(g, 'minute_ref');
    for (pixels = PIXELS_PER_SEC*60; pixels < graph_right; pixels+=PIXELS_PER_SEC*60) {
        var line_x = pixels;
        svg.line(minute_g, line_x, 0, line_x, GRAPH_HEIGHT, {class:'minute_ref_line'});
        svg.text(minute_g, line_x, GRAPH_HEIGHT+20, (pixels/(PIXELS_PER_SEC * 60)+':00'));
    }
    draw_fights(svg, g, data.fights);
    draw_completion_lines(svg, g, data.cleared_checkpoints);
    draw_payload_progress(svg, g, data.payload_progress);
    svg.line(g, 0, 0, 0, GRAPH_HEIGHT+25, {id:'indicator'});
    svg.text(g, 0, GRAPH_HEIGHT+35, '0:00', {id:'indicator_text'});
    svg.line(g, 0, -20, 0, GRAPH_HEIGHT, {id:'scrubber'});
    svg.text(g, 0, -25, '0:00', {id:'scrubber_text'});

    $('#scrubber').click(function(eventObject) {
        var element = image_svg().getElementById('scrubber');
        var x = element.getAttribute('x1');
        var time = data.offset + (x / PIXELS_PER_SEC)
        player.seek(time);
        move_indicator(x);
        //player.play()
    });
}

$( document ).ready(
    function() {
        player = new Twitch.Player("player_div", options);
        player.addEventListener(Twitch.Player.READY, playerReady);
        player.addEventListener(Twitch.Player.PAUSE, playerPaused);
        $('#image_area').svg();
        $.getJSON("1/1_3/2_3_3/4_1_summary.json", function(data) {
            player.addEventListener(Twitch.Player.PLAYING,
                                    function playerPlaying() {
                                        timerId = setInterval(function () {update_player_indicator(data.offset)}, 100)
                                    });
            draw_graph(data)
        });
        $('#image_area').mousemove(function() {
            var new_x = event.pageX - $(this).offset().left-10; //10 from the graph group translation
            move_scrubber(new_x);
        });
    });

