let data;

function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    })
}

function download(file, filename, type) {
    const link = document.getElementById('download');
    link.download = filename;
    let binaryData = [];
    binaryData.push(file);
    link.href = URL.createObjectURL(new Blob(binaryData, { type: type }))
}

function csvToJson() {
    requirejs.config({
        paths: {
            Papa: 'https://unpkg.com/papaparse@5.3.1/papaparse.min'
        }
    });

    requirejs(['Papa'], function (Papa) {

        const textarea = document.querySelector('#csv');
        data = Papa.parse(textarea.value, {
            header: true
        }).data;
        console.log(data);
    });
}


async function processCsvToPdf() {
    // process CSV
    csvToJson();
    
    let PDFDoc = PDFLib.PDFDocument;
    const { rgb, StandardFonts } = PDFLib;

    const doc = document.getElementById('file').files[0];
    let bytes = await readFileAsync(doc);
    const pdf = await PDFDoc.load(bytes);

    const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica);

    //get the first page of the document
    const pages = pdf.getPages();
    const firstPage = pages[0];

    // define inital starting points
    const color = rgb(0, 0, 0);
    const size = 12;
    const font = helveticaFont;
    let currentLineY = 592;
    const spaceBetweenLines = 15.5;
    let runningMinutesTotal = 0;



    if (data.length > 30) {
        alert('You have more than 30 entries. They will not all fit on the page');
    }

    // draw csv data to page
    for (let i = 0; i < data.length; i++) {
        let regex;
        // draw date
        const fullDate = data[i]['Clocked In'].slice(0, 5);
        regex = /\d+\/\d+/;
        const date = fullDate.match(regex)[0];
        firstPage.drawText(date, {
            x: 72,
            y: currentLineY,
            size: size,
            font: font,
            color: color
        })


        // draw start
        const start = data[i]['Clocked In'];
        regex = /[0-9/]+ (\d+:\d+)/;
        const cleanStart = start.match(regex)[1];
        firstPage.drawText(cleanStart, {
            x: 123,
            y: currentLineY,
            size: size,
            font: font,
            color: color
        })


        // draw stop
        const stop = data[i]['Clocked Out'];
        regex = /[0-9/]+ (\d+:\d+)/;
        const cleanStop = stop.match(regex)[1];
        firstPage.drawText(cleanStop, {
            x: 179,
            y: currentLineY,
            size: size,
            font: font,
            color: color
        })


        // draw difference
        //calculate difference in time
        const difference = new Date(stop) - new Date(start);
        //convert milliseconds to minutes
        const minutes = difference / 60 / 1000;
        const cleanMinutes = minutes.toString() + " min";
        firstPage.drawText(cleanMinutes, {
            x: 240,
            y: currentLineY,
            size: size,
            font: font,
            color: color
        })
        //add to runningMinutesTotal
        runningMinutesTotal += minutes;

        // draw summary
        const summary = data[i]['Comment'];
        firstPage.drawText(summary, {
            x: 297,
            y: currentLineY,
            size: size,
            font: font,
            color: color
        })

        currentLineY -= spaceBetweenLines;

    }

    //draw name
    firstPage.drawText('James Hall', {
        x: 100,
        y: 667,
        size: size,
        font: font,
        color: color
    })

    //draw month & year
    const monthYear = document.querySelector('#monthYear').value;
    firstPage.drawText(monthYear, {
        x: 390,
        y: 667,
        size: size,
        font: font,
        color: color
    })

    // draw total time summary
    // convert minutes to hours
    let minutes = runningMinutesTotal;
    let hours = 0;
    while (minutes >= 60) {
        minutes -= 60;
        hours += 1;
    }
    const cleanTime = `${hours}h, ${minutes}m`
    firstPage.drawText(cleanTime, {
        x: 240,
        y: 60,
        size: size,
        font: font,
        color: color
    })


    const pdfBytes = await pdf.save();

    download(pdfBytes, `James Hall ${monthYear} Timesheet`, 'application/pdf')
}
