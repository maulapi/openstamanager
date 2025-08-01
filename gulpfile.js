/*
 * OpenSTAManager: il software gestionale open source per l'assistenza tecnica e la fatturazione
 * Copyright (C) DevCode s.r.l.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Librerie NPM richieste per l'esecuzione
import gulp from 'gulp';
const del = require('del');
const gulpIf = require('gulp-if');
const babel = require('gulp-babel');
const merge = require('merge-stream');

// Minificatori
const minifyJS = require('gulp-uglify');
const minifyCSS = require('gulp-clean-css');
import autoprefixer from 'gulp-autoprefixer';

// Interpretatori CSS
const sass = require('gulp-sass')(require('sass'));
const less = require('gulp-less');
const stylus = require('gulp-stylus');

// Concatenatore
const concat = require('gulp-concat');

// Altro
const flatten = require('gulp-flatten');
const rename = require('gulp-rename');
const replace = require('gulp-replace');

// Release
const md5File = require('md5-file')
const archiver = require('archiver');
const shell = require('shelljs');
const { Readable } = require('stream');
import * as fs from 'fs';
import inquirer from 'inquirer';
import { globby as glob } from 'globby';

// Configurazione
const config = {
    production: 'assets/dist', // Cartella di destinazione
    development: 'assets/src', // Cartella dei file di personalizzazione
    debug: false,
    nodeDirectory: './node_modules', // Percorso per node_modules
    paths: {
        js: 'js',
        css: 'css',
        images: 'img',
        fonts: 'fonts'
    },
    babelOptions: {
        compact: true,
        presets: [
            ['@babel/env', {
                modules: false
            }],
        ],
    },
    minifiers: {
        css: {
            rebase: false,
        }
    }
};
config.babelOptions.compact = !config.debug;

function waitPipes(pipes, done) {
    if (!pipes || pipes.length === 0) {
        if (done) done();
        return Promise.resolve();
    }
    
    return Promise.all(
        pipes.map(pipe => new Promise((resolve, reject) => {
            pipe.on('end', resolve);
            pipe.on('error', reject);
            pipe.on('close', resolve); // Add close event handler
        }))
    ).then(() => {
        if (done) done();
    }).catch(err => {
        console.error('Error in pipe:', err);
        if (done) done(err);
    });
}

// Elaborazione e minificazione di JS
const JS = gulp.parallel(function vendorJS() {
    const vendor = [
        'jquery/dist/jquery.js',
        'autosize/dist/autosize.js',
        'autocompleter/autocomplete.js',
        'html5sortable/dist/html5sortable.js',
        'popper.js/dist/umd/popper.js',
        'bootstrap-colorpicker/dist/js/bootstrap-colorpicker.js',
        'moment/moment.js',
        'components-jqueryui/jquery-ui.js',
        'datatables.net/js/jquery.dataTables.js',
        'datatables.net-buttons/js/dataTables.buttons.js',
        'datatables.net-buttons/js/buttons.colVis.js',
        'datatables.net-buttons/js/buttons.flash.js',
        'datatables.net-buttons/js/buttons.html5.js',
        'datatables.net-buttons/js/buttons.print.js',
        'datatables.net-scroller/js/dataTables.scroller.js',
        'datatables.net-select/js/dataTables.select.js',
        'dropzone/dist/dropzone.js',
        'autonumeric/dist/autoNumeric.min.js',
        'eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
        'fullcalendar-scheduler/index.global.js',
        '@fullcalendar/moment/index.global.js',
        '@fullcalendar/core/locales/it.global.js',
        'geocomplete/jquery.geocomplete.js',
        'inputmask/dist/min/jquery.inputmask.bundle.min.js',
        'jquery-form/src/jquery.form.js',
        'jquery-ui-touch-punch/jquery.ui.touch-punch.js',
        'numeral/numeral.js',
        'parsleyjs/dist/parsley.js',
        'select2/dist/js/select2.min.js',
        'signature_pad/dist/signature_pad.js',
        'sweetalert2/dist/sweetalert2.js',
        'toastr/build/toastr.min.js',
        'tooltipster/dist/js/tooltipster.bundle.js',
        'admin-lte/dist/js/adminlte.js',
        'bootstrap/dist/js/bootstrap.min.js',
        'bootstrap-daterangepicker/daterangepicker.js',
        'datatables.net-bs/js/dataTables.bootstrap.js',
        'datatables.net-buttons-bs/js/buttons.bootstrap.js',
        'smartwizard/dist/js/jquery.smartWizard.min.js',
        'bootstrap-maxlength/dist/bootstrap-maxlength.js',
        'leaflet/dist/leaflet.js',
        'leaflet-gesture-handling/dist/leaflet-gesture-handling.min.js',
        'leaflet.fullscreen/Control.FullScreen.js',
        'ismobilejs/dist/isMobile.min.js',
        'ua-parser-js/dist/ua-parser.min.js',
        'readmore.js/readmore.js',
    ];

    for (const i in vendor) {
        vendor[i] = config.nodeDirectory + '/' + vendor[i];
    }

    return gulp.src(vendor, {
        allowEmpty: true
    })
        .pipe(babel(config.babelOptions))
        .pipe(concat('app.min.js'))
        .pipe(gulpIf(!config.debug, minifyJS({ compress: false })))
        .pipe(gulp.dest(config.production + '/' + config.paths.js));
}, srcJS);

// Elaborazione e minificazione di JS personalizzati
export function srcJS(done) {
    const js = gulp.src([
        config.development + '/' + config.paths.js + '/base/*.js',
    ])
        .pipe(babel(config.babelOptions))
        .pipe(concat('custom.min.js'))
        .pipe(gulpIf(!config.debug, minifyJS()))
        .pipe(gulp.dest(config.production + '/' + config.paths.js));

    const functions = gulp.src([
        config.development + '/' + config.paths.js + '/functions/*.js',
    ])
        .pipe(babel(config.babelOptions))
        .pipe(concat('functions.min.js'))
        .pipe(gulpIf(!config.debug, minifyJS()))
        .pipe(gulp.dest(config.production + '/' + config.paths.js));

    return waitPipes([js, functions], done);
}

// Elaborazione e minificazione di CSS
const CSS = gulp.parallel(() => {
    const vendor = [
        'bootstrap-colorpicker/dist/css/bootstrap-colorpicker.css',
        'dropzone/dist/dropzone.css',
        'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css',
        'font-awesome/css/font-awesome.min.css',
        'parsleyjs/src/parsley.css',
        'select2/dist/css/select2.min.css',
        'sweetalert2/dist/sweetalert2.css',
        'toastr/build/toastr.min.css',
        'tooltipster/dist/css/tooltipster.bundle.css',
        'admin-lte/dist/css/AdminLTE.css',
        'bootstrap/dist/css/bootstrap.min.css',
        'bootstrap-daterangepicker/daterangepicker.css',
        'datatables.net-bs/css/dataTables.bootstrap.css',
        'datatables.net-buttons-bs/css/buttons.bootstrap.css',
        'datatables.net-scroller-bs/css/scroller.bootstrap.css',
        'datatables.net-select-bs/css/select.bootstrap.css',
        'smartwizard/dist/css/smart_wizard.min.css',
        'smartwizard/dist/css/smart_wizard_theme_arrows.min.css',
        'leaflet-gesture-handling/dist/leaflet-gesture-handling.min.css',
        'leaflet/dist/leaflet.css',
        'leaflet.fullscreen/Control.FullScreen.css',
        '@ttskch/select2-bootstrap4-theme/dist/select2-bootstrap4.min.css'
    ];

    for (const i in vendor) {
        vendor[i] = config.nodeDirectory + '/' + vendor[i];
    }

    return gulp.src(vendor, {
        allowEmpty: true
    })
        .pipe(gulpIf('*.scss', sass(), gulpIf('*.less', less(), gulpIf('*.styl', stylus()))))
        .pipe(autoprefixer())
        .pipe(minifyCSS({
            rebase: false,
        }))
        .pipe(concat('app.min.css'))
        .pipe(gulp.dest(config.production + '/' + config.paths.css));
}, srcCSS);

// Elaborazione e minificazione di CSS personalizzati
export function srcCSS(done) {
    const css = gulp.src([
        config.development + '/' + config.paths.css + '/*.{css,scss,less,styl}',
    ])
        .pipe(gulpIf('*.scss', sass(), gulpIf('*.less', less(), gulpIf('*.styl', stylus()))))
        .pipe(autoprefixer())
        .pipe(gulpIf(!config.debug, minifyCSS(config.minifiers.css)))
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest(config.production + '/' + config.paths.css));

    const print = gulp.src([
        config.development + '/' + config.paths.css + '/print/*.{css,scss,less,styl}',
    ], {
        allowEmpty: true
    })
        .pipe(gulpIf('*.scss', sass(), gulpIf('*.less', less(), gulpIf('*.styl', stylus()))))
        .pipe(autoprefixer())
        .pipe(gulpIf(!config.debug, minifyCSS(config.minifiers.css)))
        .pipe(concat('print.min.css'))
        .pipe(gulp.dest(config.production + '/' + config.paths.css));

    const themes = gulp.src([
        config.development + '/' + config.paths.css + '/themes/*.{css,scss,less,styl}',
        config.nodeDirectory + '/admin-lte/dist/css/adminlte.min.css',
    ])
        .pipe(gulpIf('*.scss', sass(), gulpIf('*.less', less(), gulpIf('*.styl', stylus()))))
        .pipe(autoprefixer())
        .pipe(gulpIf(!config.debug, minifyCSS(config.minifiers.css)))
        .pipe(concat('themes.min.css'))
        .pipe(flatten())
        .pipe(gulp.dest(config.production + '/' + config.paths.css));

    return waitPipes([css, print, themes], done);
}


// Elaborazione delle immagini
const images = srcImages;

// Elaborazione delle immagini personalizzate
function srcImages() {
    return gulp.src([
        config.development + '/' + config.paths.images + '/**/*.{jpg,png,jpeg,gif}',
    ], {encoding: false})
        .pipe(gulp.dest(config.production + '/' + config.paths.images));
}

