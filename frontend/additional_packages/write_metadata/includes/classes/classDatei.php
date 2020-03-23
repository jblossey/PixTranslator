<?php

define('TMP_IMAGE_TEM_PATH','tmp/');

class Datei
{
	protected $filename;
	protected $path;
	protected $error;
	protected $mime_type;

	function __construct($path,$filename)
	{

		$this->path = $path;
		$this->filename = $filename;

		if(!preg_match("/\/$/",$this->path))	// / am Ende hinzufuegen
		{
			$this->path .= "/";
		}
	}

	function setMimeType($type = '')
	{
		if($type != '')
		{
			$this->mime_type = $type;
		}
		else
		{
			if(file_exists($this->path.$this->filename) && class_exists('finfo'))
			{
				$finfo = new finfo(FILEINFO_MIME);
				$this->mime_type = trim(current(explode(";", $finfo->file($this->path.$this->filename))));
			}
		}
	}

	function getMimeType()
	{
		return $this->mime_type;
	}

	function getPath()
	{
		return $this->path;
	}

	function getFilename()
	{
		return $this->filename;
	}

	function setFilename($filename)
	{
		$this->filename = $filename;
	}


	function deleteDatei()
	{
		if(file_exists($this->path.$this->filename))
		{
			unlink($this->path.$this->filename);

			return 1;
		}

		return 0;
	}

	
	function rename($new)
	{
		if(file_exists($this->path.$this->filename))
		{
			rename($this->path.$this->filename,$new);

			return 1;
		}

		return 0;
	}

	function getError()
	{
		return $this->error;
	}

	function getTmpFolder()
	{
		return $this->getPath().TMP_IMAGE_TEM_PATH;
	}

	function makeTmpFolder()
	{
		$tmp_folder = $this->getTmpFolder();

		if(!file_exists($tmp_folder))	// Neues tmp-Verzeichnis erstellen
		{
			$oldumask = umask(0);
			mkdir($tmp_folder,0777);
			umask($oldumask);
		}

		return 1;
	}
}
?>
