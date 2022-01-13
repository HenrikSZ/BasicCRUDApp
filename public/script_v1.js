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
        let editCell = document.createElement("td");
        let deleteCell = document.createElement("td");
        let editBtn = document.createElement("button");
        let deleteBtn = document.createElement("button");

        editBtn.addEventListener("click", enterEditMode)

        name.innerText = line.name;
        count.innerText = line.count;
        editCell.appendChild(editBtn);
        deleteCell.appendChild(deleteBtn);

        editBtn.innerText = "edit";
        deleteBtn.innerText = "delete";

        row.id = "data-id-" + line.id

        row.appendChild(name);
        row.appendChild(count);
        row.appendChild(editCell);
        row.appendChild(deleteCell);

        table.appendChild(row);
    }

    wrapper.appendChild(table);
}


function discard() {
    editRow.parentNode.replaceChild(rowNotShown, editRow)

    editRow = rowNotShown = null
}


function enterEditMode(evt) {
    if (editRow) {
        discard()
    }

    let row = evt.target.parentNode.parentNode
    let newRow = document.createElement("tr")

    let nameCell = document.createElement("td")
    let countCell = document.createElement("td")
    let saveCell = document.createElement("td")
    let discardCell = document.createElement("td")

    let nameEdit = document.createElement("input")
    let countEdit = document.createElement("input")
    let saveBtn = document.createElement("button");
    let discardBtn = document.createElement("button");

    nameEdit.value = row.childNodes[0].textContent
    countEdit.value = row.childNodes[1].textContent
    countEdit.type = "number"
    saveBtn.innerText = "save"
    discardBtn.innerText = "discard"

    discardBtn.addEventListener("click", discard)

    nameCell.appendChild(nameEdit)
    countCell.appendChild(countEdit)
    saveCell.appendChild(saveBtn)
    discardCell.appendChild(discardBtn)

    newRow.appendChild(nameCell)
    newRow.appendChild(countCell)
    newRow.appendChild(saveCell)
    newRow.appendChild(discardCell)

    rowNotShown = row
    editRow = newRow

    row.parentNode.replaceChild(newRow, row)
}


let editRow = null
let rowNotShown = null

document.addEventListener("DOMContentLoaded", getData)