function leaflet() {
    const leaflet = gulp.src([
        config.nodeDirectory + '/leaflet.fullscreen/icon-fullscreen.svg',
        config.development + '/' + config.paths.images + '/leaflet/*',
    ], {encoding: false})
        .pipe(gulp.dest(config.production + '/' + config.paths.images + '/leaflet'));

    const images = gulp.src([
        config.nodeDirectory + '/leaflet/dist/images/*.{jpg,png,jpeg}',
    ], {encoding: false})
        .pipe(flatten())
        .pipe(gulp.dest(config.production + '/' + config.paths.images + '/leaflet'));

    return merge(images, leaflet);
}

function wacom() {
    // Librerie da node_modules secondo package.json
    const vendor = [
        'clipper-lib/clipper.js',
        'js-md5/build/md5.min.js',
        'poly2tri/dist/poly2tri.js',
        'protobufjs/dist/protobuf.min.js',
        'jszip/dist/jszip.min.js',
        'gl-matrix/gl-matrix-min.js',
        'rbush/rbush.min.js',
        'sjcl/sjcl.js'
    ];

    // Modifica i percorsi per puntare a node_modules
    for (const i in vendor) {
        vendor[i] = config.nodeDirectory + '/' + vendor[i];
    }

    // File specifici di Wacom che devono rimanere in assets/src
    const wacomSpecific = [
        config.development + '/' + config.paths.js + '/wacom/modules/js-ext/js-ext-min.js',
        config.development + '/' + config.paths.js + '/wacom/modules/digital-ink/digital-ink-min.js',
        config.development + '/' + config.paths.js + '/wacom/common/will/tools.js',
        config.development + '/' + config.paths.js + '/wacom/common/libs/signature_sdk.js',
        config.development + '/' + config.paths.js + '/wacom/common/libs/signature_sdk_helper.js',
        config.development + '/' + config.paths.js + '/wacom/common/libs/stu-sdk.min.js',
        config.development + '/' + config.paths.js + '/wacom/sigCaptDialog/sigCaptDialog.js',
        config.development + '/' + config.paths.js + '/wacom/sigCaptDialog/stuCaptDialog.js'
    ];

    // Combina i file vendor con quelli specifici di Wacom
    const allFiles = [...vendor, ...wacomSpecific];

    // Prima copiamo il file WASM necessario
    const wasmStream = gulp.src([
        config.development + '/' + config.paths.js + '/wacom/common/libs/signature_sdk.wasm'
    ], {encoding: false})
        .pipe(gulp.dest(config.production + '/' + config.paths.js + '/wacom/'));

    // Poi processiamo i file JS che lo utilizzano
    const jsStream = gulp.src(allFiles, {
        allowEmpty: true
    })
        .pipe(babel(config.babelOptions))
        .pipe(concat('wacom.min.js'))
        .pipe(gulpIf(!config.debug, minifyJS()))
        .pipe(gulp.dest(config.production + '/' + config.paths.js));
    
    return merge(jsStream, wasmStream);
}

