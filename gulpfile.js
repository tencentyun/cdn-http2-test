var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var cheerio = require('cheerio');

var SPLIT_X, SPLIT_Y;

//可修改配置部分

var IMG_PATH_H1 = 'https://h1.qcloudcdn.com/qcloud-h1.jpg';//用于HTTP/1.1的测试图片
var IMG_PATH_H2 = 'https://h2.qcloudcdn.com/qcloud-h2.jpg';//用于HTTP/2的测试图片
var IMG_WIDTH = 1280;//测试图片的宽度
var IMG_HEIGHT = 1280;//测试图片的高度
SPLIT_X = SPLIT_Y = 20;//测试图片分块数，这里填20就意味着分割成20*20=400个小图

//可修改配置部分



var generateSplitImgByCI = function (type) {

	var res = '';

	type = type || 'h1';

	var path = IMG_PATH_H1;
	if (type == 'h2') {
		path = IMG_PATH_H2;
	}
	var itemWidth = parseInt(IMG_WIDTH / SPLIT_X);
	var itemHeight = parseInt(IMG_HEIGHT / SPLIT_Y);

	for (var i = 0; i < SPLIT_X; i++) {
		var str = '<div>\r\n';

		for (var j = 0; j < SPLIT_Y; j++) {
			var param = '?imageMogr2/cut/' + parseInt(itemWidth) + 'x' +
				parseInt(itemHeight) + 'x' +
				parseInt(j * itemWidth) + 'x' + parseInt(i * itemHeight);

			var style = 'style="max-width:' + (itemWidth / IMG_WIDTH * 100 + '%') +
				';max-height:' + (itemHeight / IMG_HEIGHT * 100 + '%') + '"';

			str += ('<img src="' + path + param + '" ' + style + '>');
			str += '\r\n';

		}

		str += '</div>\r\n';
		res += str;

	}

	var filename = 'test-' + type + '.html';
	var $ = cheerio.load(fs.readFileSync(filename));
	$('.container').html(res);
	$('#js-total-img').text(SPLIT_X * SPLIT_Y);

	fs.writeFileSync(filename, $.html());


	return res;


};


gulp.task('default', function () {
	generateSplitImgByCI('h1');
	generateSplitImgByCI('h2');
});
