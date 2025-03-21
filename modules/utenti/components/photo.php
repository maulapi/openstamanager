<?php

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

include_once __DIR__.'/../../core.php';
use Models\Upload;

$user_photo = $rootdir.'/files/utenti/'.Upload::find($user->image_file_id)->filename;

if ($user_photo) {
    echo '
        <center><img src="'.$user_photo.'" class="img-responsive" alt="'.$user['username'].'" /></center>';
}

echo '
    <div class="row">
		 <div class="col-md-12">
            {[ "type": "file", "label": "'.tr('Foto utente').'", "name": "photo", "help": "'.tr('Dimensione consigliata 100x100 pixel').'" ]}
        </div>
    </div>';
