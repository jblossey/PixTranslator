<?php
class Iptc {
        var $meta=Array();
        var $hasmeta=false;
        var $file=false;


        function __construct($filename) {
            $size = getimagesize($filename,$info);
            $this->hasmeta = isset($info["APP13"]);
            if($this->hasmeta)
                $this->meta = iptcparse ($info["APP13"]);
            $this->file = $filename;
        }
        function set($tag, $data) {
            $this->meta ["2#$tag"]= Array( $data );
            $this->hasmeta=true;
        }
        function get($tag) {
            return isset($this->meta["2#$tag"]) ? $this->meta["2#$tag"][0] : false;
        }
       
        function dump() {
            print_r($this->meta);
        }
        function binary() {
            $iptc_new = '';
            foreach (array_keys($this->meta) as $s) {
                $tag = str_replace("2#", "", $s);
                $iptc_new .= $this->iptc_make_tag(2, $tag, $this->meta[$s][0]);
            }       
            return $iptc_new;   
        }

	function iptc_make_tag($rec, $data, $value)
	{
		if (is_array($value)) 
		{
			$source = '';
			foreach($value as $item) 
			{
        			$len = strlen($item);
        			$source .= chr(0x1c).chr($rec).chr($data);
        			$source .= chr($len >> 8).
                   				chr($len & 0xff).
                   				$item;
    			}
    			
			return $source;
		}

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
/*
        function iptc_maketag($rec,$dat,$val) {
            $len = strlen($val);
            if ($len < 0x8000) {
                   return chr(0x1c).chr($rec).chr($dat).
                   chr($len >> 8).
                   chr($len & 0xff).
                   $val;
            } else {
                   return chr(0x1c).chr($rec).chr($dat).
                   chr(0x80).chr(0x04).
                   chr(($len >> 24) & 0xff).
                   chr(($len >> 16) & 0xff).
                   chr(($len >> 8 ) & 0xff).
                   chr(($len ) & 0xff).
                   $val;
                  
            }
	}  
 */
        function write() {
            if(!function_exists('iptcembed')) return false;
            $mode = 0;
            $content = iptcembed($this->binary(), $this->file);   
               
            @unlink($this->file); #delete if exists
           
            $fp = fopen($this->file, "wb");
            fwrite($fp, $content);
            fclose($fp);
        }   
       
        #requires GD library installed
        function removeAllTags() {
            $this->hasmeta=false;
            $this->meta=Array();
            $img = imagecreatefromstring(implode(file($this->file)));
            @unlink($this->file); #delete if exists
            imagejpeg($img,$this->file,100);
        }
}
?>
