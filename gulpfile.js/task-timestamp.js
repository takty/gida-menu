/**
 *
 * Function for gulp (Timestamp)
 *
 * @author Takuto Yanagida
 * @version 2021-10-14
 *
 */

'use strict';

const gulp = require('gulp');
const $    = require('gulp-load-plugins')({ pattern: ['gulp-*'] });

function makeTimestampTask(src, dest = './dist', base = null) {
	const require_ = (path) => { let r; return () => { return r || (r = require(path)); }; }
	const moment = require_('moment');
	const timestampTask = () => gulp.src(src, { base: base })
		.pipe($.plumber())
		.pipe($.ignore.include({ isFile: true }))
		.pipe($.replace(/v\d+t/g, `v${moment()().format('HHmmss')}t`))
		.pipe($.changed(src, { hasChanged: $.changed.compareContents }))
		.pipe(gulp.dest(dest));
	return timestampTask;
}

exports.makeTimestampTask = makeTimestampTask;
