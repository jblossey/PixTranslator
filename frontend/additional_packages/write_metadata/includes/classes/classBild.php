<?php
ini_set('gd.jpeg_ignore_warning', true);

require_once(INCLUDE_CLASS_PATH."classDatei.php");

// Klasse zum Schreiben der IPTC-Daten
require_once(INCLUDE_CLASS_PATH."classIPTC.php");

// Klassen zum Schreiben der EXIF-Daten
require_once(INCLUDE_CLASS_PATH.'pel/src/PelDataWindow.php');
require_once(INCLUDE_CLASS_PATH.'pel/src/PelJpeg.php');
require_once(INCLUDE_CLASS_PATH.'pel/src/PelTiff.php');

class Bild extends Datei
{
	private $width;
	private $height;
	private $exif_error = 0;

	function __construct($path,$filename,$width=0)
	{
		parent::__construct($path,$filename);

		if(file_exists($this->path.$this->filename))
		{
			$size = getimagesize($this->path.$this->filename);

			$this->width = $size[0];
			$this->height = $size[1];

			if($width)
			{
				$this->height = ($width/$this->width) * $this->height;
				$this->width = $width;
			}
		}
	}

	function getDefaultImg($width,$height)
	{
		$img = imagecreatetruecolor($width,$height);
		$bgc = imagecolorallocate($img, 255, 255, 255);
		imagefilledrectangle($img, 0, 0, $width, $height, $bgc);

		return $img;
	}

	function getHeight()
	{
		return $this->height;
	}

	function getWidth()
	{
		return $this->width;
	}

	function isHochformat($file)
	{
		// nur BIlddateien ueberpruefen
		if(file_exists($file) && !preg_match("/\.mp4$/",$file))
		{
			$imagesize = getimagesize($file);

			return $imagesize[1] > $imagesize[0];

		}

		return 0;
	}

	function getFilesize()
	{
		if(file_exists($this->path.$this->filename))
		{
			// in MB
			return filesize($this->path.$this->filename) / pow(1024, 2);
		}

		return 0;
	}


	function getFileInfos($use_exiftool = 1)
	{
		getimagesize($this->path.$this->filename, $iptc_info);

		$time = microtime(true);

		// read IPTC data
		if(isset($iptc_info["APP13"]))
		{
			$iptc_data = iptcparse($iptc_info["APP13"]);
			if(is_array($iptc_data)) 
			{
				foreach ($iptc_data as $iptc_key => $iptc_value)
				{
					if($iptc_key != '2#000')
					{
						if(count($iptc_value)>1){
							$info["$iptc_key"] = utf8_encode(implode(',',$iptc_value));
						}
						else{
							$info["$iptc_key"] = utf8_encode($iptc_value[0]); 
						}
					}
				}
			}
		}
		$dauer = microtime(true) - $time;
	//	echo "IPTC: ".$dauer."<br>";

		$time = microtime(true);
		// read EXIF data
		if(function_exists("exif_read_data"))
		{
			$exif_data = exif_read_data($this->path.$this->filename ,1, true);
			if($exif_data!=false){
				foreach ($exif_data as $exif_key => $exif_section) {
					foreach ($exif_section as $exif_name => $exif_value) {
					//	if((stristr($exif_name,'makernote')== false)&&(stristr($exif_name,'usercomment')== false)&&
					//		(stristr($exif_name,'undefined')== false)){
								$info["$exif_name"] = is_array($exif_value) ? 
											utf8_encode(implode(',',$exif_value)) :
											utf8_encode($exif_value);
					//	}
					}
				}
			}
		}
		$dauer = microtime(true) - $time;
	//	echo "exif: ".$dauer."<br><br>";

		// falls es folgende Eintraege gibt => uebernehme diese Werte als GPS-Daten fuer das Bild
		// GPSDestLatitudeRef => North
		// GPSDestLatitude => 48 deg 6' 20.62"
		// GPSDestLongitudeRef => East
		// GPSDestLongitude => 11 deg 34' 0.89" 
		
		$image_file = $this->path.$this->filename;

		if($use_exiftool)
		{
			eval('$exiftool_array=' . `exiftool -php -q $image_file`);
		}

	//	${'$exiftool_array=' . `exiftool -php -q $image_file`};
		if(isset($exiftool_array[0]) && count($exiftool_array[0]))
		{
			if(isset($exiftool_array[0]['GPSDestLatitudeRef']))
			{
				$info['GPSLatitudeRef'] = substr($exiftool_array[0]['GPSDestLatitudeRef'],0,1);
			}

			if(isset($exiftool_array[0]['GPSDestLatitude']))
			{
				$GPSDestLatitude = trim(str_replace('  ',' ',str_replace('"','',str_replace("'",'',str_replace('deg ','',$exiftool_array[0]['GPSDestLatitude'])))));
				$GPSDestLatitudeArr = explode(' ',$GPSDestLatitude);

				$GPSDestLatitudeArr1 = array();
				foreach($GPSDestLatitudeArr as $vv)
				{
					if(trim($vv) != '')
					{
						$GPSDestLatitudeArr1[] = $vv;
					}
				}
	
				$info['GPSLatitude'] = $GPSDestLatitudeArr1[0].'/1,'.$GPSDestLatitudeArr1[1].'/1,'.$GPSDestLatitudeArr1[2].'/1';
			}

			if(isset($exiftool_array[0]['GPSDestLongitudeRef']))
			{
				$info['GPSLongitudeRef'] = substr($exiftool_array[0]['GPSDestLongitudeRef'],0,1);
			}

			if(isset($exiftool_array[0]['GPSDestLongitude']))
			{
				$GPSDestLongitude = trim(str_replace('  ',' ',str_replace('"','',str_replace("'",'',str_replace('deg ','',$exiftool_array[0]['GPSDestLongitude'])))));
				$GPSDestLongitudeArr = explode(' ',$GPSDestLongitude);

				$GPSDestLongitudeArr1 = array();
				foreach($GPSDestLongitudeArr as $vv)
				{
					if(trim($vv) != '')
					{
						$GPSDestLongitudeArr1[] = $vv;
					}
				}

				$info['GPSLongitude'] = $GPSDestLongitudeArr1[0].'/1,'.$GPSDestLongitudeArr1[1].'/1,'.$GPSDestLongitudeArr1[2].'/1';
			}
		}


		return isset($info) ? $info : 0;
	}

