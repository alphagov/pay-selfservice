var environment  = require(__dirname + '/app/services/environment.js');

module.exports = function(grunt){
  grunt.initConfig({
    // Clean
    clean: ['public', 'govuk_modules'],

    // Builds Sass
    sass: {
      dev: {
        options: {
          style: "expanded",
          sourcemap: true,
          includePaths: [
            'govuk_modules/govuk_frontend_toolkit/stylesheets',
            'node_modules/govuk-elements-sass/public/sass/'
          ],
          outputStyle: 'expanded'
        },
        files: [{
          expand: true,
          cwd: "app/assets/sass",
          src: ["*.scss"],
          dest: "public/stylesheets/",
          ext: ".css"
        }]
      }
    },

    // Copies templates and assets from external modules and dirs
    copy: {
      govuk: {
        files: [{
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
        }
        ]
      },
      html5shiv: {
        files: [{
          expand: true,
          cwd: 'node_modules/html5shiv/dist',
          src: 'html5shiv.min.js',
          dest: 'public/vendor/'
        }]
      },
      assets: {
        files: [{
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
        }]
      },
    },

    // workaround for libsass
    replace: {
      fixSass: {
        src: ['govuk_modules/govuk_frontend_toolkit/**/*.scss'],
        overwrite: true,
        replacements: [{
          from: /filter:chroma(.*);/g,
          to: 'filter:unquote("chroma$1");'
        }]
      }
    },

    // Watches assets and sass for changes
    watch: {
      css: {
        files: ['app/assets/sass/**/*.scss'],
        tasks: ['sass'],
        options: {
          spawn: false,
        }
      },
      assets:{
        files: ['app/assets/**/*', '!app/assets/sass/**'],
        tasks: ['copy:assets'],
        options: {
          spawn: false,
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
          args: ["-i=true"]
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
    },

    mochaTest: {
      run: {
        src: grunt.option('only') ? [grunt.option('only')] : [
          'test/**/*.js',
          '!test/test_helpers/*.js'
        ]
      },
      test: {
        options: {
          reporter: 'spec',
          captureFile: 'mocha-test-results.txt'
        }
      }
    },
    env: {
      test: {
        src: "config/test-env.json"
      },
      dev: {
        src: "config/dev-env.json"
      }
    }

  });



  [
    'grunt-contrib-copy',
    'grunt-contrib-watch',
    'grunt-contrib-clean',
    'grunt-sass',
    'grunt-nodemon',
    'grunt-text-replace',
    'grunt-concurrent',
    'grunt-mocha-test',
    'grunt-env'
  ].forEach(function (task) {
    grunt.loadNpmTasks(task);
  });

  grunt.registerTask('generate-assets', [
    'clean',
    'copy',
    'replace',
    'sass'
  ]);

  grunt.registerTask('test', ['env:test','generate-assets', 'mochaTest']);

  var defaultTasks = [
      'generate-assets',
      'concurrent:target'
  ];

  if (process.env.LOCAL_ENV) {
    defaultTasks.unshift('env:dev');
  }

  grunt.registerTask('default',defaultTasks);

  grunt.event.on('watch', function(action, filepath, target) {

    // just copy the asset that was changed, not all of them

    if (target == "assets"){
      grunt.config('copy.assets.files.0.src', filepath.replace("app/assets/",""));
    }

  });

};
