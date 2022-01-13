function getData() {
    let request = new XMLHttpRequest();
    request.open("GET", "/inventory", true);

    request.onload = function() {
        if (this.responseType == "json") {
            populate(this.response);
        } else {
            populate(JSON.parse(this.responseText));
        }
    }

    request.send()
}


function populate(obj) {
    let wrapper = document.getElementById("data-wrapper");
    wrapper.innerHTML = ""

    let table = document.createElement("table");
    let tableHeader = document.createElement("tr");
    
    let nameColHeader = document.createElement("th");
    let countColHeader = document.createElement("th");

    nameColHeader.innerText = "Item Name"
    countColHeader.innerText = "Item Count"

    tableHeader.appendChild(nameColHeader)
    tableHeader.appendChild(countColHeader)

    table.appendChild(tableHeader)

    for (let line of obj) {
        let row = document.createElement("tr");
        let name = document.createElement("td");
        let count = document.createElement("td");

        name.innerText = line.name;
        count.innerText = line.count;

        row.appendChild(name);
        row.appendChild(count);

        table.appendChild(row);
    }

    wrapper.appendChild(table);
}

document.addEventListener("DOMContentLoaded", getData)
