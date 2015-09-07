'use strict';

// globals
// =======
var 
  frontmatter = require( 'gulp-front-matter' ),
  gulp = require( 'gulp' ),
  markdown = require( 'gulp-markdown' ),
  path = require( 'path' ),
  render = require( 'gulp-nunjucks-render' ),
  rimraf = require( 'rimraf' ),
  slug = require( 'slug' ),
  through2 = require( 'through2' )

// evil globals, level I ( the chosen one )
// and why is it more evil than a required module ?
//
var nunjucks = render.nunjucks
nunjucks.configure( './assets', { watch: false } )

// evil globals, level II ( my own one )
//
var site = {
  posts: []
}

// functions
// ========
function slugify( s ) {
  return slug( s )
}

function may_be_add_basename_as_slug( vinyl ) {
  if( !vinyl.data.slug ) {
    vinyl.data.slug = slugify( vinyl.data.title )
  }
  return vinyl
}

function may_be_add_resume( vinyl ) {
  if( !vinyl.data.resume ) {
    vinyl.data.slug = slugify( vinyl.data.title )
  }
  return vinyl
}


// tasks
// =====
gulp.task( 'clean', function ( cb ) {
  return rimraf( './site', cb )
})

gulp.task( 'styles', function () {
  return gulp.src( 'node_modules/bootstrap/dist/css/bootstrap.css' )
    .pipe( gulp.dest( './site/styles' ) )
})

gulp.task( 'scripts', function () {
  return gulp.src( [ 'node_modules/holderjs/holder.js' ] )
    .pipe( gulp.dest( './site/scripts' ) )
})

gulp.task( 'posts', function () {
  return gulp.src( './contents/posts/*.md' )
    .pipe( frontmatter( { property: 'data' } ) )
    .pipe( markdown() )
    // rename basename to slug
    .pipe( through2.obj( function ( f, _encoding, cb ) {
      may_be_add_basename_as_slug( f )
      f.path = path.join( f.base, f.data.slug + path.extname( f.path ) )
      cb( undefined, f )
    }))
    .pipe( through2.obj( function ( f, _encoding, cb ) {
      f.contents = new Buffer( nunjucks.render( 'post.html', { contents: f.contents } ) )
      cb( undefined, f )
    }))
    .pipe( gulp.dest( './site/posts' ) )
    .pipe( through2.obj( function ( f, _encoding, cb ) {
      // write to global II
      f.data.href = f.path
      site.posts.push( f.data )
      cb( undefined, f )
    }))
})

gulp.task( 'site', [ 'posts' ], function () {
  return gulp.src( './assets/index.html' )
    .pipe( render( site ) )       // read from global II
    .pipe( gulp.dest( './site' ) )
})

gulp.task( 'build', [ 'site', 'styles', 'scripts' ] )
gulp.task( 'default', [ 'build' ] )