// Elaborazione dei fonts
const fonts = gulp.parallel(() => {
    const vendor = [
        'font-awesome/fonts/fontawesome-webfont.eot',
        'font-awesome/fonts/fontawesome-webfont.svg',
        'font-awesome/fonts/fontawesome-webfont.ttf',
        'font-awesome/fonts/fontawesome-webfont.woff',
        'font-awesome/fonts/fontawesome-webfont.woff2',
        'font-awesome/fonts/FontAwesome.otf',
        '../assets/src/css/fonts/sourcesanspro-regular-webfont.eot',
        '../assets/src/css/fonts/sourcesanspro-regular-webfont.svg',
        '../assets/src/css/fonts/sourcesanspro-regular-webfont.ttf',
        '../assets/src/css/fonts/sourcesanspro-regular-webfont.woff',
        '../assets/src/css/fonts/sourcesanspro-regular-webfont.woff2',
    ];

    for (const i in vendor) {
        vendor[i] = config.nodeDirectory + '/' + vendor[i];
    }

    return gulp.src(vendor, {encoding: false})
        .pipe(flatten())
        .pipe(gulp.dest(config.production + '/' + config.paths.fonts));
}, srcFonts);

// Elaborazione dei fonts personalizzati
function srcFonts() {
    return gulp.src([
        config.development + '/' + config.paths.fonts + '/**/*.{otf,eot,svg,ttf,woff,woff2}',
    ], {encoding: false})
        .pipe(flatten())
        .pipe(gulp.dest(config.production + '/' + config.paths.fonts));
}

