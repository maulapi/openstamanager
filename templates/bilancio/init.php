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

use Carbon\Carbon;

$azienda = $dbo->fetchOne('SELECT ragione_sociale FROM an_anagrafiche WHERE idanagrafica='.setting('Azienda predefinita'));
$date_start = $_SESSION['period_start'];
$date_end = $_SESSION['period_end'];
$esercizio = new Carbon($date_start);
$esercizio = $esercizio->format('Y');

$liv2_patrimoniale = $dbo->fetchArray('SELECT co_pianodeiconti2.numero AS numero, co_pianodeiconti2.descrizione AS descrizione, SUM(totale) AS totale, co_pianodeiconti2.id AS id FROM `co_movimenti` INNER JOIN co_pianodeiconti3 ON co_movimenti.idconto=co_pianodeiconti3.id INNER JOIN co_pianodeiconti2 ON co_pianodeiconti3.idpianodeiconti2=co_pianodeiconti2.id WHERE idconto IN(SELECT id FROM co_pianodeiconti3 WHERE idpianodeiconti2 IN(SELECT id FROM co_pianodeiconti2 WHERE idpianodeiconti1=(SELECT id FROM co_pianodeiconti1 WHERE descrizione="Patrimoniale"))) AND co_movimenti.data>='.prepare($date_start).' AND co_movimenti.data<='.prepare($date_end).' GROUP BY idpianodeiconti2 ORDER BY co_pianodeiconti2.numero');

$liv2_economico = $dbo->fetchArray('SELECT co_pianodeiconti2.numero AS numero, co_pianodeiconti2.descrizione AS descrizione, SUM(
    CASE
        WHEN co_movimenti.data BETWEEN '.prepare($date_start).' AND '.prepare($date_end).' THEN
            totale
        ELSE
            0
    END
) AS totale, SUM(
    CASE
        WHEN data_inizio_competenza IS NULL OR data_fine_competenza IS NULL THEN
            totale_reddito
        ELSE
            totale_reddito * (
                DATEDIFF(
                    LEAST(data_fine_competenza, '.prepare($date_end).'),
                    GREATEST(data_inizio_competenza, '.prepare($date_start).')
                ) + 1
            ) / (
                DATEDIFF(data_fine_competenza, data_inizio_competenza) + 1
            )
    END
) AS totale_reddito, co_pianodeiconti2.id AS id FROM `co_movimenti` INNER JOIN co_pianodeiconti3 ON co_movimenti.idconto=co_pianodeiconti3.id INNER JOIN co_pianodeiconti2 ON co_pianodeiconti3.idpianodeiconti2=co_pianodeiconti2.id WHERE idconto IN(SELECT id FROM co_pianodeiconti3 WHERE idpianodeiconti2 IN(SELECT id FROM co_pianodeiconti2 WHERE idpianodeiconti1=(SELECT id FROM co_pianodeiconti1 WHERE descrizione="Economico"))) AND (
    (co_movimenti.data BETWEEN '.prepare($date_start).' AND '.prepare($date_end).') 
    OR 
    (data_inizio_competenza IS NOT NULL AND data_fine_competenza IS NOT NULL AND 
     data_fine_competenza >= '.prepare($date_start).' AND 
     data_inizio_competenza <= '.prepare($date_end).')
    OR
    (data_inizio_competenza IS NOT NULL AND data_fine_competenza IS NOT NULL AND
     data_inizio_competenza < '.prepare($date_start).' AND
     data_fine_competenza > '.prepare($date_end).')
    OR
    (data_inizio_competenza IS NOT NULL AND data_fine_competenza IS NOT NULL AND
     data_inizio_competenza <= '.prepare($date_end).' AND
     data_inizio_competenza >= '.prepare($date_start).')
    OR
    (data_inizio_competenza IS NOT NULL AND data_fine_competenza IS NOT NULL AND
     data_fine_competenza >= '.prepare($date_start).' AND
     data_fine_competenza <= '.prepare($date_end).')
) GROUP BY idpianodeiconti2 ORDER BY co_pianodeiconti2.numero');

