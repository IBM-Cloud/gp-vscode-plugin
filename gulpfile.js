// Include gulp
var gulp = require('gulp');

gulp.task('copy-data-nls', function() {
    gulp.src('./src/data.nls.json')
    .pipe(gulp.dest('./out/src'));
});

// Default Task
gulp.task('default', ['copy-data-nls']);