function ckeditor() {

    const ckeditorCore =  gulp.src([
        config.nodeDirectory + '/ckeditor4/{adapters,lang,skins,plugins,core}/**/*.{js,json,css,png,gif,html}',
        config.nodeDirectory + '/ckeditor4/*.{js,css}',
    ])
        .pipe(gulp.dest(config.production + '/' + config.paths.js + '/ckeditor'));

    const nodePlugins = gulp.src([
        config.nodeDirectory + '/ckeditor/plugins/{emoji,autocomplete,textmatch,textwatcher}/**/*.{js,json,css,png,gif,html}',
    ])
        .pipe(gulp.dest(config.production + '/' + config.paths.js + '/ckeditor/plugins'));

    // Plugin personalizzati
    const customPlugins = gulp.src([
        config.development + '/' + config.paths.js + '/ckeditor/plugins/**/*' // Sorgente: assets/src/js/ckeditor/plugins/
    ], { allowEmpty: true })
        .pipe(gulp.dest(config.production + '/' + config.paths.js + '/ckeditor/plugins')); // Destinazione: assets/dist/js/ckeditor/plugins/

    return merge(ckeditorCore, nodePlugins, customPlugins); // Unione dei flussi
}

function colorpicker() {
    return gulp.src([
        config.nodeDirectory + '/bootstrap-colorpicker/dist/**/*.{jpg,png,jpeg}',
    ], {encoding: false})
        .pipe(flatten())
        .pipe(gulp.dest(config.production + '/' + config.paths.images + '/bootstrap-colorpicker'));
}

function password_strength() {
    return gulp.src([
        config.nodeDirectory + '/pwstrength-bootstrap/dist/*.js',
    ])
        .pipe(concat('password.min.js'))
        .pipe(gulpIf(!config.debug, minifyJS()))
        .pipe(gulp.dest(config.production + '/password-strength'));
}

function hotkeys() {
    return gulp.src([
        config.nodeDirectory + '/hotkeys-js/dist/hotkeys.min.js',
    ])
        .pipe(flatten())
        .pipe(gulp.dest(config.production + '/' + config.paths.js + '/hotkeys-js'));
}

function chartjs() {
    return gulp.src([
        config.nodeDirectory + '/chart.js/dist/chart.min.js',
    ])
        .pipe(flatten())
        .pipe(gulp.dest(config.production + '/' + config.paths.js + '/chartjs'));
}

function csrf() {
    return gulp.src([
        './vendor/owasp/csrf-protector-php/js/csrfprotector.js',
    ])
        .pipe(flatten())
        .pipe(gulp.dest(config.production + '/' + config.paths.js + '/csrf'));
}

