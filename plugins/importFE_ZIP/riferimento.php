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

use Modules\DDT\DDT;
use Modules\Ordini\Ordine;

include_once __DIR__.'/../../core.php';
include_once __DIR__.'/init.php';

$direzione = 'entrata';
$id_riga = get('id_riga');
$qta = get('qta');
$descrizione = get('descrizione');
$prezzo_unitario = get('prezzo_unitario');

$id_documento = get('id_documento');
$tipo_documento = get('tipo_documento');
$dir = get('dir');
if ($tipo_documento == 'ordine') {
    $documento = Ordine::find($id_documento);
    $righe_utilizzate = get('righe_ordini');
} else {
    $documento = DDT::find($id_documento);
    $righe_utilizzate = get('righe_ddt');
}

echo '
<div class="row">
    <div class="col-md-8">
        Riga: <strong>'.$descrizione.'</strong>
    </div>
    <div class="col-md-4 text-right">
        Quantità: <strong>'.$qta.'</strong> - Prezzo unitario: <strong>'.number_format($prezzo_unitario, 2, ',', '.').'</strong>
    </div>
</div>
<br>
<table class="table table-striped table-hover table-sm table-bordered">
    <tr>
        <th>'.tr('Descrizione').'</th>
        <th class="text-center" width="120">
            '.tr('Q.tà').' <i title="'.tr('da evadere').' / '.tr('totale').'" class="tip fa fa-question-circle-o"></i>
        </th>
        <th class="text-center" width="120">'.tr('Prezzo unitario').'</th>
        <th class="text-center" width="60">#</th>
    </tr>

    <tbody>';

$id_riferimento = get('id_riferimento');
$righe = $documento->getRighe();
foreach ($righe as $riga) {
    $qta_rimanente = $riga->qta_rimanente - (float) $righe_utilizzate[$riga->id];
    $riga_origine = $riga->getOriginalComponent();

    if (!empty($riga->idarticolo)) {
        $desc_conto = $dbo->fetchOne('SELECT CONCAT( co_pianodeiconti2.numero, ".", co_pianodeiconti3.numero, " ", co_pianodeiconti3.descrizione ) AS descrizione FROM co_pianodeiconti3 INNER JOIN co_pianodeiconti2 ON co_pianodeiconti3.idpianodeiconti2=co_pianodeiconti2.id WHERE co_pianodeiconti3.id = '.prepare($riga->articolo->idconto_acquisto))['descrizione'];
    }

    $dettagli = [
        'tipo' => $riga::class,
        'id' => $riga->id,
        'descrizione' => str_replace(' ', '_', $riga->descrizione),
        'qta' => $riga->qta,
        'um' => $riga->um,
        'prezzo_unitario' => $riga->prezzo_unitario ?: $riga_origine->prezzo_unitario,
        'id_iva' => $riga->id_iva,
        'iva_percentuale' => $riga->aliquota->percentuale,
        'id_articolo' => $riga->idarticolo,
        'desc_articolo' => str_replace(' ', '_', $riga->articolo->codice.' - '.$riga->articolo->getTranslation('title')),
        'id_conto' => $riga->articolo->idconto_acquisto,
        'desc_conto' => $desc_conto ? str_replace(' ', '_', $desc_conto) : null,
    ];

    echo '
        <tr '.($id_riferimento == $riga->id ? 'class="success"' : '').' data-dettagli='.json_encode($dettagli).'>
            <td>'.(!empty($riga->codice) ? $riga->codice.' - ' : '').$riga->descrizione.'</td>
            <td>'.numberFormat($qta_rimanente, 'qta').' / '.numberFormat($riga->qta, 'qta').' '.$riga->um.'</td>
            <td class="text-right">'.moneyFormat($riga->prezzo_unitario_corrente).'</td>
            <td class="text-center">';

    if ($qta_rimanente >= $qta || !empty(setting('Permetti il superamento della soglia quantità dei documenti di origine'))) {
        echo '
                <button type="button" class="btn btn-info btn-xs" onclick="selezionaRiga(this)">
                    <i class="fa fa-check"></i>
                </button>';
    }

    echo '
            </td>
        </tr>';
}

echo '
    </tbody>
</table>

<script>$(document).ready(init)</script>

<script>
var documento_importazione = {
    tipo: "'.$tipo_documento.'",
    id: "'.$id_documento.'",
    descrizione: '.json_encode(reference($documento, tr('Origine'))).',
    opzione: "'.($tipo_documento == 'ordine' ? 'Ordine' : 'DDT').' num. '.($documento->numero_esterno ?: $documento->numero).' del '.Translator::dateToLocale($documento->data).'",
};

function selezionaRiga(button) {
    let riga = $(button).closest("tr");

    let dettagli_riga = riga.data("dettagli");

    if("'.$dir.'"=="entrata"){
        impostaRiferimentoVendita("'.$id_riga.'", documento_importazione, dettagli_riga);
    }else{
        impostaRiferimento("'.$id_riga.'", documento_importazione, dettagli_riga);
    }


    $(button).closest(".modal").modal("hide");
}

// Deselezione del riferimento in caso di selezione riga non effettuata
$("#modals > div").on("hidden.bs.modal", function () {
    if(!$("#id_riferimento_'.$id_riga.'").val()) {
        input("selezione_riferimento['.$id_riga.']").enable()
            .getElement().selectReset();
    }
});
</script>';
