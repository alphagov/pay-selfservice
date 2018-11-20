module.exports = function (grunt) {
  grunt.initConfig({
    // Clean
    clean: ['public', 'govuk_modules'],

    // Builds Sass
    sass: {
      dev: {
        options: {
          style: 'expanded',
          sourcemap: true,
          includePaths: [
            'node_modules',
            'govuk_modules/accessible-autocomplete/'
          ],
          outputStyle: 'compressed'
        },
        files: [
          {
            expand: true,
            cwd: 'app/assets/sass',
            src: ['*.scss'],
            dest: 'public/stylesheets/',
            ext: '.min.css'
          }
        ]
      }
    },

    // Copies templates and assets from external modules and dirs
    copy: {
      govuk: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/accessible-autocomplete/dist',
            src: '*.css',
            dest: 'govuk_modules/accessible-autocomplete/',
            rename: (dest, src) => dest + src.replace('min.css', 'scss')
          }
        ]
      },
      html5shiv: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/html5shiv/dist',
            src: 'html5shiv.min.js',
            dest: 'public/vendor/'
          }
        ]
      },
      assets: {
        files: [
          {
            expand: true,
            cwd: 'app/assets/',
            src: ['**/*', '!sass/**'],
            dest: 'public/'
          }
        ]
      }
    },

    // Watches assets and sass for changes
    watch: {
      css: {
        files: ['app/assets/sass/**/*.scss'],
        tasks: ['sass'],
        options: {
          spawn: false,
          livereload: true
        }
      },
      assets: {
        files: ['app/assets/**/*', '!app/assets/sass/**'],
        tasks: ['copy:assets'],
        options: {
          spawn: false
        }
      }
    },

    browserify: {
      'public/js/application.js': ['app/browsered.js'],
      options: {
        browserifyOptions: {
          standalone: 'module'
        },
        transform: [
          [
            'nunjucksify',
            {
              extension: '.njk'
            }
          ]
        ]
      }
    },

    babel: {
      options: {
        presets: ['@babel/preset-env'],
        compact: false
      },
      dist: {
        files: {
          'public/js/application.js': 'public/js/application.js'
        }
      }
    },

    uglify: {
      my_target: {
        files: {
          'public/js/application.min.js': ['public/js/application.js']
        }
      }
    },

    // nodemon watches for changes and restarts app
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          ext: 'js',
          ignore: ['node_modules/**', 'app/assets/**', 'public/**'],
          args: ['-i=true']
        }
      }
    },

    concurrent: {
      target: {
        tasks: ['watch', 'nodemon'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  [
    'grunt-babel',
    'grunt-browserify',
    'grunt-concurrent',
    'grunt-contrib-clean',
    'grunt-contrib-copy',
    'grunt-contrib-uglify',
    'grunt-contrib-watch',
    'grunt-nodemon',
    'grunt-sass'
  ].forEach(function (task) {
    grunt.loadNpmTasks(task)
  })

  grunt.registerTask('generate-assets', [
    'clean',
    'copy',
    'browserify',
    'babel',
    'uglify',
    'sass'
  ])

  const defaultTasks = ['generate-assets', 'concurrent:target']

  grunt.registerTask('default', defaultTasks)

  grunt.event.on('watch', function (action, filepath, target) {
    // just copy the asset that was changed, not all of them

    if (target === 'assets') {
      grunt.config(
        'copy.assets.files.0.src',
        filepath.replace('app/assets/', '')
      )
    }
  })
}