function pdfjs() {
    // Copia i file .mjs della web, li rinomina in .js e sostituisce i riferimenti interni
    const webMjs = gulp.src([
        config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/web/*.mjs',
    ])
        .pipe(replace(/pdf\.worker\.mjs/g, 'pdf.worker.js'))
        .pipe(rename(function (path) {
            path.extname = '.js';
        }))
        .pipe(gulp.dest(config.production + '/pdfjs/web'));

    // Copia i file .mjs della build, li rinomina in .js e sostituisce i riferimenti interni
    const buildMjs = gulp.src([
        config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/build/*.mjs',
    ])
        .pipe(replace(/pdf\.worker\.mjs/g, 'pdf.worker.js'))
        .pipe(rename(function (path) {
            path.extname = '.js';
        }))
        .pipe(gulp.dest(config.production + '/pdfjs/build'));

    // Modifica il file viewer.html per referenziare viewer.js e pdf.js invece di viewer.mjs e pdf.mjs
    const viewerHtml = gulp.src([
        config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/web/viewer.html',
    ])
        .pipe(replace('viewer.mjs', 'viewer.js'))
        .pipe(replace('pdf.mjs', 'pdf.js'))
        .pipe(gulp.dest(config.production + '/pdfjs/web'));

    // Copia tutti gli altri file (esclusi .mjs e viewer.html già gestiti sopra)
    const webOther = gulp.src([
        config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/web/**/*',
        '!' + config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/web/*.mjs',
        '!' + config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/web/viewer.html',
        '!' + config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/web/cmaps/*',
        '!' + config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/web/*.map',
        '!' + config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/web/*.pdf',
    ], {encoding: false})
        .pipe(gulp.dest(config.production + '/pdfjs/web'));

    const buildOther = gulp.src([
        config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/build/*',
        '!' + config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/build/*.mjs',
        '!' + config.nodeDirectory + '/pdfjs-viewer-element/dist/pdfjs-4.0.379-dist/build/*.map',
    ], {encoding: false})
        .pipe(gulp.dest(config.production + '/pdfjs/build'));

    return merge(webMjs, buildMjs, viewerHtml, webOther, buildOther);
}

function uaparser() {
    return gulp.src([
        config.nodeDirectory + '/ua-parser-js/dist/icons/mono/**/*',
        '!' + config.nodeDirectory + '/ua-parser-js/dist/icons/mono/LICENSE.md',
    ], {encoding: false})
        .pipe(gulp.dest(config.production + '/' + config.paths.images + '/icons/'));
}

// Elaborazione e minificazione delle informazioni sull'internazionalizzazione
function i18n() {
    return gulp.src([
        config.nodeDirectory + '/**/{i18n,lang,locale,locales}/*.{js,json}',
        config.nodeDirectory + '/moment/min/locales.js',
        '!' + config.nodeDirectory + '/**/{src,plugins}/**',
        '!' + config.nodeDirectory + '/ckeditor4-full/**',
        '!' + config.nodeDirectory + '/jquery-ui/**',
    ])
        .pipe(gulpIf('!*.min.*', rename({
            suffix: '.min'
        })))
        .pipe(flatten({
            includeParents: 1
        }))
        .pipe(gulp.dest(config.production + '/' + config.paths.js + '/i18n'));
}


