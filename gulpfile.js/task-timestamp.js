/**
 *
 * Function for gulp (Timestamp)
 *
 * @author Takuto Yanagida
 * @version 2022-03-23
 *
 */

'use strict';

const gulp = require('gulp');
const $    = require('gulp-load-plugins')({ pattern: ['gulp-plumber', 'gulp-ignore', 'gulp-replace', 'gulp-changed'] });

const require_ = (path) => { let r; return () => { return r || (r = require(path)); }; }

function makeTimestampTask(src, dest = './dist', base = null) {
	const luxon = require_('luxon');

	const timestampTask = () => gulp.src(src, { base: base })
		.pipe($.plumber())
		.pipe($.ignore.include({ isFile: true }))
		.pipe($.replace(/v\d+t/g, `v${luxon().DateTime.now().toFormat('HHmmss')}t`))
		.pipe($.changed(src, { hasChanged: $.changed.compareContents }))
		.pipe(gulp.dest(dest));
	return timestampTask;
}

exports.makeTimestampTask = makeTimestampTask;
