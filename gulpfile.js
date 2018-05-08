const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const webp = require('gulp-webp');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');


gulp.task('lint', function () {
	return gulp.src(['js/*.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('minify-css', (done) => {
	gulp.src('css/*.css')
		.pipe(cleanCSS({compatibility: 'ie8'}))
		.pipe(gulp.dest('dist/css'));
	done();
});

gulp.task('copy-files', function (done) {
	gulp.src(['favicon.ico', 'manifest.json'])
		.pipe(gulp.dest('dist/'));
	done();
});

gulp.task('copy-html', function (done) {
  gulp.src(['./*.html'])
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist/'));
  done();
});

gulp.task('copy-sw', function (done) {
  gulp.src('./sw.js')
    .pipe(gulp.dest('dist/'));
  done();
});

gulp.task('copy-js', function (done) {
  gulp.src('js/**/*.js')
		.pipe(uglify())
    .pipe(gulp.dest('dist/js'));
  done();
});

gulp.task('copy-images', function (done) {
	gulp.src('images/*')
		.pipe(imagemin({
			progressive: true,
			use: [pngquant()]
		}))
    .pipe(webp())
		.pipe(gulp.dest('dist/images'));
	done();
});

gulp.task('dist', gulp.parallel('copy-html', 'copy-files', 'copy-sw', 'copy-images', 'minify-css', 'copy-js'));

gulp.task('default', gulp.parallel('minify-css', 'copy-html', 'copy-images', 'copy-files', 'copy-sw', 'copy-js', function() {
	gulp.watch('css/**/*.css', gulp.series('minify-css'));
	gulp.watch('js/**/*.js', gulp.series('copy-js'));
	gulp.watch('*.html', gulp.series('copy-html'));
  gulp.watch(['favicon.ico', 'manifest.json'], gulp.series('copy-files'));
  gulp.watch('sw.js', gulp.series('copy-sw'));

	gulp.watch('./dist/index.html').on('change', browserSync.reload);

	browserSync.init({
		server: './dist',
    browser: 'chrome'
	});
}));