$liv3_patrimoniale = $dbo->fetchArray('SELECT co_pianodeiconti3.numero AS numero, co_pianodeiconti3.descrizione AS descrizione, SUM(totale) AS totale, co_pianodeiconti3.idpianodeiconti2 AS idpianodeiconti2 FROM `co_movimenti` INNER JOIN co_pianodeiconti3 ON co_movimenti.idconto=co_pianodeiconti3.id INNER JOIN co_pianodeiconti2 ON co_pianodeiconti3.idpianodeiconti2=co_pianodeiconti2.id WHERE idconto IN(SELECT id FROM co_pianodeiconti3 WHERE idpianodeiconti2 IN(SELECT id FROM co_pianodeiconti2 WHERE idpianodeiconti1=(SELECT id FROM co_pianodeiconti1 WHERE descrizione="Patrimoniale"))) '.(empty(get('elenco_analitico')) ? 'AND co_pianodeiconti3.id NOT IN (SELECT idconto_cliente FROM an_anagrafiche) AND co_pianodeiconti3.id NOT IN (SELECT idconto_fornitore FROM an_anagrafiche)' : '').' AND co_movimenti.data>='.prepare($date_start).' AND co_movimenti.data<='.prepare($date_end).' GROUP BY idconto ORDER BY co_pianodeiconti3.numero');

$liv3_economico = $dbo->fetchArray('SELECT co_pianodeiconti3.numero AS numero, co_pianodeiconti3.descrizione AS descrizione, SUM(
    CASE
        WHEN co_movimenti.data BETWEEN '.prepare($date_start).' AND '.prepare($date_end).' THEN
            totale
        ELSE
            0
    END
) AS totale, SUM(
    CASE
        WHEN data_inizio_competenza IS NULL OR data_fine_competenza IS NULL THEN
            totale_reddito
        ELSE
            totale_reddito * (
                DATEDIFF(
                    LEAST(data_fine_competenza, '.prepare($date_end).'),
                    GREATEST(data_inizio_competenza, '.prepare($date_start).')
                ) + 1
            ) / (
                DATEDIFF(data_fine_competenza, data_inizio_competenza) + 1
            )
    END
) AS totale_reddito, co_pianodeiconti3.idpianodeiconti2 AS idpianodeiconti2 FROM `co_movimenti` INNER JOIN co_pianodeiconti3 ON co_movimenti.idconto=co_pianodeiconti3.id INNER JOIN co_pianodeiconti2 ON co_pianodeiconti3.idpianodeiconti2=co_pianodeiconti2.id WHERE idconto IN(SELECT id FROM co_pianodeiconti3 WHERE idpianodeiconti2 IN(SELECT id FROM co_pianodeiconti2 WHERE idpianodeiconti1=(SELECT id FROM co_pianodeiconti1 WHERE descrizione="Economico"))) AND (
    (co_movimenti.data BETWEEN '.prepare($date_start).' AND '.prepare($date_end).') 
    OR 
    (data_inizio_competenza IS NOT NULL AND data_fine_competenza IS NOT NULL AND 
     data_fine_competenza >= '.prepare($date_start).' AND 
     data_inizio_competenza <= '.prepare($date_end).')
    OR
    (data_inizio_competenza IS NOT NULL AND data_fine_competenza IS NOT NULL AND
     data_inizio_competenza < '.prepare($date_start).' AND
     data_fine_competenza > '.prepare($date_end).')
    OR
    (data_inizio_competenza IS NOT NULL AND data_fine_competenza IS NOT NULL AND
     data_inizio_competenza <= '.prepare($date_end).' AND
     data_inizio_competenza >= '.prepare($date_start).')
    OR
    (data_inizio_competenza IS NOT NULL AND data_fine_competenza IS NOT NULL AND
     data_fine_competenza >= '.prepare($date_start).' AND
     data_fine_competenza <= '.prepare($date_end).')
) GROUP BY idconto ORDER BY co_pianodeiconti3.numero');

$utile_perdita = $dbo->fetchOne('SELECT SUM(totale) AS totale FROM `co_movimenti` WHERE idconto IN(SELECT id FROM co_pianodeiconti3 WHERE idpianodeiconti2 IN(SELECT id FROM co_pianodeiconti2 WHERE idpianodeiconti1=(SELECT id FROM co_pianodeiconti1 WHERE descrizione="Economico")))AND co_movimenti.data>='.prepare($date_start).' AND co_movimenti.data<='.prepare($date_end))['totale'];

