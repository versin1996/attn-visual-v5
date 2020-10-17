require.config({
    baseUrl: '../static/js/lib',
    paths:{
        'jquery': 'jquery.min',
        'd3': 'd3.min'
    }
});

require(['jquery', 'd3'], function($, d3){
    var TEXT_SIZE = 14;
    var EN_TEXT_SIZE = 7;
    var CHAR_PADDING = 0;
    var IS_PADDING = 0;

    var heads;
    var head = 0;
    var files;
    var file = 0;
    

    function get_heads_and_files() {
        $.ajax({
            url: "get_index",
            type: "POST",
            dataType: "json",
            async: false,
            success: function (data) {
                COLS = data['cols'];
                heads = data['heads'];
                files = data['files'];
            }
        })
    }

    function get_data(head, file) {
        $.ajax({
            url: "post",
            type: "POST",
            dataType: "json",
            data: {'head': heads[head], 'file': files[heads[head]][file]},
            async: false,
            success: function (data) {
                sentences = data['sentences'];
                tokens = data['tokens'];
                top = data['top'];
                top_length = data['top_length'] * 2;
                console.log(top.length)
                TEXT_SIZE = data['TEXT_SIZE'];
                EN_TEXT_SIZE = TEXT_SIZE / 2;
                roles_length = data['roles_length'];
                language = data['language'];
            }
        })
        if(language == 'en') {
            CHAR_PADDING = EN_TEXT_SIZE;
            IS_PADDING = 1;
            top_length = top_length / 2;
        }
        // else {
        //     CHAR_PADDING = 0;
        //     IS_PADDING = 0;
        //     EN_TEXT_SIZE = TEXT_SIZE;
        // }
    }

    function get_color(value) {
        if(value < 0.01) {
            return "hsla(0, 100%, 100%, 0)"
        }
        value = 1 - value;
        return "hsla(" + value * 90 + ", 100%, 50%, 1)";
    }

    function refresh(head, file) {
        get_data(head, file)
        $(".vis").empty();
        $(".top").empty();
        $(".progress").text(String(Number(file) + 1) + "/" + String(files[heads[head]].length));
        render();
    }

    function add_panel() {
        for(var i = 0; i < heads.length; i++) {  // 添加头选项
            $(".head").append($("<option />").val(i).text(heads[i]));
        };

        for(var i = 0; i < files[heads[0]].length; i++) {  // 添加文件选项
            $(".file").append($("<option />").val(i).text(files[heads[0]][i]));
        };

        $(".head").on('change', function(e) {  // 改变头
            head = Number(e.currentTarget.value);
            file = 0;
            // console.log(head, heads[head], files[heads[head]])
            $(".file").empty()
            for(var i = 0; i < files[heads[head]].length; i++) {
                $(".file").append($("<option />").val(i).text(files[heads[head]][i]));
            }
            refresh(head, 0);
        });

        $(".file").on('change', function(e) {  // 改变文件
            file = e.currentTarget.value;
            console.log(file, typeof(file))
            refresh(head, file);
        });

        $(".prev").on('click', function(e) {  // 上一文件
            if(Number(file) > 0) {
                file = (Number(file) - 1) % files[heads[head]].length;
            }
            else {
                file = files[heads[head]].length - 1;
            }
            $(".file").val(file);
            refresh(head, file);
        });

        $(".next").on('click', function(e) {  // 下一文件
            file = (Number(file) + 1) % files[heads[head]].length;
            $(".file").val(file);
            refresh(head, file);
        });

        $(".progress").text(String(Number(file) + 1) + "/" + String(files[heads[head]].length));  // 进度
    }

    function init() {
        get_heads_and_files();
        get_data(0, 0);
        add_panel();
    }

    init();

    const PADDING_LINE = TEXT_SIZE * 0.1;
    const PADDING_HEIGHT = TEXT_SIZE * 0.3;
    const BOX_HEIGHT = TEXT_SIZE + PADDING_HEIGHT * 2;
    const WINDOWWIDTH = window.innerWidth - 6;
    const WINDOWHEIGHT = window.innerHeight * 0.9;

    var roles_length;
    var sentences;
    var tokens;
    var top;
    var top_length;
    var bgcolor;
    var choose;
    var top_choose;
    var col;
    var cur_total_raw;
    var total_raw = Math.floor(WINDOWHEIGHT / BOX_HEIGHT * 0.9);

    var COLS;
    var ROLE_WIDTH;
    var SENTENCE_WIDTH;
    var SENTENCE_LENGTH;

    function sentence_process(speak) {
        var position = 0;
        var raw = 0;

        for(var i=0; i<speak[0].length; i++) {
            speak[0][i][1][4] = position;
            position += speak[0][i][1][3];   
        }

        position = 0;
        for(var i=0; i<speak[1].length; i++) {
            if(position + speak[1][i][1][3] <= SENTENCE_LENGTH) {
                position += (speak[1][i][1][3] + IS_PADDING);
            }
            else {
                position = speak[1][i][1][3] + IS_PADDING;
                raw += 1;
            }
            speak[1][i][1][4] = position;
            speak[1][i][1][5] = raw;
        }
        return raw + 1;
    }

    function top_process(top) {
        var position = 0;
        for(var i=0; i<top.length; i++) {
            top[i][1][4] = position;
            position += top[i][1][3];
        }
    }
    

    function render_sentence(speak, index) {

        var raws = sentence_process(speak);
        cur_total_raw += raws;

        var line_origin_x1;
        var line_origin_x2;

        if(cur_total_raw > total_raw) {
            cur_total_raw = raws;
            col += 1;
        }
        var cur_col = $('.col' + String(col))[0];
        if(!cur_col) {
            d3.select('.vis')
                .style('width', String((ROLE_WIDTH + SENTENCE_WIDTH + 2) * (col + 1)) + 'px')
            
            d3.select('.vis')
                .append('div')
                .attr('class', 'col' + String(col))
                .attr('width', ROLE_WIDTH + SENTENCE_WIDTH)
                .attr('height', WINDOWHEIGHT)
                .style('border-width', '1px')
                .style('border-style', 'none dotted none  none')
                .style('border-color', 'red')
                .style('float', 'left')
                .style('padding', 2)
        }
    
        
        d3.select('.col' + String(col))
            .append('div')
            .attr('class', 'paragraph' + String(index))
            .attr('width', ROLE_WIDTH + SENTENCE_WIDTH)

        d3.select('.paragraph' + String(index))
            .append('svg')
            .attr('class', 'role' + String(index))
            .attr('width', ROLE_WIDTH)
            .attr('height', BOX_HEIGHT * raws)
            .style('padding', 0)
            .style('margin', 0)
            .style('border', 0)
        
        d3.select('.paragraph' + String(index))
            .append('svg')
            .attr('class', 'sentence' + String(index))
            .attr('width', SENTENCE_WIDTH)
            .attr('height', BOX_HEIGHT * raws)
            .style('padding', 0)
            .style('margin', 0)
            .style('border', 0)

        // 说话人
        var role = d3.select('.role' + String(index))
            .selectAll('g')
            .data(speak[0])
            .enter()
            .append('g')

        role.append('rect')  // 说话人背景框
            .attr('class', function(d) {
                return 'rect' + String(d[0]);
            })
            .attr("x", function(d, i) {
                return d[1][4] * EN_TEXT_SIZE + i * CHAR_PADDING;
            })
            .attr("y", function(d, i) {
                return TEXT_SIZE * 0.4 + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2) - TEXT_SIZE * 0.1;
            })
            .attr("width", function(d) {
                return d[1][3] * EN_TEXT_SIZE;
            })
            .attr("height", TEXT_SIZE * 1.5)
            .style('fill', 'white')

        role.append('text')  // 说话人文本
            .text(function(d) {
                return d[1][0];
            })
            .attr('class', function(d) {
                return 'text' + String(d[0]);
            })
            .attr("font-size", TEXT_SIZE)
            .attr("x", function(d, i) {
                console.log(d[1][0], d[1][4])
                return d[1][4] * EN_TEXT_SIZE + i * CHAR_PADDING;
            })
            .attr("y", function(d, i) {
                return TEXT_SIZE + PADDING_HEIGHT;
            })
            .attr("dx", 0)
            .attr("dy", 0)
            .style("text-anchor", "start");

        {role.append('line')  // 说话人上侧
            .attr('class', function(d) {
                return 'lineup' + String(d[0]);
            })
            .attr("x1", function(d, i) {
                return d[1][4] * EN_TEXT_SIZE + i * CHAR_PADDING;
            })
            .attr("y1", function(d, i) {
                return PADDING_HEIGHT;
            })
            .attr("x2", function(d, i) {
                return d[1][4] * EN_TEXT_SIZE + i * CHAR_PADDING + d[1][1][1] * (EN_TEXT_SIZE * d[1][3] - (1 - IS_PADDING) * PADDING_LINE);
            })
            .attr("y2", function(d, i) {
                return PADDING_HEIGHT;
            })
            .attr("stroke", 'blue')
            .attr("stroke-width", 1);}

        {role.append('line')  // 说话人下侧
            .attr('class', function(d) {
                return 'linedown' + String(d[0]);
            })
            .attr("x1", function(d, i) {
                return d[1][4] * EN_TEXT_SIZE + i * CHAR_PADDING + (d[1][3] - 1) * EN_TEXT_SIZE * 0.5;
            })
            .attr("y1", function(d, i) {
                return TEXT_SIZE + PADDING_HEIGHT * 2;
            })
            .attr("x2", function(d, i) {
                return (d[1][4] + d[1][3]) * EN_TEXT_SIZE + i * CHAR_PADDING - (d[1][3] - 1) * EN_TEXT_SIZE * 0.5;
            })
            .attr("y2", function(d, i) {
                return TEXT_SIZE + PADDING_HEIGHT * 2;
            })
            .attr("stroke", function(d) {
                return get_color(d[1][1][0]);
            })
            .attr("stroke-width", 3)}


        // 句子
        var sentence =  d3.select('.sentence' + String(index))
            .selectAll('g')
            .data(speak[1])
            .enter()
            .append('g')

        {sentence.append('rect')  // 句子背景框
            .attr('class', function(d) {
                return 'rect' + String(d[0]);
            })
            .attr("x", function(d, i) {
                return (d[1][4] - d[1][3]) * EN_TEXT_SIZE;
            })
            .attr("y", function(d, i) {
                return TEXT_SIZE * 0.4 + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2) - TEXT_SIZE * 0.1;
                return TEXT_SIZE * 0.4 + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2) - TEXT_SIZE * 0.3;
            })
            .attr("width", function(d) {
                return d[1][3] * EN_TEXT_SIZE;
            })
            .attr("height", TEXT_SIZE * 1.5)
            .style('fill', 'white')}
            
        sentence.append('text')  // 句子文本
            .text(function(d) {
                return d[1][0];
            })
            .attr('class', function(d) {
                return 'text' + String(d[0]);
            })
            .attr("font-size", TEXT_SIZE)
            .attr("x", function(d, i) {
                console.log(d, d[1][4])
                return d[1][4] * EN_TEXT_SIZE;
            })
            .attr("y", function(d, i) {
                 return TEXT_SIZE + PADDING_HEIGHT + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2);
            })
            .attr("dx", 0)
            .attr("dy", 0)
            .style("text-anchor", "end");
            
        sentence.append('line')  // 句子上侧 距离 json['top_sumv_norms'][i][2]
            .attr('class', function(d) {
                return 'lineup' + String(d[0]);
            })
            .attr("x1", function(d, i) {
                return (d[1][4] - d[1][3]) * EN_TEXT_SIZE;
            })
            .attr("y1", function(d, i) {
                return PADDING_HEIGHT + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2);
            })
            .attr("x2", function(d, i) {
                return (d[1][4] - d[1][3]) * EN_TEXT_SIZE + d[1][1][1] * (EN_TEXT_SIZE * d[1][3] - (1 - IS_PADDING) * PADDING_LINE);
            })
            .attr("y2", function(d, i) {
                return PADDING_HEIGHT + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2);
            })
            .attr("stroke", 'blue')
            .attr("stroke-width", 1);

        sentence.append('line')  // 句子下侧 json['top_sumv_norms'][i][1]
            .attr('class', function(d) {
                return 'linedown' + String(d[0]);
            })
            .attr("x1", function(d, i) {
                return (d[1][4] - d[1][3]) * EN_TEXT_SIZE + (d[1][3] - 1) * EN_TEXT_SIZE * 0.5;
                return (d[1][4] - d[1][3]) * (TEXT_SIZE + CHAR_PADDING) + PADDING_LINE * 2 + (d[1][3] - 1) * TEXT_SIZE * 0.5;
            })
            .attr("y1", function(d, i) {
                return TEXT_SIZE + PADDING_HEIGHT * 2 + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2);
            })
            .attr("x2", function(d, i) {
                return d[1][4] * EN_TEXT_SIZE - (d[1][3] - 1) * EN_TEXT_SIZE * 0.5;
                return d[1][4] * (TEXT_SIZE + CHAR_PADDING) - PADDING_LINE * 2 - (d[1][3] - 1) * TEXT_SIZE * 0.5;
            })
            .attr("y2", function(d, i) {
                return TEXT_SIZE + PADDING_HEIGHT * 2 + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2);
            })
            .attr("stroke", function(d) {
                return get_color(d[1][1][0]);
            })
            .attr("stroke-width", 3)
            .style("z-index", 9999)

        role.on("mouseover", function(d, index) {  // onmouseover
            console.log('index', d[0]);
            bgcolor = d[1][2]
            choose = d[0];
            d3.select('.rect' + String(choose))
                .style('fill', 'red')
                .attr('fill-opacity', 0.2)
            for(var i=0; i<bgcolor.length; i++) {
                d3.select('.rect' + String(bgcolor[i][0]))
                    .style('fill', 'blue')
                    .attr('fill-opacity', bgcolor[i][1])
            }   
            line_origin_x1 = Number(d3.select('.linedown' + String(choose)).attr('x1'));
            line_origin_x2 = Number(d3.select('.linedown' + String(choose)).attr('x2'));
            var line_new_x1 = Number(d3.select('.rect' + String(choose)).attr('x'));
            var line_new_x2 = line_new_x1 + Number(d3.select('.rect' + String(choose)).attr('width'));
            d3.select('.linedown' + String(choose)).attr('x1', line_new_x1).attr('x2', line_new_x2).attr("stroke-width", 6);
        })

        role.on("mouseout", function() {
            d3.select('.rect' + String(choose))
                .style('fill', 'white')
            for(var i=0; i<bgcolor.length; i++) {
                d3.select('.rect' + String(bgcolor[i][0]))
                    .style('fill', 'white')
            }
            d3.select('.linedown' + String(choose)).attr('x1', line_origin_x1).attr('x2', line_origin_x2).attr("stroke-width", 3);
        });

        sentence.on("mouseover", function(d, index) {  // onmouseover
            console.log('index', d[0], d[1]);
            bgcolor = d[1][2];
            choose = d[0];
            d3.select('.rect' + String(choose))
                .style('fill', 'red')
                .attr('fill-opacity', 0.2)
            for(var i=0; i<bgcolor.length; i++) {
                d3.select('.rect' + String(bgcolor[i][0]))
                    .style('fill', 'blue')
                    .attr('fill-opacity', bgcolor[i][1])
            }
            line_origin_x1 = Number(d3.select('.linedown' + String(choose)).attr('x1'));
            line_origin_x2 = Number(d3.select('.linedown' + String(choose)).attr('x2'));
            var line_new_x1 = Number(d3.select('.rect' + String(choose)).attr('x'));
            var line_new_x2 = line_new_x1 + Number(d3.select('.rect' + String(choose)).attr('width'));
            d3.select('.linedown' + String(choose)).attr('x1', line_new_x1).attr('x2', line_new_x2).attr("stroke-width", 6);
        })

        sentence.on("mouseout", function() {
            d3.select('.rect' + String(choose))
                .style('fill', 'white')
            for(var i=0; i<bgcolor.length; i++) {
                d3.select('.rect' + String(bgcolor[i][0]))
                    .style('fill', 'white')
            }
            d3.select('.linedown' + String(choose)).attr('x1', line_origin_x1).attr('x2', line_origin_x2).attr("stroke-width", 3);
        });
    }

    function show_top(data) {
        top_process(data)
        console.log(data)

        var top_container = d3.select('.top')
            .append('svg')
            .attr('width', EN_TEXT_SIZE * 2 * top_length)
            .attr('height', TEXT_SIZE * 2.4)
            .selectAll('g')
            .data(data)
            .enter()
            .append('g')

        top_container.append('rect')
            .attr('class', function(d, i) {
                return 'top_rect' + String(i);
            })
            .attr("x", function(d, i) {
                return d[1][4] * EN_TEXT_SIZE * 2 + i * CHAR_PADDING * 2;
            })
            .attr("y", function(d, i) {
                return 0;
            })
            .attr("width", function(d) {
                return d[1][3] * EN_TEXT_SIZE * 2;
            })
            .attr("height", TEXT_SIZE * 2.4)
            .style('fill', 'lightblue')
            .attr('fill-opacity', 0.4)

        top_container.append('text')
            .text(function(d) {
                return d[1][0];
            })
            .attr('class', function(d) {
                return 'top_text' + String(d[0]);
            })
            .attr("font-size", TEXT_SIZE * 2)
            .attr("x", function(d, i) {
                // return TEXT_SIZE * i * 2;
                return d[1][4] * EN_TEXT_SIZE * 2 + i * CHAR_PADDING * 2;
            })
            .attr("y", function(d, i) {
                return TEXT_SIZE * 2;
            })
            .attr("dx", 0)
            .attr("dy", 0)
            .style("text-anchor", "start");

        top_container.append('line')  // top上侧 距离 json['top_sumv_norms'][i][2]
            .attr('class', function(d) {
                return 'top_lineup' + String(d[0]);
            })
            .attr("x1", function(d, i) {
                return d[1][4] * EN_TEXT_SIZE * 2 + i * CHAR_PADDING * 2 + PADDING_LINE * (1 - IS_PADDING);
            })
            .attr("y1", function(d, i) {
                return PADDING_HEIGHT + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2);
            })
            .attr("x2", function(d, i) {
                return d[1][4] * EN_TEXT_SIZE * 2 + i * CHAR_PADDING * 2 + d[1][1][1] * (EN_TEXT_SIZE * 2 * d[1][3] - (1 - IS_PADDING) * PADDING_LINE);
            })
            .attr("y2", function(d, i) {
                return PADDING_HEIGHT + d[1][5] * (TEXT_SIZE + PADDING_HEIGHT * 2);
            })
            .attr("stroke", 'blue')
            .attr("stroke-width", 1);

        top_container.append('line')  // top下侧 json['top_sumv_norms'][i][1]
            .attr('class', function(d) {
                return 'top_linedown' + String(d[0]);
            })
            .attr("x1", function(d, i) {
                return d[1][4] * EN_TEXT_SIZE * 2 + i * CHAR_PADDING * 2 + (d[1][3] - 1) * EN_TEXT_SIZE * 1;
            })
            .attr("y1", function(d, i) {
                return TEXT_SIZE * 2 + PADDING_HEIGHT;
            })
            .attr("x2", function(d, i) {
                return (d[1][4] + d[1][3]) * EN_TEXT_SIZE * 2 + i * CHAR_PADDING * 2 - (d[1][3] - 1) * EN_TEXT_SIZE * 1;
            })
            .attr("y2", function(d, i) {
                return TEXT_SIZE * 2 + PADDING_HEIGHT;
            })
            .attr("stroke", function(d) {
                return get_color(d[1][1][0]);
            })
            .attr("stroke-width", 3)
