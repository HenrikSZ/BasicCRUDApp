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
    exitEditMode()
}


function save() {
    let id = oldRow.id.slice("data-id-".length)

    let oldName = oldRow.childNodes[0].innerText
    let newName = editRow.childNodes[0].childNodes[0].value

    let oldCount = oldRow.childNodes[1].innerText
    let newCount = editRow.childNodes[1].childNodes[0].value

    let changed = false

    let data = {
        id: id
    }

    if (oldName != newName) {
        data.name = newName
        changed = true
    }
    if (oldCount != newCount) {
        data.count = newCount
        changed = true
    }

    if (changed) {
        let request = new XMLHttpRequest()
        request.open("PUT", "/inventory", true);
        request.setRequestHeader("Content-Type", "application/json");
    
        request.onreadystatechange = function() {
            if (request.readyState == request.DONE) {
                // TODO: Error handling
                oldRow.childNodes[0].innerText = newName;
                oldRow.childNodes[1].innerText = newCount;
                exitEditMode();
            }
        }

        request.send(JSON.stringify(data));
    } else {
        exitEditMode();
    }
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

    saveBtn.addEventListener("click", save)
    discardBtn.addEventListener("click", discard)

    nameCell.appendChild(nameEdit)
    countCell.appendChild(countEdit)
    saveCell.appendChild(saveBtn)
    discardCell.appendChild(discardBtn)

    newRow.appendChild(nameCell)
    newRow.appendChild(countCell)
    newRow.appendChild(saveCell)
    newRow.appendChild(discardCell)

    oldRow = row
    editRow = newRow

    row.parentNode.replaceChild(newRow, row)
}


function exitEditMode() {
    editRow.parentNode.replaceChild(oldRow, editRow)

    editRow = oldRow = null
}


let editRow = null
let oldRow = null

document.addEventListener("DOMContentLoaded", getData)
