# TODO

+ package and auto-update via electron builder (https://github.com/electron-userland/electron-builder)

+ probably include https://babeljs.io/docs/en/#jsx-and-react and rewrite dom manipulation with jsx (if possible)
+ Add Github Badges
+ Redesign GUI with Bootstrap and React
+ Make GUI:
  + 1 Main Window
  + 1 progress Window
  + 1 Notice Window post computation
  + Manually change Keywords and Caps on the fly
+ Make JS Backend:
  + update character counters (later version)
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
