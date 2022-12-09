/**
 * Function for gulp (Timestamp)
 *
 * @author Takuto Yanagida
 * @version 2022-09-16
 */

import gulp from 'gulp';
import plumber from 'gulp-plumber';
import ignore from 'gulp-ignore';
import replace from 'gulp-replace';
import changed from 'gulp-changed';
import { DateTime } from 'luxon';

export function makeTimestampTask(src, dest = './dist', base = null) {
	const timestampTask = () => gulp.src(src, { base: base })
		.pipe(plumber())
		.pipe(ignore.include({ isFile: true }))
		.pipe(replace(/v\d+t/g, `v${DateTime.now().toFormat('HHmmss')}t`))
		.pipe(changed(src, { hasChanged: changed.compareContents }))
		.pipe(gulp.dest(dest));
	return timestampTask;
}
