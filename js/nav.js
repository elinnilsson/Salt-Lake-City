(function(){
'use strict'
    var nav;
    /**
     * Det går inte att hämta nav förrän sidan har laddat färdigt, för annars finns den inte än.
     */
    window.onload = function staticNavbar(){
        nav = document.querySelector('nav');
    }
    
    /**
     * Om man scrollar mer än 200 pixlar neråt så ändrar jag så att nav hamnar på toppen av sidan.
    Om man scrollar uppåt igen, så att det är under 200 pixlar, ändras det tillbaka.
     */
    window.onscroll = function(){
        var y = window.scrollY;
        if(y > 200){
            nav.style.position = 'fixed';
            nav.style.top = '0px';
        } else {
            nav.style.position = 'unset';
        }
    };
        
}());

/*
DOM = Document Object Model. När html koden parsars av webbläsaren så byggs den ihop till en modell, som är en standard på hur kod ska tolkas. 
Taggarna blir till objekt med olika variabler och funktioner i javascript. Det är denna modell man sedan kan komma åt och påverka med hjälp av javascript.
Jag länkar objektet nav till en variabel här i min kod på att sedan kunna utföra olika ändringar på det. På rad 8 gör jag länkningen, och på rad 18,19 och 21
ändrar jag på nav som finns i DOMen.
Anledningen till at jag gör window.onload innan jag kan använda DOMen är att ananrs kommer jag försöka komma åt objekt som inte finns än, om jag anropar document
innan DOM har skapats.
*/