/*            .attr("stroke-opacity", function(d) {
                return d[1][1][0];
            })*/

        var line_origin_x1;
        var line_origin_x2;

        top_container.on("mouseover", function(d, index) {  // onmouseover
            console.log('index', index, d, d[1][2]);
            for(var i=0; i<d[1][2].length; i++) {
                console.log(d[1][2][i], tokens[d[1][2][i][0]]);
            }
            bgcolor = d[1][2];
            choose = d[0];
            top_choose = index;
            d3.select('.rect' + String(choose))
                .style('fill', 'red')
                .attr('fill-opacity', 0.2)
            for(var i=0; i<bgcolor.length; i++) {
                d3.select('.rect' + String(bgcolor[i][0]))
                    .style('fill', 'blue')
                    .attr('fill-opacity', bgcolor[i][1])
            }
            
            line_origin_x1 = Number(d3.select('.linedown' + String(choose)).attr('x1'));
            line_origin_x2 = Number(d3.select('.linedown' + String(choose)).attr('x2'));
            var line_new_x1 = Number(d3.select('.rect' + String(choose)).attr('x'));
            var line_new_x2 = line_new_x1 + Number(d3.select('.rect' + String(choose)).attr('width'));
            d3.select('.linedown' + String(choose)).attr('x1', line_new_x1).attr('x2', line_new_x2).attr("stroke-width", 7);
            d3.select('.top_rect' + String(index))
                .style('fill', 'red')
        })

        top_container.on("mouseout", function() {
            d3.select('.rect' + String(choose))
                .style('fill', 'white')
            for(var i=0; i<bgcolor.length; i++) {
                d3.select('.rect' + String(bgcolor[i][0]))
                    .style('fill', 'white')
            }
            d3.select('.linedown' + String(choose)).attr('x1', line_origin_x1).attr('x2', line_origin_x2).attr("stroke-width", 3);
            d3.select('.top_rect' + String(top_choose))
            .style('fill', 'lightblue')
        });
    }

    function render() {
        col = 0;
        cur_total_raw = 0;
        console.log(roles_length)
        ROLE_WIDTH = EN_TEXT_SIZE * roles_length;
        SENTENCE_WIDTH = WINDOWWIDTH / COLS - ROLE_WIDTH - CHAR_PADDING;
        SENTENCE_LENGTH = Math.floor(SENTENCE_WIDTH / TEXT_SIZE) * 2;  
        for(var i=0; i<sentences.length; i++) {//sentences.length
        // for(var i=1; i<2; i++) {
            render_sentence(sentences[i], i);
        }
        show_top(top);
        
    }
    
    render();
});