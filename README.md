# wiki_geo_extractor
Extract geo-data from wikipedia dumps found at https://en.wikipedia.org/wiki/Wikipedia:Database_download (like "pages-articles-multistream.xml.bz2"), current revision is best (lowest size).

Requires NodeJS, Google Earth

## How to use:
1. Extract the xml file into the node script directory
2. In the script, change the fileName variable to the xml document name
3. Run the script, should output "wiki_earth.csv" (Around 94MB ~enwiki-20210801-pages-articles-multistream.xml) and "wiki_rejects.csv" (you can use that list to fix/add geodata)
4. Zoom into a portion of the map BEFORE dragging the wiki_earth.csv file into Google Earth - currently there is 1,046,829 csv lines/wikipedia pages which would be impossible for Google Earth to display simultaneously and well above the recommended 2500 placemark limit (There are website like https://copernix.io that allow for all data to be loaded as you scroll around the map, but this lacks Google Earth capabilities that some people may want)
5. Make sure you drag the "wiki_earth.csv" folder out of the Temporary Places folder and into My Places folder, otherwise it will delete the folder when you close Google Earth.

## Limitations
* Can't filter user errors from Wikipedia pages (fuzzy filtering 54,000,000 pages would take too long and probably generate lots of errors)
* Has to take place within a data stream because of the XML's size limitations
* Real pages may be rejected for various reasons, but looking through the rejects, it's very minimal
* Entries with multiple "{{coord|" will ONLY use the first reference as the actual coordinates
