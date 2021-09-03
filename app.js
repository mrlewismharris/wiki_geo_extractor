const fs = require('fs')

var fileName = "enwiki-20210801-pages-articles-multistream.xml"

var fileSize = (fs.statSync(fileName).size / (1024*1024)).toFixed(2)

// let skipList
// fs.readFile('skiplist.json', 'utf-8', (err, data) => {
//   if (err) throw err
//   skipList = JSON.parse(data)
// })

var rs = fs.createReadStream(fileName, {encoding: "utf-8"})

var progressBytes = 0
var buffers = []
var otherworlds = []
var prevLast = ""

if (!fs.existsSync('wiki_earth.csv')) {
  fs.appendFile('wiki_earth.csv', '"title","url","latitude","longitude"\n', (err) => {
    if (err) throw err
  })
}

if (!fs.existsSync('wiki_rejects.csv')) {
  fs.appendFile('wiki_rejects.csv', `"title","lat","long","raw"\n`, (err) => {
    if (err) throw err
  })
}

rs.on('data', (chunk) => {
  progressBytes = progressBytes + chunk.length
  if (buffers.length == 10) {
    var pages = buffers.join("").replace(/\r?\n|\r/g, "").split("<page>")
    if (prevLast !== "") { 
      pages[0] = prevLast + pages[0]
    }
    prevLast = pages.pop()
    pages.splice(-1)
    pages = pages.map(e => e.split("</page>")[0]).filter(e => e.includes("{{coord"))
    let objArray = []
    pages.forEach(e => {
      let obj = {}
      try {
        obj.title = e.split("<title>")[1].split("</title>")[0]
        if (obj.title.includes("[]")) {obj.title = obj.title.replace('[]', '')}
      } catch (err) {
        //FATAL ERROR!!!
        errorObj = {
          "err": JSON.stringify(err),
          "item": e
        }
        fs.appendFile('fatal_error.json', JSON.stringify(errorObj, null, 2), (error) => {
          if (error) throw error
        })
      }
      obj.url = `https://wikipedia.org/wiki/${obj.title.split(" ").join("_")}`
      let rawcoords = e.split("{{coord")[1].split("}}")[0]
      if (rawcoords.includes("|globe")) {
        obj.rawcoords = rawcoords
        otherworlds.push(obj)
        return
      }
      let coordSplit = rawcoords.split("|")
      //remove the first empty val ''
      if (coordSplit[0]=="") { coordSplit.splice(0, 1) }
      //remove "s" item (from pages with "{{coords|" instead of "{{coord|")
      if (coordSplit[0]=="s") { coordSplit.splice(0, 1)}
        //obj.rawcoords = coordSplit.join("|")
      //filter through different coord types provided by wikipedia
      //this is standard coords ns (s neg), ew (w neg)
      if ((coordSplit[0] % 1 !== 0 && coordSplit[1] % 1 !== 0) && coordSplit[1] !== "N") {
        obj.ns = parseFloat(coordSplit[0])
        obj.ew = parseFloat(coordSplit[1])
      } else {
        if (coordSplit.indexOf("N") > -1) {
          //this is DMS coords N to positive ns coords
          let northCoordsRaw = []
          for (i=0;i<coordSplit.indexOf("N");i++) {
            northCoordsRaw.push(coordSplit[i])
          }
          let northCoords = 0
          if (typeof northCoordsRaw[0] !== 'undefined') { northCoords = northCoords + parseFloat(northCoordsRaw[0])}
          if (typeof northCoordsRaw[1] !== 'undefined') { northCoords = northCoords + (parseFloat(northCoordsRaw[1]) / 60)}
          if (typeof northCoordsRaw[2] !== 'undefined') { northCoords = northCoords + (parseFloat(northCoordsRaw[2]) / 3600)}
          obj.ns = parseFloat(northCoords.toFixed(6))
          //console.log("North: " + northCoordsRaw.join(" ") + ": " + obj.ns + " (" + coordSplit.join() + ")")
        }
        if (coordSplit.indexOf("E") > -1) {
          //this is DMS coords E to positive ew coords
          let eastCoordsRaw = []
          for (i=0;i<coordSplit.indexOf("E");i++) {
            eastCoordsRaw.push(coordSplit[i])
          }
          if (eastCoordsRaw.indexOf("N") > 0) {
            eastCoordsRaw = eastCoordsRaw.splice(eastCoordsRaw.indexOf("N")+1)
          }
          if (coordSplit.indexOf("S") > 0) {
            eastCoordsRaw = eastCoordsRaw.splice(eastCoordsRaw.indexOf("S")+1)
          }
          let eastCoords = 0
          if (typeof eastCoordsRaw[0] !== 'undefined') { eastCoords = eastCoords + parseFloat(eastCoordsRaw[0])}
          if (typeof eastCoordsRaw[1] !== 'undefined') { eastCoords = eastCoords + (parseFloat(eastCoordsRaw[1]) / 60)}
          if (typeof eastCoordsRaw[2] !== 'undefined') { eastCoords = eastCoords + (parseFloat(eastCoordsRaw[2]) / 3600)}
          obj.ew = parseFloat(eastCoords.toFixed(6))
          //console.log("East: " + eastCoordsRaw.join(" ") + ": " + obj.ew + " (" + coordSplit.join() + ")")
        }
        if (coordSplit.indexOf("S") > -1) {
          //this is DMS coords S to negative ns coords
          let southCoordsRaw = []
          for (i=0;i<coordSplit.indexOf("S");i++) {
            southCoordsRaw.push(coordSplit[i])
          }
          let southCoords = 0
          if (typeof southCoordsRaw[0] !== 'undefined') { southCoords = southCoords + parseFloat(southCoordsRaw[0])}
          if (typeof southCoordsRaw[1] !== 'undefined') { southCoords = southCoords + (parseFloat(southCoordsRaw[1]) / 60)}
          if (typeof southCoordsRaw[2] !== 'undefined') { southCoords = southCoords + (parseFloat(southCoordsRaw[2]) / 3600)}
          obj.ns = parseFloat(southCoords.toFixed(6) * -1)
          //console.log("South: " + southCoordsRaw.join(" ") + ": " + obj.ns + " (" + coordSplit.join() + ")")
        }
        if (coordSplit.indexOf("W") > -1) {
          //this is DMS coords W to negative ew coords
          let westCoordsRaw = []
          for (i=0;i<coordSplit.indexOf("W");i++) {
            westCoordsRaw.push(coordSplit[i])
          }
          if (westCoordsRaw.indexOf("N") > 0) {
            westCoordsRaw = westCoordsRaw.splice(westCoordsRaw.indexOf("N")+1)
          }
          if (coordSplit.indexOf("S") > 0) {
            westCoordsRaw = westCoordsRaw.splice(westCoordsRaw.indexOf("S")+1)
          }
          let westCoords = 0
          if (typeof westCoordsRaw[0] !== 'undefined') { westCoords = westCoords + parseFloat(westCoordsRaw[0])}
          if (typeof westCoordsRaw[1] !== 'undefined') { westCoords = westCoords + (parseFloat(westCoordsRaw[1]) / 60)}
          if (typeof westCoordsRaw[2] !== 'undefined') { westCoords = westCoords + (parseFloat(westCoordsRaw[2]) / 3600)}
          obj.ew = parseFloat(westCoords.toFixed(6) * -1)
          //console.log("West: " + westCoordsRaw.join(" ") + ": " + obj.ew + " (" + coordSplit.join() + ")")
        }
        if (typeof obj.ns == "undefined" &&
        typeof obj.ew == "undefined" &&
        (parseFloat(coordSplit[0]) || coordSplit[0] == 0 || coordSplit[0] == "0") &&
        (parseFloat(coordSplit[1]) || coordSplit[1] == 0 || coordSplit[1] == "0")) {
          obj.ns = coordSplit[0]
          obj.ew = coordSplit[1]
        }
        if ((coordSplit[1] == "N" || coordSplit[1] == "S") &&
        (coordSplit[3] == "E" || coordSplit[3] == "W")) {
          obj.ns = coordSplit[0]
          if (coordSplit[1] == "S") {obj.ns = obj.ns * -1}
          obj.ew = coordSplit[2]
          if (coordSplit[3] == "W") {obj.ew = obj.ew * -1}
        }
      }
      if ((!parseFloat(obj.ns) && obj.ns !== 0 && obj.ns !== "0") || (!parseFloat(obj.ew) && obj.ew !== 0 && obj.ew !== "0")) {
        obj.rawcoords = coordSplit.join("|")
        //rejects.push(obj)
        fs.appendFile(`wiki_rejects.csv`, `"${obj.title}","${obj.ns}","${obj.ew}","${obj.rawcoords}"\n`, (err) => {
          if (err) throw err
          console.log(`    # # # # REJECTED "${obj.title}" # # # #`)
        })
        // if (!skipList.includes(obj.title)) {
        //   //console.log(obj)
        //   //throw coordSplit
        // }
      } else {
        //objArray.push(obj)
        fs.appendFile(`wiki_earth.csv`, `"${obj.title}","${obj.url}","${obj.ns}","${obj.ew}"\n`, (err) => {
          if (err) throw err
          console.log(`${((progressBytes/(10240))/fileSize).toFixed(2)}% - Appended "${obj.title}" to "wiki_earth.csv"`)
        })
      }
    })
    //allBuffers = allBuffers.concat(objArray)
    buffers = []
  }
  buffers.push(chunk)
  // if (otherworlds.length > 0) {
  //   fs.writeFile(`wiki_worlds.json`, JSON.stringify(otherworlds, null, 2), (err) => {
  //     if (err) throw err
  //   })
  // }
})
