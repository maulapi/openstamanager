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

use Models\View;

echo '

<form action="" method="post" role="form">
    <input type="hidden" name="backto" value="record-edit">
    <input type="hidden" name="op" value="fields">

    <div class="row">
        <div class="col-md-9">
            <div class="data">';

$key = 0;
$fields = View::where('id_module', '=', $record->id)->orderBy('order', 'asc')->get();

foreach ($fields as $key => $field) {
    $editable = !($field->default && $enable_readonly);

    echo '
                <div class="card collapsed-card card-outline card-'.($field->visible ? 'success' : 'danger').'">
                    <div class="card-header with-border">
                        <h3 class="card-title">'.
                            $field->getTranslation('title').' <small class="text-muted tip" title="'.(new Carbon\Carbon($field->updated_at))->format('d/m/Y H:i').'">('.tr('modificato').' '.(new Carbon\Carbon($field->updated_at))->diffForHumans().')</small>
                        </h3>

                        <div class="card-tools pull-right">
                            <button type="button" class="btn btn-tool" data-card-widget="collapse">
                                <i class="fa fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div id="field-'.$field->id.'" class="card-body collapse">
                        <div class="row">
                            <input type="hidden" value="'.$field->id.'" name="id['.$key.']">

                            <div class="col-md-12">
                                {[ "type": "text", "label": "'.tr('Nome').'", "name": "name['.$key.']", "value": "'.$field->getTranslation('title').'", "readonly": "'.(!$editable).'", "help": "'.tr('Nome con cui il campo viene identificato e visualizzato nella tabella').'" ]}
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-12">
                                '.input([
                                'type' => 'textarea',
                                'label' => tr('Query prevista'),
                                'name' => 'query['.$key.']',
                                'required' => 1,
                                'readonly' => ''.(!$editable).'',
                                'value' => $field->query,
                                'help' => tr('Nome effettivo del campo sulla tabella oppure subquery che permette di ottenere il valore del campo.').'<br>'.tr('ATTENZIONE: utilizza sempre i caratteri < o > seguiti da spazio!'),
                            ]).'
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                {[ "type": "select", "label": "'.tr('Gruppi con accesso').'", "name": "gruppi['.$key.'][]", "multiple": "1", "values": "query=SELECT `zz_groups`.`id`, `title` AS descrizione FROM `zz_groups` LEFT JOIN `zz_groups_lang` ON (`zz_groups`.`id` = `zz_groups_lang`.`id_record` AND `zz_groups_lang`.`id_lang` = '.prepare(Models\Locale::getDefault()->id).') ORDER BY `zz_groups`.`id` ASC", "value": "';
    $results = $dbo->fetchArray('SELECT GROUP_CONCAT(DISTINCT `id_gruppo` SEPARATOR \',\') AS gruppi FROM `zz_group_view` WHERE `id_vista`='.prepare($field->id));

    echo $results[0]['gruppi'].'"';

    echo ', "help": "'.tr('Gruppi di utenti in grado di visualizzare questo campo').'" ]}
                            </div>

                            <div class="col-xs-12 col-md-6">
                                {[ "type": "select", "label": "'.tr('Visibilità').'", "name": "visible['.$key.']", "values": "list=\"0\":\"'.tr('Nascosto (variabili di stato)').'\",\"1\": \"'.tr('Visibile nella sezione').'\"", "value": "'.$field->visible.'", "help": "'.tr('Stato del campo: visibile nella tabella oppure nascosto').'" ]}
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-4">
                                {[ "type": "checkbox", "label": "'.tr('Ricercabile').'", "name": "search['.$key.']", "value": "'.$field->search.'", "help": "'.tr('Indica se il campo è ricercabile').'" ]}
                            </div>

                            <div class="col-md-4">
                                {[ "type": "checkbox", "label": "'.tr('Ricerca lenta').'", "name": "slow['.$key.']", "value": "'.$field->slow.'", "help": "'.tr("Indica se la ricerca per questo campo è lenta (da utilizzare nel caso di evidenti rallentamenti, mostra solo un avviso all'utente").'" ]}
                            </div>

                            <div class="col-md-4">
                                {[ "type": "select", "label": "'.tr('Calcolo a fine colonna').'", "name": "sum-avg['.$key.']", "values": "list=\"0\":\"'.tr('Nessuno').'\",\"sum\":\"'.tr('Somma').'\",\"avg\":\"'.tr('Media').'\"", "value": "'.($field->summable ? 'sum' : ($field->avg ? 'avg' : '')).'", "help": "'.tr('Scegli quale tipo di totale valori vuoi calcolare a fine tabella').'" ]}
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-4">
                                {[ "type": "checkbox", "label": "'.tr('Formattazione automatica').'", "name": "format['.$key.']", "value": "'.$field->format.'", "help": "'.tr('Indica se il campo deve essere formattabile in modo automatico, per esempio valori numerici o date.').'" ]}
                            </div>

                            <div class="col-md-4">
                                {[ "type": "checkbox", "label": "'.tr('Utilizza HTML').'", "name": "html_format['.$key.']", "value": "'.$field->html_format.'", "help": "'.tr('Indica se il campo deve mantenere la formattazione HTML. Impostazione utile per i campi di testo con editor.').'" ]}
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                {[ "type": "text", "label": "'.tr('Ricerca tramite').'", "name": "search_inside['.$key.']", "value": "'.$field->search_inside.'", "readonly": "'.(!$editable).'", "help": "'.tr('Query personalizzata per la ricerca (consigliata per colori e icone)').'.<br>'.tr('ATTENZIONE: utilizza sempre i caratteri < o > seguiti da spazio!').'" ]}
                            </div>

                            <div class="col-md-6">
                                {[ "type": "text", "label": "'.tr('Ordina tramite').'", "name": "order_by['.$key.']", "value": "'.$field->order_by.'", "readonly": "'.(!$editable).'", "help": "'.tr("Query personalizzata per l'ordinamento (date e numeri formattati tramite query)").'.<br>'.tr('ATTENZIONE: utilizza sempre i caratteri < o > seguiti da spazio!').'" ]}
                            </div>
                        </div>';

    if ($editable) {
        echo '
                                            <a class="btn btn-danger ask pull-right" data-backto="record-edit" data-id="'.$field->id.'">
                                                <i class="fa fa-trash"></i> '.tr('Elimina').'
                                            </a>';
    }
    echo '
                    </div>
                </div>';
}

echo '
            </div>

            <div class="row">
                <div class="col-md-12 text-right">
                    <button type="button" class="btn btn-info" id="add">
                        <i class="fa fa-plus"></i> '.tr('Aggiungi nuovo campo').'
                    </button>

                    <button type="submit" class="btn btn-success">
                        <i class="fa fa-check"></i> '.tr('Salva').'
                    </button>
                </div>
            </div>

        </div>

        <div class="col-md-3">
            <div class="card card-primary">
                <div class="card-header">
                    <h3 class="card-title">'.tr('Ordine di visualizzazione').' <span class="tip pull-right" title="'.tr('Trascina per ordinare le colonne').'."><i class="fa fa-question-circle-o"></i></span></h3>
                </div>

                <div class="card-body sortable">';

foreach ($fields as $field) {
    echo '
                    <p class="clickable no-selection" data-id="'.$field->id.'">
                        <i class="fa fa-sort"></i>
                        ';

    if ($field->visible) {
        echo '<strong class="text-success">'.$field->getTranslation('title').'</strong>';
    } else {
        echo '<span class="text-danger">'.$field->getTranslation('title').'</span>';
    }

    echo '
                    </p>';
}

echo '
                </div>
            </div>
        </div>
    </div>
</form>';

echo '
<form class="hide" id="template">
    <div class="card">
        <div class="card-header with-border">
            <h3 class="card-title">'.tr('Nuovo campo').'</h3>
        </div>
        <div class="card-body">
            <div class="row">
                <input type="hidden" value="" name="id[-id-]">
                <div class="col-md-12">
                    {[ "type": "text", "label": "'.tr('Nome').'", "name": "name[-id-]" ]}
                </div>
            </div>

            <div class="row">
                <div class="col-md-12">
                    {[ "type": "textarea", "label": "'.tr('Query prevista').'", "name": "query[-id-]" ]}
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    {[ "type": "select", "label": "'.tr('Gruppi con accesso').'", "name": "gruppi[-id-][]", "multiple": "1", "values": "query=SELECT `zz_groups`.`id`, `title` AS descrizione FROM `zz_groups` LEFT JOIN `zz_groups_lang` ON (`zz_groups`.`id` = `zz_groups_lang`.`id_record` AND `zz_groups_lang`.`id_lang` = '.prepare(Models\Locale::getDefault()->id).') ORDER BY `zz_groups`.`id` ASC" ]}
                </div>

                <div class="col-md-6">
                    {[ "type": "select", "label": "'.tr('Visibilità').'", "name": "visible[-id-]", "values": "list=\"0\":\"'.tr('Nascosto (variabili di stato)').'\",\"1\": \"'.tr('Visibile nella sezione').'\"" ]}
                </div>
            </div>

            <div class="row">
                <div class="col-md-3">
                    {[ "type": "checkbox", "label": "'.tr('Ricercabile').'", "name": "search[-id-]" ]}
                </div>

                <div class="col-md-3">
                    {[ "type": "checkbox", "label": "'.tr('Ricerca lenta').'", "name": "slow[-id-]" ]}
                </div>

                <div class="col-md-3">
                    {[ "type": "checkbox", "label": "'.tr('Sommabile').'", "name": "sum[-id-]" ]}
                </div>

                <div class="col-md-3">
                    {[ "type": "checkbox", "label": "'.tr('Media').'", "name": "avg[-id-]" ]}
                </div>
            </div>

            <div class="row">
                <div class="col-md-4">
                    {[ "type": "checkbox", "label": "'.tr('Formattazione automatica').'", "name": "format[-id-]", "help": "'.tr('Indica se il campo deve essere formattabile in modo automatico, per esempio valori numerici o date.').'" ]}
                </div>

                <div class="col-md-4">
                    {[ "type": "checkbox", "label": "'.tr('Utilizza HTML').'", "name": "html_format[-id-]", "help": "'.tr('Indica se il campo deve mantenere la formattazione HTML. Impostazione utile per i campi di testo con editor.').'" ]}
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    {[ "type": "text", "label": "'.tr('Ricerca tramite').'", "name": "search_inside[-id-]" ]}
                </div>

                <div class="col-md-6">
                    {[ "type": "text", "label": "'.tr('Ordina tramite').'", "name": "order_by[-id-]" ]}
                </div>
            </div>

        </div>
    </div>
</form>';

echo '
<script>
    var n = '.$key.';
    $(document).on("click", "#add", function() {
        cleanup_inputs();

        n++;
        var text = replaceAll($("#template").html(), "-id-", "" + n);

        $(this).parent().parent().parent().find(".data").append(text);
        restart_inputs();
    });

    $(document).ready(function() {
        $("#save-buttons").hide();

        sortable(".sortable", {
            axis: "y",
            cursor: "move",
            dropOnEmpty: true,
            scroll: true,
        })[0].addEventListener("sortupdate", function(e) {
            let order = $(".sortable p[data-id]").toArray().map(a => $(a).data("id"))

            $.post(globals.rootdir + "/actions.php", {
                id_module: globals.id_module,
                id_record: globals.id_record,
                op: "update_position",
                order: order.join(","),
            });
        });
    });
</script>';
