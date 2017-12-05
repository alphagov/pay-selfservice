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
            'govuk_modules/govuk_frontend_toolkit/stylesheets',
            'node_modules/govuk-elements-sass/public/sass/'
          ],
          outputStyle: 'expanded'
        },
        files: [
          {
            expand: true,
            cwd: 'app/assets/sass',
            src: ['*.scss'],
            dest: 'public/stylesheets/',
            ext: '.css'
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
            cwd: 'node_modules/govuk_frontend_toolkit',
            src: '**',
            dest: 'govuk_modules/govuk_frontend_toolkit/'
          },
          {
            expand: true,
            cwd: 'node_modules/govuk-elements-sass',
            src: '**',
            dest: 'govuk_modules/govuk-elements-sass/'
          },
          {
            expand: true,
            cwd: 'node_modules/govuk_template_jinja/',
            src: '**',
            dest: 'govuk_modules/govuk_template/',
            rename: (dest, src) => dest + src.replace('html', 'njk')
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
          },
          {
            expand: true,
            cwd: 'govuk_modules/govuk_frontend_toolkit/images/',
            src: ['**/*', '!sass/**'],
            dest: 'public/images/icons'
          }
        ]
      }
    },

    // workaround for libsass
    replace: {
      fixSass: {
        src: ['govuk_modules/govuk_frontend_toolkit/**/*.scss'],
        overwrite: true,
        replacements: [
          {
            from: /filter:chroma(.*);/g,
            to: 'filter:unquote("chroma$1");'
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
        browserifyOptions: { standalone: 'module' },
        transform: [
          [
            'babelify',
            {
              presets: [
                ['env', {
                  'targets': {
                    'browsers': ['last 2 versions', 'safari >= 7', 'ie >= 10']
                  }
                }]
              ]
            }
          ],
          [
            'nunjucksify',
            {
              extension: '.njk'
            }]
        ]
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
    'grunt-contrib-copy',
    'grunt-contrib-watch',
    'grunt-contrib-clean',
    'grunt-sass',
    'grunt-nodemon',
    'grunt-browserify',
    'grunt-text-replace',
    'grunt-concurrent'
  ].forEach(function (task) {
    grunt.loadNpmTasks(task)
  })

  grunt.registerTask('generate-assets', [
    'clean',
    'copy',
    'replace',
    'browserify',
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
