<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

define('INCLUDE_PATH','includes/');
define('INCLUDE_CLASS_PATH',INCLUDE_PATH.'classes/');

// enthaelt die Definition der IPTC- und Exif-Felder
require_once(INCLUDE_PATH."iptc.php");

require_once(INCLUDE_PATH."func.php");

// enthaelt die Funktion writeHeaderData(), die zum Schreiben der Metadaten aufgerufen wird
require_once(INCLUDE_CLASS_PATH."classBild.php");

/* Bild, in das die Informationen geschrieben werden sollen */
$image_path = $_SERVER['DOCUMENT_ROOT'].'/user/test/write_metadata/';
$image_name = 'elb_00069015.jpg';

/* Beispiel-Daten *****************************************/
$ueberschrift = 'Autobahn- Raststätte und Parkplatz der BAB A3 in Hünxe im Bundesland Nordrhein-Westfalen, Deutschland';
$geo_breite = 51.634952;
$geo_laenge = 6.746442;
$credit = 'euroluftbild.de/Hans Blossey ';
$aufnahme_jahr = 2019;
$aufnahme_monat = '08';
$aufnahme_tag = '30';
$ort = 'Hünxe';
$ortsteil = '';
$plz = '46569';
$landkreis = 'Wesel';
$bundesland = 'Nordrhein-Westfalen';
$land = 'Deutschland';
$iso = 'DEU';
$beschreibung = 'HüNXE 30.08.2019 Streckenführung und Fahrspuren im Verlauf der Autobahn- Raststätte und Parkplatz der BAB A3 in Hünxe im Bundesland Nordrhein-Westfalen, Deutschland. Weiterführende Informationen bei: Landesbetrieb Straüenbau Nordrhein-Westfalen. // Routing and traffic lanes during the motorway service station and parking lot of the BAB A 3 in Huenxe in the state North Rhine-Westphalia, Germany. Further information at: Landesbetrieb Strassenbau Nordrhein-Westfalen. www.strassen.nrw.de Foto: Hans Blossey';
$stichwoerter = 'Luftaufnahme,Luftbild,Luftbildfotografie,Luftfotografie,Luftfoto,Aerofoto,Flugaufnahme,Flugbild,Europa,Deutschland,Nordrhein-Westfalen,Hünxe,Infrastruktur,Verkehr,Straße,Autobahn,Straüenverkehr,Abfahrt,Zufahrt,Auffahrt,Kreuzung,Schleife,Führung,Verlauf,Strecke,Rastplatz,Raststätte,Parkplatz,Service,Ruhezeit,Pause,// aerial photo,aerial photography,aerial picture,aerial view,air photo,Europe,Germany,North Rhine-Westphalia,Huenxe,Infrastructure,transport,road,highway,exit,entrance,driveway,intersection,loop,management,course,track,rest area,service area,parking,service,rest,pause';
$einschraenkung = 'Vertrieb weltweit nur auf Vertrags- bzw. Komissionsbasis mit Endkunden-Mindesthonorar von 60,00.- EUR. Übernahme in aktuelle Bilddienste nur nach Rücksprache mit euroluftbild.de. Belegexemplare an info@euroluftbild.de';
$fotograf_cardinfo = '';
$ort_getauscht = 0;
/****************************************************************/


// Set the exif fields
// die Konstanten EXIF_IMAGE_DESCRIPTION,... sind in der Datei includes/iptc.php definiert
$exif_fields = array(
		EXIF_IMAGE_DESCRIPTION => convertSring($ueberschrift),
	    	EXIF_GPS_LATITUDE_REF => ($geo_breite < 0) ? 'S' : 'N',
		EXIF_GPS_LATITUDE => convertDecimalToDMS($geo_breite), 
	    	EXIF_GPS_LONGITUDE_REF => ($geo_laenge < 0) ? 'W' : 'E',
		EXIF_GPS_LONGITUDE => convertDecimalToDMS($geo_laenge), 
	   	EXIF_COPYRIGHT => convertSring($credit),
	    	EXIF_ARTIST => convertSring($credit),
	    	EXIF_GPS_DATE_STAMP => $aufnahme_jahr.':'.$aufnahme_monat.':'.$aufnahme_tag,
);

// Set the IPTC tags
// die Konstanten IPTC_OBJECT_NAME,... sind in der Datei includes/iptc.php definiert
$iptc = array(
		IPTC_OBJECT_NAME => $aufnahme_jahr.'-'.$aufnahme_monat.'-'.$aufnahme_tag.' '.convertSring($ort),
		IPTC_CAPTION => convertSring($beschreibung),
		IPTC_HEADLINE => convertSring($ueberschrift),
		IPTC_KEYWORDS => convertSring($stichwoerter),
		IPTC_CREATED_DATE => $aufnahme_jahr.$aufnahme_monat.$aufnahme_tag,
		IPTC_CREATED_TIME => '000000+0000',
		IPTC_CITY => convertSring($ort),	
		IPTC_SUBLOCATION => convertSring($ortsteil),
		IPTC_PROVINCE_STATE => convertSring($bundesland),
		IPTC_COUNTRY => convertSring($land),
		IPTC_COUNTRY_CODE => convertSring($iso),
		IPTC_ISO => convertSring($iso),
		IPTC_LOCATION => convertSring($land),
		IPTC_COPYRIGHT => convertSring($credit),
		IPTC_SPECIAL_INSTRUCTIONS => convertSring($einschraenkung),
		IPTC_BYLINE_TITLE1 => convertSring($credit),
		IPTC_BYLINE_TITLE2 => convertSring($credit),
		IPTC_BYLINE_TITLE3 => convertSring($credit),
		IPTC_BYLINE_TITLE4 => convertSring($credit),
		IPTC_SOURCE => convertSring($credit),
		IPTC_CAPTION_WRITER => convertSring($credit),
		IPTC_AUTHOR_ADDRESS => convertSring(AUTHOR_ADDRESS),
		IPTC_AUTHOR_CITY => convertSring(AUTHOR_CITY),
	    	IPTC_AUTHOR_STATE => convertSring(AUTHOR_STATE),
	    	IPTC_AUTHOR_ZIP => convertSring(AUTHOR_ZIP),
	    	IPTC_AUTHOR_COUNTRY => convertSring(AUTHOR_COUNTRY),
	    	IPTC_AUTHOR_PHONE => convertSring(AUTHOR_PHONE),
	    	IPTC_AUTHOR_EMAIL => convertSring(AUTHOR_EMAIL),
	    	IPTC_AUTHOR_URL => convertSring(AUTHOR_URL),
	    	IPTC_GENRE => convertSring(GENRE),
		IPTC_TMP_FOTOGRAF => convertSring($fotograf_cardinfo),
		IPTC_TMP_PLZ => convertSring($plz),
    		IPTC_TMP_LANDKREIS => convertSring($landkreis),
    		IPTC_TMP_GETAUCHT => ($ort_getauscht) ? '1' : '0',
);

// set the XMP tags
// werden nicht geschrieben, desshalb leer
$xmp_data = array();


$obj_bild = new Bild($image_path,$image_name);


// Aufruf zum Schreiben der Metadaten
if(!$obj_bild->writeHeaderData($exif_fields,$iptc,$xmp_data))
{
	echo "Fehler beim Schreiben der Metadaten";
}
else
{
	echo "Datei ".$image_name." wurde mit Metadaten in das Verzeichnis ".$image_path."tmp abgelegt.";
}

?>
