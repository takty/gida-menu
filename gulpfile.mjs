/**
 * Gulpfile
 *
 * @author Takuto Yanagida
 * @version 2022-12-09
 */


'use strict';

import gulp from 'gulp';

import { makeJsTask } from './gulp/task-js.mjs';
import { makeSassTask } from './gulp/task-sass.mjs';
import { makeCopyTask } from './gulp/task-copy.mjs';

const js = gulp.parallel(
	makeJsTask('./src/global.js',   './dist/js'),
	makeJsTask('./src/priority.js', './dist/js'),
);

const sass = gulp.parallel(
	makeSassTask('./src/global.scss',   './dist/css'),
	makeSassTask('./src/priority.scss', './dist/css'),
);

export const build = gulp.parallel(js, sass);

const watch = done => {
	gulp.watch('src/**/*.js', gulp.series(js));
	gulp.watch('src/**/*.scss', gulp.series(sass));
	done();
};

export default gulp.series(build, watch);


// -----------------------------------------------------------------------------


const doc_js = gulp.series(js, makeCopyTask(['dist/js/*'], './docs/js'));

const doc_css = gulp.series(sass, makeCopyTask(['dist/css/*'], './docs/css'));

const doc_sass = makeSassTask('docs/style.scss', './docs/css');

const doc_watch = async done => {
	const { makeTimestampTask } = await import('./gulp/task-timestamp.mjs');
	const doc_timestamp = makeTimestampTask('docs/**/*.html', './docs');

	gulp.watch('src/**/*.js', gulp.series(doc_js, doc_timestamp));
	gulp.watch('src/**/*.scss', gulp.series(doc_css, doc_timestamp));
	gulp.watch('docs/style.scss', gulp.series(doc_sass, doc_timestamp));
	done();
};

const doc_build = async done => {
	const { makeTimestampTask } = await import('./gulp/task-timestamp.mjs');
	const doc_timestamp = makeTimestampTask('docs/**/*.html', './docs');

	gulp.parallel(doc_js, doc_css, doc_sass, doc_timestamp);
	done();
};

export const doc = gulp.series(doc_build, doc_watch);
