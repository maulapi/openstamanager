-- Fix plugin Statistiche vendita
UPDATE `zz_plugins` SET `options` = '{\"main_query\": [{\"type\": \"table\", \"fields\": \"Articolo, Q.tà, Percentuale tot., Totale\", \"query\": \"SELECT (SELECT `id` FROM `zz_modules` WHERE `name` = ''Articoli'') AS _link_module_, mg_articoli.id AS _link_record_, ROUND(SUM(IF(reversed=1, -co_righe_documenti.qta, co_righe_documenti.qta)),2) AS `Q.tà`, ROUND((SUM(IF(reversed=1, -co_righe_documenti.qta, co_righe_documenti.qta)) * 100 / (SELECT SUM(IF(reversed=1, -co_righe_documenti.qta, co_righe_documenti.qta)) FROM co_documenti INNER JOIN co_tipidocumento ON co_documenti.idtipodocumento=co_tipidocumento.id INNER JOIN co_righe_documenti ON co_righe_documenti.iddocumento=co_documenti.id INNER JOIN mg_articoli ON mg_articoli.id=co_righe_documenti.idarticolo WHERE co_tipidocumento.dir=''entrata'' )),2) AS ''Percentuale tot.'', ROUND(SUM(IF(reversed=1, -(co_righe_documenti.subtotale - co_righe_documenti.sconto), (co_righe_documenti.subtotale - co_righe_documenti.sconto))),2) AS Totale, mg_articoli.id, CONCAT(mg_articoli.codice,'' - '',mg_articoli_lang.title) AS Articolo FROM co_documenti INNER JOIN co_statidocumento ON co_statidocumento.id = co_documenti.idstatodocumento INNER JOIN co_tipidocumento ON co_documenti.idtipodocumento=co_tipidocumento.id LEFT JOIN co_statidocumento_lang ON  (co_statidocumento.id = co_statidocumento_lang.id_record AND co_statidocumento_lang.id_lang = 1) INNER JOIN co_righe_documenti ON co_righe_documenti.iddocumento=co_documenti.id INNER JOIN mg_articoli ON mg_articoli.id=co_righe_documenti.idarticolo LEFT JOIN mg_articoli_lang ON (mg_articoli.id = mg_articoli_lang.id_record AND mg_articoli_lang.id_lang = 1) WHERE 1=1 AND co_tipidocumento.dir=''entrata'' AND (co_statidocumento_lang.title = ''Pagato'' OR co_statidocumento_lang.title = ''Parzialmente pagato'' OR co_statidocumento_lang.title = ''Emessa'' ) GROUP BY co_righe_documenti.idarticolo, mg_articoli_lang.title HAVING 2=2 ORDER BY SUM(IF(reversed=1, -co_righe_documenti.qta, co_righe_documenti.qta)) DESC\"}]}' WHERE `zz_plugins`.`name` = 'Statistiche vendita';