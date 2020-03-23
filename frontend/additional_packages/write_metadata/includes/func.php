<?php

// wandelt Zeichenkette in richtigen Zeichensatz fuer Bild-Header um
// eventuell nach utf-8: hier ist dies aber nicht der Fall
function convertSring($str)
{
	return $str;
}

// Umwandlung der Gradzahl in (Grad, Minuten, Sekunden)
function convertDecimalToDMS($degree) 
{
	if ($degree > 180 || $degree < -180)
	{
    		return null;
	}

  	$degree = abs($degree);            // positive Gradzahl verwenden (keine Unterscheidung zwischen W/O und N/S)

  	$seconds = $degree * 3600;         // Umwandung in Sekunden

  	$degrees = floor($degree);         // Ganze Gradzahl
  	$seconds -= $degrees * 3600;       // Verbleibende Sekunden ohne Gradwert

  	$minutes = floor(10000 * round($seconds / 60,6));   // Ganze Minutenzahl.

  	$seconds = 0;

  	return array(array($degrees, 1), array($minutes, 10000), array(0, 1));
}
?>
