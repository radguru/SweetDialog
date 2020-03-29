const GULP = require('gulp');
const ROLLUP = require('gulp-rollup');
const ROLLUPJSON = require('@rollup/plugin-json');
const FS = require('fs');
const BABEL = require('rollup-plugin-babel');
const GULPIF = require('gulp-if');
const UGLIFY = require('gulp-uglify');
const RENAME = require('gulp-rename');
const SASS = require('sass');


const PACKAGEJSON = require('./package.json');
const VERSION = PACKAGEJSON.version;
const BANNER = `/*!
* ${PACKAGEJSON.name} v${VERSION}
* Released under the ${PACKAGEJSON.license} LICENSE.
*/s`



const SRCSCRIPTFILES = ['src/**/*.js'];
const SCRSTYLEFILES = ['src/**/*.scss'];

var skipMinification = true;

GULP.task('build:scripts', () => {
    return GULP.src(['package.json', ...SRCSCRIPTFILES])
        .pipe(ROLLUP({
            plugins: [
                ROLLUPJSON(),
                BABEL({
                    exclude: 'node_modules/**'
                })
            ],
            input: 'src/sweetdialog.js',
            output: {
                format: 'umd',
                name: 'SweetDialog',
                banner: BANNER,
            },
            // https://github.com/rollup/rollup/issues/2271
            onwarn (warning, rollupWarn) {
                if (warning.code !== 'CIRCULAR_DEPENDENCY') {
                    rollupWarn(warning)
                }
            },
        }))
        .on('error', (error) => {
            if (continueOnError) {
                log(error)
            } else {
                throw error
            }
        })
        .pipe(GULP.dest('dist'))
        .pipe(GULPIF(!skipMinification, UGLIFY()))
        .pipe(GULPIF(!skipMinification, RENAME('sweetdialog.min.js')))
        .pipe(GULPIF(!skipMinification, GULP.dest('dist')))
})


GULP.task('build:styles', () => {
    const result = SASS.renderSync({ file: 'src/sweetdialog.scss' })
    FS.writeFileSync('dist/sweetdialog.css', result.css)
    return GULP.src('dist/sweetdialog.css')
        .pipe(autoprefixer())
        .pipe(GULP.dest('dist'))
        .pipe(GULPIF(!skipMinification, cleanCss()))
        .pipe(GULPIF(!skipMinification, RENAME('sweetdialog.min.css')))
        .pipe(GULPIF(!skipMinification, GULP.dest('dist')))
})
  
/**
 * Warning: This task depends folder dist/
 */
GULP.task('build:standalone', () => {
    const prettyJs = GULP.src('dist/sweetdialog.js')
    const prettyCssAsJs = GULP.src('dist/sweetdialog.min.css')
        .pipe(css2js())
    const prettyStandalone = merge(prettyJs, prettyCssAsJs)
        .pipe(concat('sweetdialog.all.js'))
        .pipe(GULP.dest('dist'))
    if (skipMinification) {
        return prettyStandalone
    } else {
        const uglyJs = GULP.src('dist/sweetdialog.min.js')
        const uglyCssAsJs = GULP.src('dist/sweetdialog.min.css')
           .pipe(css2js())
        const uglyStandalone = merge(uglyJs, uglyCssAsJs)
            .pipe(concat('sweetdialog.all.min.js'))
            .pipe(GULP.dest('dist'))
        return merge([prettyStandalone, uglyStandalone])
    }
})


GULP.task('clean', () => {
    if (!FS.existsSync('dist')) {
        FS.mkdirSync('dist')
    }
    return Promise.resolve();
});

GULP.task('build', GULP.series(
    'clean',
    GULP.parallel('build:scripts', 'build:styles'),
    // ...(skipStandalone ? [] : ['build:standalone'])
))

GULP.task('default', GULP.parallel('build'));