	function iptc_make_tag($rec, $data, $value)
	{
    		$length = strlen($value);
    		$retval = chr(0x1C) . chr($rec) . chr($data);

    		if($length < 0x8000)
    		{
        		$retval .= chr($length >> 8) .  chr($length & 0xFF);
    		}
    		else
    		{
        		$retval .= chr(0x80) . 
                   		chr(0x04) . 
		                chr(($length >> 24) & 0xFF) . 
                		chr(($length >> 16) & 0xFF) . 
		                chr(($length >> 8) & 0xFF) . 
                		chr($length & 0xFF);
    		}

    		return $retval . $value;
	}

	function deleteImage()
	{
		if(file_exists($this->path.$this->filename))
		{
			unlink($this->path.$this->filename);
		}

		return 1;
	}

	function writeHeaderData($exif_fields,$iptc,$xmp_data,$new_filename='')
	{
		if($new_filename == '')
		{
			$new_filename = $this->getFilename();
		}

		$this->makeTmpFolder();

		$img_file = $this->getPath().$this->getFilename();

		exec("exiftool -overwrite_original -makernotes:all= ".$img_file );
		exec("exiftool -overwrite_original -xmp:all= ".$img_file);		// alle XMP-Daten loeschen
		exec("exiftool -overwrite_original -iptc:all= ".$img_file);		// alle IPTC-Daten loeschen

		/*** Exif-Daten schreiben ************************************/

		$img_data = new PelDataWindow(file_get_contents($img_file));

		if (PelJpeg::isValid($img_data)) 
		{
			$jpeg = $file = new PelJpeg();

			try {
				$jpeg->load($img_data);
			}
			catch (Exception $e) {
				$this->error = "Fehler beim Schreiben der Exif-Daten. Bild wurde nicht ersetzt.";

				$this->exif_error = 1;
			}

			if($this->exif_error)
			{
				return 0;
			}

			$exif = $jpeg->getExif();

			if ($exif == null) 
			{
				$exif = new PelExif();
	    			$jpeg->setExif($exif);

				$tiff = new PelTiff();
	    			$exif->setTiff($tiff);
			}
			else
			{
				$tiff = $exif->getTiff();
			}

			$ifd0 = $tiff->getIfd();
			if ($ifd0 == null) 
			{
				$ifd0 = new PelIfd(PelIfd::IFD0);
				$tiff->setIfd($ifd0);
			}
		
			$gps_ifd = $ifd0->getSubIfd(PelIfd::GPS);
			if ($gps_ifd == null) 
			{
				$gps_ifd = new PelIfd(PelIfd::GPS);
	  			$ifd0->addSubIfd($gps_ifd);
			}

			foreach($exif_fields as $exif_key=>$exif_value)
			{
				if(isset($entry))
				{
					unset($entry);
				}

				switch($exif_key)
				{
					case 'IMAGE_DESCRIPTION':

						$entry = $ifd0->getEntry(PelTag::IMAGE_DESCRIPTION);			
						if ($entry == null) 
						{
							$entry = new PelEntryAscii(PelTag::IMAGE_DESCRIPTION, $exif_value);
							$ifd0->addEntry($entry);
						}
						else 
						{
							$entry->setValue($exif_value);
						}

						break;			

					case 'USER_COMMENT':

						$exif_ifd = $ifd0->getSubIfd(PelIfd::EXIF);
						if ($exif_ifd == null) 
						{
							$exif_ifd = new PelIfd(PelIfd::EXIF);

							$exif_ifd->addEntry(new PelEntryUserComment($exif_value));
		  					$ifd0->addSubIfd($exif_ifd);
						}

						/*
						$entry = $ifd0->getEntry(PelTag::USER_COMMENT);			
						if ($entry == null) 
						{
							$entry = new PelEntryUserComment($exif_value);
							$ifd0->addEntry($entry);
						}
						else 
						{
							$entry->setValue($exif_value);
						}
						 */
						break;	

					case 'GPS_LATITUDE_REF':
						$entry = $gps_ifd->getEntry(PelTag::GPS_LATITUDE_REF);			
						if ($entry == null) 
						{
							$entry = new PelEntryAscii(PelTag::GPS_LATITUDE_REF, $exif_value);

							$gps_ifd->addEntry($entry);
						}
						else 
						{
							$entry->setValue($exif_value);
						}
						break;			
					case 'GPS_LATITUDE':
						$entry = $gps_ifd->getEntry(PelTag::GPS_LATITUDE);			
						if ($entry == null) 
						{
							$entry = new PelEntryRational(PelTag::GPS_LATITUDE,$exif_value[0], $exif_value[1], $exif_value[2]);
							$gps_ifd->addEntry($entry);
						}
						else 
						{	
							$entry->setValue($exif_value[0], $exif_value[1], $exif_value[2]);
						}
						break;	
					case 'GPS_LONGITUDE_REF':
						$entry = $gps_ifd->getEntry(PelTag::GPS_LONGITUDE_REF);			
						if ($entry == null) 
						{
							$entry = new PelEntryAscii(PelTag::GPS_LONGITUDE_REF, $exif_value);
							$gps_ifd->addEntry($entry);
						}
						else 
						{
							$entry->setValue($exif_value);
						}
						break;			
					case 'GPS_LONGITUDE':
						$entry = $gps_ifd->getEntry(PelTag::GPS_LONGITUDE);			
						if ($entry == null) 
						{
							$entry = new PelEntryRational(PelTag::GPS_LONGITUDE,$exif_value[0], $exif_value[1], $exif_value[2]);
							$gps_ifd->addEntry($entry);
						}
						else 
						{
							$entry->setValue($exif_value[0], $exif_value[1], $exif_value[2]);
						}
						break;	
					case 'GPS_DATE_STAMP':
						$entry = $gps_ifd->getEntry(PelTag::GPS_DATE_STAMP);			
						if ($entry == null) 
						{
							$entry = new PelEntryAscii(PelTag::GPS_DATE_STAMP, $exif_value);
							$gps_ifd->addEntry($entry);
						}
						else 
						{
							$entry->setValue($exif_value);
						}
						break;	
					case 'COPYRIGHT':
						$entry = $ifd0->getEntry(PelTag::COPYRIGHT);			
						if ($entry == null) 
						{
							$entry = new PelEntryAscii(PelTag::COPYRIGHT, $exif_value);
							$ifd0->addEntry($entry);
						}
						else 
						{
							$entry->setValue($exif_value);
						}
						break;			
					case 'ARTIST':
						$entry = $ifd0->getEntry(PelTag::ARTIST);			
						if ($entry == null) 
						{
							$entry = new PelEntryAscii(PelTag::ARTIST, $exif_value);
							$ifd0->addEntry($entry);
						}
						else 
						{	
							$entry->setValue($exif_value);
						}
						break;			
				}

			} // END foreach($exif_fields...)

			$file->saveFile($this->getTmpFolder().$new_filename);

		} // END PelJpeg::isValid()
		else
		{
			$this->error = "Fehler beim Schreiben der Exif-Daten. Bild wurde nicht ersetzt.";
			return 0;
		}



		/*** ENDE: Exif-Daten schreiben ************************************/

		if(file_exists($this->getTmpFolder().$new_filename))
		{
			$this->XMP_remove_from_jpegfile ($this->getTmpFolder().$new_filename);		

			/*** IPTC-Daten schreiben ******************************************/

			$obj_iptc = new Iptc($this->getTmpFolder().$new_filename);

			/** alte iptc Daten loeschen *********************************************/
			getimagesize($this->getTmpFolder().$new_filename, $iptc_info);
			if(isset($iptc_info["APP13"]))
			{
				$iptc_data = iptcparse($iptc_info["APP13"]);
				if(is_array($iptc_data)) 
				{
					foreach ($iptc_data as $iptc_key => $iptc_value)
					{
						if($iptc_key != '2#000' && $iptc_key != '2#001' && !in_array(substr($iptc_key,2),array_keys($iptc)))
						{
							unset($obj_iptc->meta[$iptc_key]);
						}
					}
				}
			}

			foreach($iptc as $tag => $string)
			{
				if($tag == IPTC_KEYWORDS)	// Keywords als Array speichern
				{
					$iptc_keywords = array();
					$arr_stichwoerter = explode(",",$string);
					foreach($arr_stichwoerter as $stichwort)
					{
						$stichwort = trim($stichwort);

						if($stichwort != '' && $stichwort != "...")
						{
							// letztes deutsches und erstes englisches Wort trennen
							if(preg_match("/(.+)\/\/.+/",$stichwort))
							{
								array_push($iptc_keywords,trim(substr($stichwort,0,strpos($stichwort,'//'))));
								array_push($iptc_keywords,trim(substr($stichwort,strpos($stichwort,'//'))));
							}
							else
							{
								array_push($iptc_keywords,trim($stichwort));
							}
						}
					}

					$obj_iptc->set($tag,$iptc_keywords);
				}
				else
				{
					$obj_iptc->set($tag,$string);
				}
			}

			$data = "";

			// Convert the IPTC tags into binary code
			$utf8seq = chr(0x1b) . chr(0x25) . chr(0x47);
			$length = strlen($utf8seq);
			$data = chr(0x1C) . chr(1) . chr('090') . chr($length >> 8) . chr($length & 0xFF) . $utf8seq;

			foreach($obj_iptc->meta as $tag => $string)
			{
				if(preg_match("/^2\#/",$tag))
				{
					$tag = substr($tag, 2);
	    				$data .= $obj_iptc->iptc_make_tag(2, $tag, $string[0]);
				}
			}

			$content = iptcembed($data, $obj_iptc->file);

			$fp = fopen($obj_iptc->file, "wb");
			fwrite($fp, $content);
			fclose($fp);
			
			/*** ENDE: IPTC-Daten schreiben ************************************/


			/**** xmp-Daten schreiben **************************************************/

			// nicht mehr benoetigt (11.11.2014)			
		
			/**** ENDE: xmp-Daten schreiben **************************************************/
		}
		else
		{
			$this->error = "Tempor&auml;re Bildatei existiert nicht. Bild wurde nicht ersetzt.";
			return 0;
		}


		return 1;
	}

