//IIFE: Koden isoleras ifrån det globala, så att de olika filerna inte kan råka påverka varandra
(function(){
    'use strict'
    var dates = new Array(2);
    var content = "";
    
    setDates();
    addNewTable('Idag');
    //Det värde som getWeather returnar med callback skickas direkt vidare som inparameter till funktionen handleWeather.
    getWeather(handleWeather);
    
    /**
     * Hämta dagens och morgondagens datum.
     */
    function setDates(){
        let date = new Date();
        dates[0] = getFormattedDate(date);
        date.setDate(date.getDate() + 1);
        dates[1] = getFormattedDate(date);
    }

    /**
     * Formattera datumen till det format som finns i den hämtade datan (validTime)
     * @param {Date} date 
     */
    function getFormattedDate(date){
        let dd = date.getDate();
        let mm = date.getMonth()+1; //Januari är 0!
        let yyyy = date.getFullYear();
        if(dd<10) {
            dd='0'+dd
        } 
        if(mm<10) {
            mm='0'+mm
        } 
        return yyyy+'-'+mm+'-'+dd;
    }

    /**
     * Hämta data från smhi
     * @param {Function} callback(weatherDate): kallas på efter att datan är hämtad 
     */
    function getWeather(callback){
        let xhr = new XMLHttpRequest();
        /**
         * När vi får svaret från sidan händer detta event
         */
        xhr.addEventListener('load', function(event){
            if(event.target.status==200){
                var weatherData = JSON.parse(event.target.response);
                callback(weatherData);
            }
        });
        //GET: Hämta information, endpoint: var nånstans på servern.
        xhr.open('GET', 'http://opendata-download-metfcst.smhi.se/api/category/pmp2g/version/2/geotype/point/lon/18.1489/lat/57.3081/data.json');
        xhr.send();
    }

    /**
     * Hämta ut själva värdena som ska användas, som tex temperatur om name == t. Spara alla i en array. 
     * Skicka sedan vidare dem för att populera tabellen.
     * @param {Array} validDateAndTime 
     * @param {Array} measurement 
     * @param {Array} dateAndTimeToDisplay 
     */
    function handleMeasurement(validDateAndTime, measurement, dateAndTimeToDisplay){
        while(parseInt(validDateAndTime[1],10) > dateAndTimeToDisplay[1] && validDateAndTime[0] == dates[dateAndTimeToDisplay[0]]){
            concatenateTable(dateAndTimeToDisplay[1], ['-','-','-','-'])
            dateAndTimeToDisplay[1] += 6;
        } 
        if(validDateAndTime[0] == dates[dateAndTimeToDisplay[0]] && parseInt(validDateAndTime[1],10) == dateAndTimeToDisplay[1])
        {
            for(let item in measurement){
                let typeOfMeasurement = measurement[item];
                var params = new Array(4);
                for(let subItem in typeOfMeasurement){
                    let parameter = typeOfMeasurement[subItem];
                    if(parameter.name == 't'){
                        params[0] = parameter.values[0];
                    }
                    if(parameter.name == 'wd'){
                        params[1] = parameter.values[0];
                    }
                    if(parameter.name == 'ws'){
                        params[2] = parameter.values[0];
                    }
                    if(parameter.name == 'Wsymb'){
                        params[3] = parameter.values[0];
                    }
                }
            }

            concatenateTable(dateAndTimeToDisplay[1], params);
            
            //Vi letar bara efter 3 klockslag om dagen. Varje gång vi har kollat så hoppar vi fram 6 timmar 
            //tills vi har kollat på det sista intressanta klockslaget
            if(dateAndTimeToDisplay[1] < 24){
                dateAndTimeToDisplay[1] += 6;
            } 
            if(dateAndTimeToDisplay[1] >= 24){
                //Efter sista klockslaget, gör klart den dagens tabell.
                finalizeTable();
                if(dateAndTimeToDisplay[0] < 1){
                    addNewTable('Imorgon');
                }
                //Återställ tiden till den första och byt dag till imorgon.
                dateAndTimeToDisplay[1] = 6;
                dateAndTimeToDisplay[0] += 1;
            }
        }
        return dateAndTimeToDisplay;
    }

    /**
     * Gå igenom all data vi hämtat från smhi.
     * När det är färdigt, lägg till allt som sparats undan i content i andra funktioner i html taggen weather-widget.
     * @param {JSON} weatherData 
     */
    function handleWeather(weatherData){
        let timeSeries = weatherData.timeSeries;
        let dateAndTimeToDisplay = new Array(2);
        //date
        dateAndTimeToDisplay[0] = 0;
        //time
        dateAndTimeToDisplay[1] = 6;
        for(let item in timeSeries){ 
            //Om vi är färdiga och redan gått igenom båda dagarna
            if(dateAndTimeToDisplay[0] > 2){
                break;
            }
            let measurement = timeSeries[item];
            let validDateAndTime = measurement.validTime.slice(0, -7).split('T');
            dateAndTimeToDisplay = handleMeasurement(validDateAndTime, measurement, dateAndTimeToDisplay);
        }
        addToWidget();
    }

    /**
     * Lägg till början av en ny tabell
     * @param {String} tableHeader 
     */
    function addNewTable(tableHeader){
        content +=  '<h2>'+ tableHeader +'</h2>'+
                    '<table style="width:auto">' +
                        '<thead>' +
                            '<tr>' + 
                                '<th>Kl</th>' +
                                '<th>Temp</th>' +
                                '<th>Vind</th>' +
                                '<th>Himmel</th>' +
                            '</th>' +
                        '</thead>' +
                        '<tbody>';
    }

    /**
     * Lägg till en ny rad i tabellen.
     * Pilen roteras beroende på vindriktningens grader
     * @param {Number} time 
     * @param {Array} params 
     */
    function concatenateTable(time, params){
        content += '<tr style="text-align: center">' +
                        '<td>' + time + '</td>' +
                        '<td>' + params[0] + ' &#176C</td>' +
                        '<td><img src="../images/arrow-up.png" alt="Vindriktning" title="Vindriktning"'+
                        ' style="transform: rotate(' + params[1] + 'deg)"\>' + ' &nbsp(' + params[2] + ')</td>' +
                        '<td>' + skyStatusTranslator(params[3]) + '</td>' +
                    '</tr>';
    }

    /**
     * Avsluta en tabell
     */
    function finalizeTable(){
        content += '</tbody>' +
                '</table>';
                
    }

    /**
     * Lägg till de nya tabellerna från content till sidan som visas för användarna.
     */
    function addToWidget(){
        document.querySelector('weather-widget').innerHTML = content;
    }

    /**
     * Avkoda vad siffrorna som beskriver vädret betyder
     * @param {Number} statusDigit 
     */
    function skyStatusTranslator(statusDigit){
        switch (statusDigit) {
            case 1: return "Klar himmel";
            case 2: return "Nästan klar himmel";
            case 3: return "Varierande molnighet";
            case 4: return "Halvklar himmel";
            case 5: return "Molnig himmel";
            case 6: return "Mulet";
            case 7: return "Dimma";
            case 8: return "Regnskurar";
            case 9: return "Åskväder";
            case 10: return "Lätt snöblandat regn";
            case 11: return "Lätt snöfall";
            case 12: return "Regn";
            case 13: return "Åska";
            case 14: return "Snöblandat regn";
            case 15: return "Snöfall";
            default: return "-";
        }
    }
}());

/*
AJAX = Asynkront JavaScript och XML. Det är ett samlingsnamn för olika tekniker som används tillsammans för att dynamiskt byta ut information på en hemsida
utan att refresha hela sidan. 
Eftersom main thread inte kan göra två saker samtidigt lägger man även funktionalitet i browser. Då kan man ha fler trådar som jobbar asynkront 
för att tex hämta data från andra källor, och när browsern fått in datan skickar den ett event till main thread. I main thread finns en eventlistener som lyssnar efter sådana events,
och när eventet kommer in kan main thread exekvera en funktion och göra vad den ska med informationen. 
På rad 48 i denna kod skapas en eventlistener som ska utföra olika saker då informationen är hämtad från smhi. Genom att sända ett XMLHttpRequest, där vi skickar med ett GET som innebär 
att vi vill hämta information och en länk till vart vi vill skicka detta request, kommer sedan informationen att skickas tillbaka därifrån. Eftersom man inte kan veta exakt när den datan 
kommer, och man inte vill att hela sidan ska ligga och vänta på det utan att kunna göra något annat, har man en eventlistener som håller reda på när infon kommer. 
När eventet kommer in extraheras den intressanta datan ut och parsas så att den kan användas senare i koden.
*/
