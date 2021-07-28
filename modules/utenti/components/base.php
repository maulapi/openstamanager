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

if (!empty(filter('idanagrafica'))) {
    $utente['id_anagrafica'] = filter('idanagrafica');
}

echo '
	<div class="row">
		<div class="col-md-12">
		{[ "type": "text", "label": "'.tr('Username').'", "name": "username", "required": 1, "value": "'.$utente['username'].'", "validation": "username||'.($utente['id'] ?: 0).'" ]}
		</div>
    </div>

    <div class="row">
		<div class="col-md-12">
		{[ "type": "text", "label": "'.tr('Email').'", "name": "email", "required": 0, "value": "'.$utente['email'].'" ]}
		</div>
    </div>

	<div class="row">
		<div class="col-md-12">
		{[ "type": "select", "label": "'.tr('Anagrafica collegata').'", "name": "id_anagrafica", "required": 1, "ajax-source": "anagrafiche_utenti", "value": "'.$utente['id_anagrafica'].'", "icon-after": "add|'.Modules::get('Anagrafiche')['id'].(isset($gruppo) ? '|tipoanagrafica='.$gruppo : '').'" ]}
		</div>
	</div>

	<div class="row">
		<div class="col-md-12">
		    {[ "type": "select", "label": "'.tr('Sedi abilitate').'", "name": "id_sedi_abilitate[]", "ajax-source": "sedi_azienda", "value": "'.implode(',', $id_sedi_abilitate).'", "multiple": 1, "help": "'.tr('Sede Azienda abilitata per la movimentazione degli articoli.').'" ]}
		</div>
	</div>

    <script type="text/javascript">
        $(document).ready(function() {
            $("#id_anagrafica").change(function() {
                $("#id_sede").selectReset();
            })
        });
    </script>';