	function XMP_remove_from_jpeg (&$image)
	{
		$xmp_str = "http://ns.adobe.com/xap/1.0/";
		$xmp_end = '<?xpacket end="w"?>';

  		$n_str = strpos ($image, $xmp_str);
  		$n_end = strpos ($image, $xmp_end);
		if (($n_str !== false) && ($n_end !== false) && ($n_str < $n_end)) 
		{
    			$n_str -= 4; 
		    	$n_end += strlen ($xmp_end)-1;
    			$endchar = $image [$n_str-1];
			if ($endchar == " ") 
			{
      				$endchar = "A";
			} 
			else 
			{
      				$endchar = " ";
    			}
    			
			$xmp_len = $n_end-$n_str+1;
    			$img_len = strlen ($image);
			$len = $img_len - $xmp_len;

			for ($i = $n_str; $i < $img_len; $i ++) 
			{
      				if ($i < $len) 
				{
					$image [$i] = $image [$i+$xmp_len];
				} 
				else 
				{
				        $image [$i] = $endchar;
      				}
    			}
    			$image = rtrim ($image, $endchar);
    
			return true;
  		} 
		else 
		{
    			return false;
		}
	}

	function XMP_remove_from_jpegfile ($filename_in, $filename_out="") 
	{
  		if (""==$filename_out) 
		{    
			$filename_out = $filename_in;
  		}
		if ((""!=$filename_in) && (file_exists ($filename_in)) && (($len_in = filesize ($filename_in)) > 0)) 
		{
    			$f_in = fopen ($filename_in, "rb");
    			$img = fread ($f_in, $len_in);
    			fclose ($f_in);
	
			if ($this->XMP_remove_from_jpeg ($img)) 
			{
      				$f_out = fopen ($filename_out, "wb");
      				fwrite ($f_out, $img, strlen ($img));
      				fclose ($f_out);
    			}
  		}
	}
}
?>