$debiti_fornitori_attivita = $dbo->fetchArray('
SELECT 
    co_pianodeiconti3.numero AS numero,
    co_pianodeiconti3.descrizione AS descrizione,
    SUM(totale) AS totale,
    co_pianodeiconti3.idpianodeiconti2 AS idpianodeiconti2
FROM
    `co_movimenti` 
    INNER JOIN co_pianodeiconti3 ON co_movimenti.idconto=co_pianodeiconti3.id
    INNER JOIN co_pianodeiconti2 ON co_pianodeiconti3.idpianodeiconti2=co_pianodeiconti2.id 
WHERE 
    co_pianodeiconti2.id='.prepare(setting('Conto di secondo livello per i debiti fornitori')).'
    AND co_pianodeiconti3.id IN (SELECT idconto_fornitore FROM an_anagrafiche) 
    AND co_movimenti.data>='.prepare($date_start).' 
    AND co_movimenti.data<='.prepare($date_end).' 
    AND co_movimenti.totale > 0
GROUP BY 
    idconto
ORDER BY 
    co_pianodeiconti2.numero');

$debiti_fornitori_attivita = sum(array_column($debiti_fornitori_attivita, 'totale'));

$crediti_clienti_attivita = $dbo->fetchArray('
SELECT 
    co_pianodeiconti3.numero AS numero,
    co_pianodeiconti3.descrizione AS descrizione,
    SUM(totale) AS totale,
    co_pianodeiconti3.idpianodeiconti2 AS idpianodeiconti2
FROM
    `co_movimenti` 
    INNER JOIN co_pianodeiconti3 ON co_movimenti.idconto=co_pianodeiconti3.id
    INNER JOIN co_pianodeiconti2 ON co_pianodeiconti3.idpianodeiconti2=co_pianodeiconti2.id 
WHERE 
    co_pianodeiconti2.id='.prepare(setting('Conto di secondo livello per i crediti clienti')).'
    AND co_pianodeiconti3.id IN (SELECT idconto_cliente FROM an_anagrafiche) 
    AND co_movimenti.data>='.prepare($date_start).' 
    AND co_movimenti.data<='.prepare($date_end).' 
    AND co_movimenti.totale > 0
GROUP BY 
    idconto
ORDER BY 
    co_pianodeiconti2.numero');

$crediti_clienti_attivita = sum(array_column($crediti_clienti_attivita, 'totale'));

$debiti_fornitori_passivita = $dbo->fetchArray('
SELECT 
    co_pianodeiconti3.numero AS numero,
    co_pianodeiconti3.descrizione AS descrizione,
    SUM(totale) AS totale,
    co_pianodeiconti3.idpianodeiconti2 AS idpianodeiconti2
FROM
    `co_movimenti` 
    INNER JOIN co_pianodeiconti3 ON co_movimenti.idconto=co_pianodeiconti3.id
    INNER JOIN co_pianodeiconti2 ON co_pianodeiconti3.idpianodeiconti2=co_pianodeiconti2.id 
WHERE 
    co_pianodeiconti2.id='.prepare(setting('Conto di secondo livello per i debiti fornitori')).'
    AND co_pianodeiconti3.id IN (SELECT idconto_fornitore FROM an_anagrafiche) 
    AND co_movimenti.data>='.prepare($date_start).' 
    AND co_movimenti.data<='.prepare($date_end).' 
    AND co_movimenti.totale < 0
GROUP BY 
    idconto
ORDER BY 
    co_pianodeiconti2.numero');

$debiti_fornitori_passivita = sum(array_column($debiti_fornitori_passivita, 'totale'));

$crediti_clienti_passivita = $dbo->fetchArray('
SELECT 
    co_pianodeiconti3.numero AS numero,
    co_pianodeiconti3.descrizione AS descrizione,
    SUM(totale) AS totale,
    co_pianodeiconti3.idpianodeiconti2 AS idpianodeiconti2
FROM
    `co_movimenti` 
    INNER JOIN co_pianodeiconti3 ON co_movimenti.idconto=co_pianodeiconti3.id
    INNER JOIN co_pianodeiconti2 ON co_pianodeiconti3.idpianodeiconti2=co_pianodeiconti2.id 
WHERE 
    co_pianodeiconti2.id='.prepare(setting('Conto di secondo livello per i crediti clienti')).'
    AND co_pianodeiconti3.id IN (SELECT idconto_cliente FROM an_anagrafiche) 
    AND co_movimenti.data>='.prepare($date_start).' 
    AND co_movimenti.data<='.prepare($date_end).' 
    AND co_movimenti.totale < 0
GROUP BY 
    idconto
ORDER BY 
    co_pianodeiconti2.numero');

$crediti_clienti_passivita = sum(array_column($crediti_clienti_passivita, 'totale'));

$crediti_clienti = $crediti_clienti_attivita + $crediti_clienti_passivita;
$debiti_fornitori = $debiti_fornitori_attivita + $debiti_fornitori_passivita;
