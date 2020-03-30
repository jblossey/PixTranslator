# TODO

+ Add Github Badges
+ Redesign GUI with Bootstrap
+ Make GUI:
  + DONE 1 Form to put in Deepl Key TODO (checkbox for save/not-save)
  + 1 Main Window
  + DONE 1 Notice Window pre computation
  + 1 progress Window
  + 1 Notice Window post computation
+ Make JS Backend:
  + DONE Save and Check Deepl Key
  + DONE call remaining char-count from deepl
  + update character counters (later version)
  + DONE Bind Routine-Start to Button
  + Active beibehalten wenn clicked, rechtsklick, auswahl, mehrfachauswahl und löschen
+ Make Java (Apache Commons Imaging) Backend:
  + Check whether database, deeplkey are present
  + character count service
  + Translation Service:
    + Sensibly Collect Keywords and Captions (compare between XMP, IPTC(IIM) and Exif)
    + Compare to DB and Filter duplicates
    + Send To Deepl
    + Receive missing Translations from DB
    + Save IPTC and Exif
    + (Delete XMP, IPTC and Exif - automatically done when writeMetadata() is called)
  + eventListener to be able to update progress window
