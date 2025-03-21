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

if ($record['titolo'] != $prev_titolo && get('lev') == 1) {
    echo '
    <tr>
        <th colspan="5">'.$record['titolo'].'</th>
    </tr>';
}

if (!empty($saldo_iniziale) && $i == 0) {
    echo '
    <tr>
        <td>'.Translator::dateToLocale($data_saldo_iniziale).'</td>
        <td>'.tr('Saldo iniziale').'</td>
        <td></td>
        <td></td>
        <td class="text-right">
            '.moneyFormat($saldo_iniziale, 2).'
        </td>
    </tr>';
}

echo '
    <tr>
        <td>'.Translator::dateToLocale($record['data']).'</td>
        <td>'.$record['descrizione'].'</td>';

if ($record['totale'] >= 0) {
    echo '<td class="text-right">'.moneyFormat(abs($record['totale']), 2).'</td>
            <td></td>';
} else {
    echo ' <td></td>
            <td class="text-right">'.moneyFormat(abs($record['totale']), 2).'</td>';
}

$scalare += $record['totale'];

echo '
        <td class="text-right">
            '.moneyFormat($scalare, 2).'
        </td>';
echo '</tr>';
$prev_titolo = $record['titolo'];
++$i;