// Operazioni per la release
export function release(done) {
    // Impostazione dello zip
    let output = fs.createWriteStream('./release.zip', { flags: 'w' });
    let archive = archiver('zip');

    output.on('close', function () {
        console.log('ZIP completato!');
    });

    archive.on('error', function (err) {
        throw err;
    });

    archive.pipe(output);

    // Individuazione dei file da aggiungere e escludere
    glob([
        '**/*',
        '!checksum.json',
        '!mysql.json',
        '!mysql_8_3.json',
        '!mariadb_10_x.json',
        '!settings.json',
        '!manifest.json',
        '!.idea/**',
        '!.git/**',
        '!.github/**',
        '!.vscode/**',
        '!node_modules/**',
        '!include/custom/**',
        '!backup/**',
        '!files/**',
        'files/temp/.gitkeep',
        '!logs/**',
        '!config.inc.php',
        '!psalm.xml',
        '!update/structure.php',
        '!update/settings.php',
        '!**/*.(lock|phar|log|zip|bak|jar|txt)',
        '!**/~*',
        '!vendor/tecnickcom/tcpdf/examples/**',
        '!vendor/tecnickcom/tcpdf/fonts/*',
        'vendor/tecnickcom/tcpdf/fonts/*helvetica*',
        '!vendor/mpdf/mpdf/tmp/*',
        '!vendor/mpdf/mpdf/ttfonts/*',
        'vendor/mpdf/mpdf/ttfonts/DejaVuinfo.txt',
        'vendor/mpdf/mpdf/ttfonts/DejaVu*Condensed*',
        'vendor/mpdf/mpdf/ttfonts/ocrbinfo.txt',
        'vendor/mpdf/mpdf/ttfonts/ocrb10.ttf',
        '!vendor/respect/validation/tests/**',
        '!vendor/willdurand/geocoder/tests/**',
        '!docker/**',
    ], {
        dot: true,
    }).then(function (files) {
        // Aggiunta dei file con i relativi checksum
        let checksum = {};
        for (const file of files) {
            if (fs.lstatSync(file).isDirectory()) {
                archive.directory(file, file);
            } else {
                archive.file(file);

                if (!file.startsWith('vendor')) {
                    checksum[file] = md5File.sync(file);
                }
            }
        }

        // Eccezioni
        archive.file('backup/.htaccess', {});
        archive.file('files/.htaccess', {});
        archive.file('files/my_impianti/componente.ini', {});
        archive.file('logs/.htaccess', {});

        // Aggiunta del file dei checksum
        let checksumFile = fs.createWriteStream('./checksum.json', { flags: 'w' });
        checksumFile.write(JSON.stringify(checksum));
        checksumFile.close();
        archive.file('checksum.json', {});

        // Aggiunta del file per il controllo di integrità del database
        var bufferStream = new Readable();

        bufferStream.push(shell.exec('php update/structure.php', {
            silent: true
        }).stdout);
        bufferStream.push(null);
        archive.append(bufferStream, { name: 'mysql.json' });

        // Aggiunta del file per il controllo delle impostazioni
        bufferStream = new Readable();
        bufferStream.push(shell.exec('php update/settings.php', {
            silent: true
        }).stdout);
        bufferStream.push(null);
        archive.append(bufferStream, { name: 'settings.json' });

        // Aggiunta del commit corrente nel file REVISION
        bufferStream = new Readable();
        bufferStream.push(shell.exec('git rev-parse --short HEAD', {
            silent: true
        }).stdout);
        bufferStream.push(null);
        archive.append(bufferStream, { name: 'REVISION' });

        // Opzioni sulla release
        inquirer.prompt([{
            type: 'input',
            name: 'version',
            message: 'Numero di versione:',
            validate: (input) => input ? true : 'Il numero di versione non può essere vuoto.'
        }, {
            type: 'confirm',
            name: 'beta',
            message: 'Versione beta?',
            default: false,
        }]).then(function (result) {

            let version = result.version;

            // Aggiungi 'beta' solo se l'opzione beta è selezionata
            if (result.beta) {
                version += 'beta';
            }

            // Creazione di un stream leggibile con la versione
            const bufferStream = new Readable({
                read() {
                    this.push(version);
                    this.push(null);
                }
            });

            // Aggiunta della versione corrente nel file VERSION
            archive.append(bufferStream, { name: 'VERSION' });

            // Completamento dello ZIP
            archive.finalize();

            done();
        }).catch(err => {
            console.error('Si è verificato un errore:', err);
        });
    });
}

// Pulizia
export function clean() {
    return del([config.production]);
};

// Operazioni di default per la generazione degli assets
export const bower = gulp.series(
    clean, 
    gulp.parallel(
        JS, 
        CSS, 
        images, 
        fonts, 
        ckeditor, 
        colorpicker, 
        i18n, 
        pdfjs, 
        hotkeys, 
        chartjs, 
        password_strength, 
        csrf, 
        leaflet, 
        wacom, 
        uaparser
    )
);

// Assicurati che il task default sia esportato correttamente
export default bower;

// Watch task - lanciato con `gulp watch`, resta in attesa e ogni volta che viene modificato un asset in src
// viene aggiornata la dist
export function watch() {
    gulp.watch('assets/src/css/*.css', gulp.series(srcCSS, CSS));
    gulp.watch('assets/src/css/print/*.css', gulp.series(srcCSS, CSS));
    gulp.watch('assets/src/css/themes/*.css', gulp.series(srcCSS, CSS));
    gulp.watch('assets/src/js/base/*.js', gulp.series(srcJS, JS));
    gulp.watch('assets/src/js/functions/*.js', gulp.series(srcJS, JS));
    gulp.watch('assets/src/img/*', gulp.series(images));
}

// Replace the old watch task definition
gulp.task('watch', watch);
