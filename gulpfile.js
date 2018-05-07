var gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const webpack = require('webpack-stream');
const webp = require('gulp-webp');
var minifyjs = require('gulp-js-minify');
var htmlmin = require('gulp-htmlmin');
var pump = require('pump');
var order = require("gulp-order");


gulp.task('lint', function () {
	return gulp.src(['js/*.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('minify-css', (done) => {
	return gulp.src('css/*.css')
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

gulp.task('concat-js', function (done) {
  gulp.src('js/**/*.js')
    .pipe(order(['js/utils/idb.js',
      'js/utils/matches-selector.js',
      'js/utils/parseHTML.js',
      'js/utils/simple-transition.js',
      'js/utils/handlebars.min.js',
      'js/utils/focus-visible.js',
      'js/utils/closest.js',
      'js/views/Toasts.js',
      'js/dbhelper.js',
      'js/IndexController.js',
      'js/index.js',
      'js/main.js',
      'js/restaurant_info.js']))
    .pipe(concat('all.js'))
    .pipe(gulp.dest('js'));
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

// gulp.task('scripts', function (done) {
// 	gulp.src('js/**/*.js')
// 		.pipe(sourcemaps.init())
// 		.pipe(babel({
// 			presets: ['es2015']
// 		}))
// 		.pipe(concat('all.js'))
// 		.pipe(webpack())
// 		.pipe(sourcemaps.write())
// 		.pipe(gulp.dest('dist/js'));
// 	done();
// });

gulp.task('scripts', function (done) {
  pump([
      gulp.src('js/**/*.js'),
      uglify(),
      gulp.dest('dist/js')
    ],
    done
  );
  done();
});


gulp.task('scripts-dist', function (done) {
	gulp.src('js/**/*.js')
		// .pipe(babel({
		// 	presets: ['env']
		// }))
		// .pipe(concat('all.js'))
		.pipe(uglify())
		.pipe(gulp.dest('./dist/js'));
	done();
});

gulp.task('webpack', function() {
  return gulp.src('js/**/*.js')
    .pipe(webpack({
      module: {
        loaders: [{
          test: /.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          query: {
            presets: ['env']
          }
        }]
      },
      output: {
        filename: 'all.js',
      },
    }))
    // .pipe(uglify())
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('dist', gulp.series('copy-html', 'copy-files', 'copy-sw', 'copy-images', 'minify-css', 'copy-js'));

gulp.task('default', gulp.parallel('minify-css', 'copy-html', 'copy-images', function() {
	gulp.watch('css/**/*.css', gulp.series('minify-css'));
	gulp.watch('js/**/*.js', gulp.series('lint'));
	gulp.watch('*.html', gulp.series('copy-html'));

	// gulp.watch('./dist/index.html').on('change', browserSync.reload);
	//
	// browserSync.init({
	// 	server: './dist'
	// });
}));